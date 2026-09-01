import json
import math
from concurrent.futures import ThreadPoolExecutor
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

# OpenStreetMap/Overpass and the elevation lookup are called from here, not
# the browser. Both are called client-side elsewhere in this app's history,
# but on networks that block or filter direct browser fetches to third-party
# API hosts (campus/corporate proxies, some ad/tracker blockers), that fails
# with a bare "Failed to fetch" the user can't act on. Proxying through the
# server we already control sidesteps that class of failure entirely, and
# matches how /weather already proxies OpenWeather.
OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"
# Overpass's free instance can genuinely take upwards of 15s under load —
# observed directly during testing — so this errs generous rather than
# aborting a request that would have succeeded a few seconds later.
REQUEST_TIMEOUT_S = 20
USER_AGENT = "DER-02-API/1.0"
RADIUS_M = 300
EARTH_RADIUS_M = 6371000.0


def _post_json(url, body, timeout=REQUEST_TIMEOUT_S):
    request = Request(url, data=body.encode("utf-8"), headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _get_json(url, timeout=REQUEST_TIMEOUT_S):
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _run_overpass_query(query):
    last_error = None
    for url in OVERPASS_MIRRORS:
        try:
            return _post_json(url, query)
        except (URLError, HTTPError, TimeoutError, OSError, ValueError) as exc:
            last_error = exc
    raise last_error or RuntimeError("All Overpass mirrors failed")


def _offset_latlon(lat, lon, north_m, east_m):
    d_lat = north_m / 111320.0
    d_lon = east_m / (111320.0 * math.cos(math.radians(lat)))
    return lat + d_lat, lon + d_lon


def _clamp01(x):
    return max(0.0, min(1.0, x))


def _point_in_polygon(lat, lon, ring):
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        lat_i, lon_i = ring[i]
        lat_j, lon_j = ring[j]
        intersects = (lat_i > lat) != (lat_j > lat) and (
            lon < (lon_j - lon_i) * (lat - lat_i) / (lat_j - lat_i) + lon_i
        )
        if intersects:
            inside = not inside
        j = i
    return inside


def fetch_exposure(min_lat, min_lon, max_lat, max_lon):
    """Buildings and critical-infrastructure amenities inside a bounding box,
    for the exposure panel's "what's inside the hazard zone" check.
    """
    bbox = f"{min_lat},{min_lon},{max_lat},{max_lon}"
    query = f"""
        [out:json][timeout:25];
        (
          way["building"]({bbox});
          node["amenity"~"^(hospital|clinic|school|kindergarten|fire_station|police)$"]({bbox});
          way["amenity"~"^(hospital|clinic|school|kindergarten|fire_station|police)$"]({bbox});
        );
        out center;
    """.strip()

    data = _run_overpass_query(query)

    elements = []
    for el in data.get("elements", []):
        if el.get("type") == "node":
            lat, lon = el.get("lat"), el.get("lon")
        else:
            center = el.get("center") or {}
            lat, lon = center.get("lat"), center.get("lon")
        if lat is None or lon is None:
            continue
        tags = el.get("tags", {})
        elements.append({
            "lat": lat, "lon": lon,
            "building": bool(tags.get("building")),
            "amenity": tags.get("amenity"),
            "name": tags.get("name"),
        })

    return elements


def _fetch_overpass_counts(lat, lon):
    around = f"around:{RADIUS_M},{lat},{lon}"
    query = f"""
        [out:json][timeout:25];
        (
          way["building"]({around});
          way["natural"="wood"]({around});
          way["landuse"="forest"]({around});
          node["natural"="tree"]({around});
          way["amenity"="parking"]({around});
          way["highway"]({around});
          node["shop"]({around});
          node["amenity"~"^(restaurant|cafe|school|office|marketplace)$"]({around});
        );
        out center;
    """.strip()

    data = _run_overpass_query(query)

    counts = {
        "buildings": 0, "tree_nodes": 0, "forest_ways": 0,
        "parking_ways": 0, "occupancy_points": 0,
    }
    street_ids = set()

    for el in data.get("elements", []):
        tags = el.get("tags", {})
        if tags.get("building"):
            counts["buildings"] += 1
        elif tags.get("natural") == "tree":
            counts["tree_nodes"] += 1
        elif tags.get("natural") == "wood" or tags.get("landuse") == "forest":
            counts["forest_ways"] += 1
        elif tags.get("amenity") == "parking":
            counts["parking_ways"] += 1
        elif tags.get("highway"):
            street_ids.add(tags.get("name") or f"way:{el.get('id')}")
        elif tags.get("shop") or tags.get("amenity"):
            counts["occupancy_points"] += 1

    counts["distinct_streets"] = len(street_ids)
    return counts


def _fetch_terrain_roughness(lat, lon):
    """Elevation spread across a 300m ring around the site — flat ground
    scores near 0, real relief scores higher. Best-effort: returns None on
    any failure so callers can omit the field rather than fail entirely.
    """
    points = [
        (lat, lon),
        _offset_latlon(lat, lon, RADIUS_M, 0),
        _offset_latlon(lat, lon, -RADIUS_M, 0),
        _offset_latlon(lat, lon, 0, RADIUS_M),
        _offset_latlon(lat, lon, 0, -RADIUS_M),
    ]
    latitudes = ",".join(f"{p[0]:.5f}" for p in points)
    longitudes = ",".join(f"{p[1]:.5f}" for p in points)

    try:
        data = _get_json(f"{ELEVATION_URL}?{urlencode({'latitude': latitudes, 'longitude': longitudes}, safe=',')}")
    except (URLError, HTTPError, TimeoutError, OSError, ValueError):
        return None

    elevations = [e for e in data.get("elevation", []) if isinstance(e, (int, float))]
    if len(elevations) < 2:
        return None

    mean = sum(elevations) / len(elevations)
    variance = sum((e - mean) ** 2 for e in elevations) / len(elevations)
    std_dev = math.sqrt(variance)
    # 20m of local elevation spread reads as "very rough" (1.0); flat ground
    # (<1m spread) reads near 0.
    return _clamp01(std_dev / 20.0)


def estimate_environment(lat, lon):
    """Derives an environment estimate from real OpenStreetMap density and
    elevation data around a facility — a rough proxy, not a survey.

    The Overpass and elevation lookups are independent network calls, so they
    run concurrently rather than one after another — urllib is blocking, so a
    thread pool is what gets them running at the same time.
    """
    with ThreadPoolExecutor(max_workers=2) as pool:
        counts_future = pool.submit(_fetch_overpass_counts, lat, lon)
        terrain_future = pool.submit(_fetch_terrain_roughness, lat, lon)
        counts = counts_future.result()
        terrain_roughness = terrain_future.result()

    return {
        "tree_density": _clamp01((counts["tree_nodes"] + counts["forest_ways"] * 5) / 40.0),
        # Weighted toward actual parking (the real vehicle signal); distinct
        # streets contribute only a small nudge so a normal, walkable block
        # doesn't read as maximum vehicle density just for having several roads.
        "vehicle_density": _clamp01((counts["parking_ways"] * 5 + counts["distinct_streets"] * 0.5) / 20.0),
        "nearby_buildings": min(counts["buildings"], 20),
        "terrain_roughness": terrain_roughness,
        "occupancy_risk": _clamp01(counts["occupancy_points"] / 15.0),
    }
