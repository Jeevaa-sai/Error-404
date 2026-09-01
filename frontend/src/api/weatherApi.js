// Wind comes from OpenWeather via our own backend rather than from a weather
// provider directly, so OPENWEATHER_API_KEY stays on the server instead of
// being shipped in this bundle where any visitor could read it.
const API_BASE = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8000`;

export async function fetchCurrentWind(lat, lon) {
  const response = await fetch(`${API_BASE}/weather?lat=${lat}&lon=${lon}`);

  if (!response.ok) {
    // The backend explains why (no key configured, provider unreachable,
    // nothing for this location) — surface that rather than a bare status.
    let detail = null;
    try {
      detail = (await response.json())?.detail;
    } catch {
      // Non-JSON error body — fall through to the generic message.
    }
    throw new Error(detail || `Weather unavailable (${response.status})`);
  }

  const data = await response.json();
  if (data.wind_speed_mps == null || data.wind_direction_deg == null) {
    throw new Error("Weather service returned no wind data for this location");
  }

  return {
    windSpeedMps: data.wind_speed_mps,
    windDirectionDeg: data.wind_direction_deg,
  };
}
