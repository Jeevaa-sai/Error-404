// Open-Meteo's forecast API is free and requires no API key.
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

export async function fetchCurrentWind(lat, lon) {
  const url = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }
  const data = await response.json();
  const speed = data.current?.wind_speed_10m;
  const direction = data.current?.wind_direction_10m;
  if (speed == null || direction == null) {
    throw new Error("Weather API returned no wind data for this location");
  }
  return { windSpeedMps: speed, windDirectionDeg: direction };
}
