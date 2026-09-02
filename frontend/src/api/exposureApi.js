import { polygonBounds, pointInPolygon } from "../utils/geo";
import { apiFetch } from "./config";

const CRITICAL_TAGS = {
  hospital: "amenity=hospital",
  clinic: "amenity=clinic",
  school: "amenity=school",
  kindergarten: "amenity=kindergarten",
  fire_station: "amenity=fire_station",
  police: "amenity=police",
};

// Shared with AssetAlerts/ExposurePanel so an auto-detected site and its
// manually-added counterpart read the same way everywhere in the UI.
export const CRITICAL_LABELS = {
  hospital: "Hospital",
  clinic: "Clinic",
  school: "School",
  kindergarten: "Kindergarten",
  fire_station: "Fire station",
  police: "Police station",
};

// Fetches raw OSM elements in the ring's bounding box via our own backend
// (GET /exposure), then filters to only those actually inside the polygon
// (not just the box) — same as before, just proxied so the browser doesn't
// have to reach Overpass directly (see environmentApi.js for why).
export async function fetchExposure(ring) {
  const { minLat, maxLat, minLon, maxLon } = polygonBounds(ring);
  const { elements } = await apiFetch(
    `/exposure?min_lat=${minLat}&max_lat=${maxLat}&min_lon=${minLon}&max_lon=${maxLon}`,
    { timeoutMs: 25000 }
  );

  let buildingCount = 0;
  const criticalSites = [];

  for (const el of elements) {
    if (!pointInPolygon([el.lat, el.lon], ring)) continue;

    if (el.amenity && CRITICAL_TAGS[el.amenity]) {
      criticalSites.push({ type: el.amenity, name: el.name || null, lat: el.lat, lon: el.lon });
    } else if (el.building) {
      buildingCount++;
    }
  }

  return { buildingCount, criticalSites };
}
