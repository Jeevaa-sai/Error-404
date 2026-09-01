import { apiFetch } from "./config";

// Wind comes from OpenWeather via our own backend rather than from a weather
// provider directly, so OPENWEATHER_API_KEY stays on the server instead of
// being shipped in this bundle where any visitor could read it.
export async function fetchCurrentWind(lat, lon) {
  const data = await apiFetch(`/weather?lat=${lat}&lon=${lon}`, { timeoutMs: 10000 });

  if (data.wind_speed_mps == null || data.wind_direction_deg == null) {
    throw new Error("Weather service returned no wind data for this location");
  }

  return {
    windSpeedMps: data.wind_speed_mps,
    windDirectionDeg: data.wind_direction_deg,
  };
}
