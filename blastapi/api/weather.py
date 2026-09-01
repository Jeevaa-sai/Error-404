import json
import os
from datetime import datetime, timezone
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

# Providers are tried in order. Open-Meteo needs no API key, so live weather
# works out of the box; OpenWeather is preferred when a key is configured
# because it reports measured station data rather than a forecast grid.
REQUEST_TIMEOUT_S = 5
USER_AGENT = "DER-02-API/1.0"


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _as_utc_iso(value):
    """Normalise Open-Meteo's naive "2026-09-01T17:15" into an explicit UTC
    timestamp. Without the offset, JavaScript's Date parses it as local time
    and "last updated" is wrong by the viewer's timezone.
    """
    if not value:
        return _now_iso()
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return _now_iso()
    if parsed.tzinfo is None:
        # The request omits &timezone=, so Open-Meteo answers in GMT.
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).isoformat()


def _get_json(url):
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=REQUEST_TIMEOUT_S) as response:
        return json.loads(response.read().decode("utf-8"))


def _fetch_openweather(lat, lon):
    """Measured conditions from the nearest station. Requires an API key."""
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return None

    params = urlencode({"lat": lat, "lon": lon, "appid": api_key, "units": "metric"})
    payload = _get_json(f"https://api.openweathermap.org/data/2.5/weather?{params}")
    wind = payload.get("wind", {})
    if wind.get("speed") is None:
        return None

    speed = float(wind["speed"])
    return {
        "source": "openweather",
        "wind_speed_mps": round(speed, 1),
        "wind_direction_deg": float(wind.get("deg", 0.0)),
        "gust_mps": round(float(wind.get("gust", speed + 1.0)), 1),
        "timestamp": _now_iso(),
        "confidence": "live",
    }


def _fetch_open_meteo(lat, lon):
    """Forecast-grid conditions. No API key, so this is the default live source."""
    params = urlencode({
        "latitude": lat,
        "longitude": lon,
        "current": "wind_speed_10m,wind_direction_10m,wind_gusts_10m",
        "wind_speed_unit": "ms",
    })
    payload = _get_json(f"https://api.open-meteo.com/v1/forecast?{params}")
    current = payload.get("current", {})
    speed = current.get("wind_speed_10m")
    direction = current.get("wind_direction_10m")
    if speed is None or direction is None:
        return None

    gust = current.get("wind_gusts_10m")
    return {
        "source": "open-meteo",
        "wind_speed_mps": round(float(speed), 1),
        "wind_direction_deg": float(direction) % 360,
        "gust_mps": round(float(gust), 1) if gust is not None else None,
        # Open-Meteo reports the observation time of the grid cell, which can
        # lag the request by up to its 15-minute interval. Prefer it over
        # "now" so the panel's "last updated" reflects the data, not the call.
        "timestamp": _as_utc_iso(current.get("time")),
        "confidence": "live",
    }


def _fallback_weather(lat, lon):
    """Deterministic stand-in used only when every live provider is unreachable.

    Derived from the coordinates so a given site always renders the same way,
    which keeps demos and screenshots reproducible offline. It is not a
    measurement, and is reported as confidence "fallback" so the UI can say so.
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
    """Return live weather if any provider answers, otherwise a stand-in."""
    if not use_live_weather:
        result = _fallback_weather(lat, lon)
        result["source"] = "manual"
        result["confidence"] = "manual"
        return result

    for provider in (_fetch_openweather, _fetch_open_meteo):
        try:
            result = provider(lat, lon)
        except (URLError, TimeoutError, OSError, ValueError, KeyError):
            continue
        if result:
            return result

    return _fallback_weather(lat, lon)
