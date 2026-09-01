import json
import os
from datetime import datetime, timezone
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


def _fallback_weather(lat, lon):
    seed = abs(lat) + abs(lon)
    wind_speed_mps = 2.5 + (seed % 7.0) * 0.8
    wind_direction_deg = int((seed * 19.0) % 360)
    gust_mps = wind_speed_mps + 1.5
    return {
        "source": "fallback",
        "wind_speed_mps": round(wind_speed_mps, 1),
        "wind_direction_deg": wind_direction_deg,
        "gust_mps": round(gust_mps, 1),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "confidence": "fallback",
    }


def get_weather_for_location(lat, lon, use_live_weather=True):
    """Return live weather if available, otherwise a deterministic fallback."""
    if not use_live_weather:
        result = _fallback_weather(lat, lon)
        result["source"] = "manual"
        result["confidence"] = "manual"
        return result

    api_key = os.getenv("OPENWEATHER_API_KEY")
    if api_key:
        params = urlencode({
            "lat": lat,
            "lon": lon,
            "appid": api_key,
            "units": "metric",
        })
        url = f"https://api.openweathermap.org/data/2.5/weather?{params}"
        request = Request(url, headers={"User-Agent": "DER-02-API/1.0"})
        try:
            with urlopen(request, timeout=5) as response:
                payload = json.loads(response.read().decode("utf-8"))
            wind = payload.get("wind", {})
            if wind.get("speed") is not None:
                return {
                    "source": "openweather",
                    "wind_speed_mps": float(wind["speed"]),
                    "wind_direction_deg": float(wind.get("deg", 0.0)),
                    "gust_mps": float(wind.get("gust", float(wind.get("speed", 0.0)) + 1.0)),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "confidence": "live",
                }
        except (URLError, TimeoutError, ValueError, KeyError):
            pass

    return _fallback_weather(lat, lon)
