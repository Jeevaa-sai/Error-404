import { apiFetch } from "./config";

// Mirrors the backend's FacilityInput schema (blastapi/api/schemas.py).
// Values are coerced here so a form string like "50" never reaches the API,
// which would answer 422 for a field typed as a number.
function toPayload(input) {
  const env = input.environment || {};
  return {
    lat: Number(input.lat),
    lon: Number(input.lon),
    tank_volume_m3: Number(input.tank_volume_m3),
    tank_diameter_m: Number(input.tank_diameter_m),
    fuel_type: input.fuel_type,
    wind_speed_mps: Number(input.wind_speed_mps) || 0,
    // The API accepts [0, 360); 360 and any over-rotation wrap to north.
    wind_direction_deg: ((Number(input.wind_direction_deg) % 360) + 360) % 360,
    use_live_weather: Boolean(input.use_live_weather),
    environment: {
      tree_density: Number(env.tree_density) || 0,
      vehicle_density: Number(env.vehicle_density) || 0,
      // Typed as an int on the backend — a fractional value is a 422.
      nearby_buildings: Math.round(Number(env.nearby_buildings) || 0),
      terrain_roughness: Number(env.terrain_roughness) || 0,
      occupancy_risk: Number(env.occupancy_risk) || 0,
    },
  };
}

export async function calculateZones(facilityInput) {
  return apiFetch("/calculate-zones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toPayload(facilityInput)),
  });
}
