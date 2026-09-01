import { polygonBounds, pointInPolygon } from "../utils/geo";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const CRITICAL_TAGS = {
  hospital: "amenity=hospital",
  clinic: "amenity=clinic",
  school: "amenity=school",
  kindergarten: "amenity=kindergarten",
  fire_station: "amenity=fire_station",
  police: "amenity=police",
};

// Queries OSM (via Overpass) for buildings and critical-infrastructure
// amenities inside the bounding box of the given ring, then filters to
// only those actually inside the polygon (not just the box).
export async function fetchExposure(ring, { signal } = {}) {
  const { minLat, maxLat, minLon, maxLon } = polygonBounds(ring);
  const bbox = `${minLat},${minLon},${maxLat},${maxLon}`;

  const query = `
    [out:json][timeout:20];
    (
      way["building"](${bbox});
      node["amenity"~"^(hospital|clinic|school|kindergarten|fire_station|police)$"](${bbox});
      way["amenity"~"^(hospital|clinic|school|kindergarten|fire_station|police)$"](${bbox});
    );
    out center;
  `.trim();

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    body: query,
    signal,
  });
  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }
  const data = await response.json();

  let buildingCount = 0;
  const criticalSites = [];

  for (const el of data.elements || []) {
    const lat = el.type === "node" ? el.lat : el.center?.lat;
    const lon = el.type === "node" ? el.lon : el.center?.lon;
    if (lat == null || lon == null) continue;
    if (!pointInPolygon([lat, lon], ring)) continue;

    const amenity = el.tags?.amenity;
    if (amenity && CRITICAL_TAGS[amenity]) {
      criticalSites.push({
        type: amenity,
        name: el.tags?.name || null,
        lat,
        lon,
      });
    } else if (el.tags?.building) {
      buildingCount++;
    }
  }

  return { buildingCount, criticalSites };
}
