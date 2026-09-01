import { runOverpassQuery } from "./overpass";

// Open-Meteo's elevation endpoint (same fast, keyless provider already used
// for weather) — a single batched request, typically under 1-2s. Replaced
// Open-Elevation, whose free instance was frequently slow enough to stall
// the whole auto-fill.
const ELEVATION_URL = "https://api.open-meteo.com/v1/elevation";
const RADIUS_M = 300;
const ELEVATION_TIMEOUT_MS = 6000;

function offset(lat, lon, north_m, east_m) {
  const dLat = north_m / 111320;
  const dLon = east_m / (111320 * Math.cos((lat * Math.PI) / 180));
  return [lat + dLat, lon + dLon];
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

async function fetchOverpassCounts(lat, lon) {
  const around = `around:${RADIUS_M},${lat},${lon}`;
  const query = `
    [out:json][timeout:25];
    (
      way["building"](${around});
      way["natural"="wood"](${around});
      way["landuse"="forest"](${around});
      node["natural"="tree"](${around});
      way["amenity"="parking"](${around});
      way["highway"](${around});
      node["shop"](${around});
      node["amenity"~"^(restaurant|cafe|school|office|marketplace)$"](${around});
    );
    out center;
  `.trim();

  const data = await runOverpassQuery(query);

  const counts = {
    buildings: 0, treeNodes: 0, forestWays: 0,
    parkingWays: 0, highwayWays: 0, occupancyPoints: 0,
  };

  for (const el of data.elements || []) {
    if (el.tags?.building) counts.buildings++;
    else if (el.tags?.natural === "tree") counts.treeNodes++;
    else if (el.tags?.natural === "wood" || el.tags?.landuse === "forest") counts.forestWays++;
    else if (el.tags?.amenity === "parking") counts.parkingWays++;
    else if (el.tags?.highway) counts.highwayWays++;
    else if (el.tags?.shop || el.tags?.amenity) counts.occupancyPoints++;
  }

  return counts;
}

// Terrain roughness proxy: elevation spread across a 300 m ring — flat sites
// score near 0, sites with real relief score higher. Best-effort: callers
// should treat a failure here as "no estimate" rather than fail the whole
// environment lookup.
async function fetchTerrainRoughness(lat, lon) {
  const points = [
    [lat, lon],
    offset(lat, lon, RADIUS_M, 0),
    offset(lat, lon, -RADIUS_M, 0),
    offset(lat, lon, 0, RADIUS_M),
    offset(lat, lon, 0, -RADIUS_M),
  ];
  const latitudes = points.map(([la]) => la.toFixed(5)).join(",");
  const longitudes = points.map(([, lo]) => lo.toFixed(5)).join(",");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ELEVATION_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(
      `${ELEVATION_URL}?latitude=${latitudes}&longitude=${longitudes}`,
      { signal: controller.signal }
    );
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) throw new Error(`Elevation API error: ${response.status}`);
  const data = await response.json();
  const elevations = (data.elevation || []).filter(Number.isFinite);
  if (elevations.length < 2) throw new Error("Elevation API returned insufficient data");

  const mean = elevations.reduce((a, b) => a + b, 0) / elevations.length;
  const variance = elevations.reduce((a, b) => a + (b - mean) ** 2, 0) / elevations.length;
  const stdDev = Math.sqrt(variance);
  // 20m of local elevation spread is treated as "very rough" (1.0); flat
  // ground (<1m spread) scores near 0.
  return clamp01(stdDev / 20);
}

// Derives an environment estimate from real OpenStreetMap density and
// elevation data around the facility — a rough proxy, not a survey.
// Both lookups run in parallel; terrain roughness is best-effort and simply
// omitted (not failed) if the elevation service errors or times out.
export async function fetchEnvironmentEstimate(lat, lon) {
  const [counts, terrain_roughness] = await Promise.all([
    fetchOverpassCounts(lat, lon),
    fetchTerrainRoughness(lat, lon).catch(() => null),
  ]);

  return {
    tree_density: clamp01((counts.treeNodes + counts.forestWays * 5) / 40),
    vehicle_density: clamp01((counts.parkingWays * 3 + counts.highwayWays) / 20),
    nearby_buildings: Math.min(counts.buildings, 20),
    terrain_roughness,
    occupancy_risk: clamp01(counts.occupancyPoints / 15),
    _source: { radius_m: RADIUS_M, ...counts },
  };
}
