import json
import os
from datetime import datetime, timezone
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

# OpenWeather is the project's single weather provider. The key is read from
# the environment (see api/config.py, which loads blastapi/.env) and never
# leaves the server — the browser reaches OpenWeather through GET /weather
# rather than calling it directly, so the key is not shipped to clients.
OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
REQUEST_TIMEOUT_S = 5
USER_AGENT = "DER-02-API/1.0"


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _get_json(url):
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=REQUEST_TIMEOUT_S) as response:
        return json.loads(response.read().decode("utf-8"))


def _as_utc_iso(epoch_seconds):
    """OpenWeather reports observation time as a Unix epoch in `dt`. Convert it
    to an explicit UTC string — a naive timestamp would be parsed as local time
    by JavaScript's Date, skewing "last updated" by the viewer's offset.
    """
    if epoch_seconds is None:
        return _now_iso()
    try:
        return datetime.fromtimestamp(float(epoch_seconds), tz=timezone.utc).isoformat()
    except (TypeError, ValueError, OSError):
        return _now_iso()


def fetch_openweather(lat, lon):
    """Measured conditions from the nearest station.

    Returns None when no key is configured or the response carries no wind,
    and raises the underlying error if the request itself fails, so callers
    can decide whether to fall back or surface the problem.
    """
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return None

    params = urlencode({"lat": lat, "lon": lon, "appid": api_key, "units": "metric"})
    payload = _get_json(f"{OPENWEATHER_URL}?{params}")
    wind = payload.get("wind", {})
    if wind.get("speed") is None:
        return None

    speed = float(wind["speed"])
    gust = wind.get("gust")
    return {
        "source": "openweather",
        "wind_speed_mps": round(speed, 1),
        "wind_direction_deg": float(wind.get("deg", 0.0)) % 360,
        "gust_mps": round(float(gust), 1) if gust is not None else None,
        "timestamp": _as_utc_iso(payload.get("dt")),
        "confidence": "live",
    }


def _fallback_weather(lat, lon):
    """Deterministic stand-in used when OpenWeather is unavailable.

    Derived from the coordinates so a given site always renders the same way,
    which keeps demos and screenshots reproducible offline. It is not a
    measurement, and is reported as confidence "fallback" so the UI says so.
    """
    seed = abs(lat) + abs(lon)
    wind_speed_mps = 2.5 + (seed % 7.0) * 0.8
    wind_direction_deg = int((seed * 19.0) % 360)
    return {
        "source": "fallback",
        "wind_speed_mps": round(wind_speed_mps, 1),
        "wind_direction_deg": wind_direction_deg,
        "gust_mps": round(wind_speed_mps + 1.5, 1),
        "timestamp": _now_iso(),
        "confidence": "fallback",
    }


def get_weather_for_location(lat, lon, use_live_weather=True):
    """Return live OpenWeather conditions, otherwise a stand-in."""
    if not use_live_weather:
        result = _fallback_weather(lat, lon)
        result["source"] = "manual"
        result["confidence"] = "manual"
        return result

    try:
        result = fetch_openweather(lat, lon)
    except (URLError, TimeoutError, OSError, ValueError, KeyError):
        result = None

    return result or _fallback_weather(lat, lon)
