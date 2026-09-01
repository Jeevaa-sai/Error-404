import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import math
from geometry import generate_wind_stretched_polygon
from projection import offset_meters_to_latlon

CENTER_LAT, CENTER_LON = 13.0067, 80.2206

def _distance_m(lat, lon, center_lat, center_lon):
    dlat = (lat - center_lat) * 111320
    dlon = (lon - center_lon) * 111320 * math.cos(math.radians(center_lat))
    return math.sqrt(dlat ** 2 + dlon ** 2)

def test_polygon_is_closed_ring():
    ring = generate_wind_stretched_polygon(CENTER_LAT, CENTER_LON, 100, 5, 45)
    assert ring[0] == ring[-1]

def test_polygon_has_requested_point_count():
    ring = generate_wind_stretched_polygon(CENTER_LAT, CENTER_LON, 100, 5, 45, num_points=24)
    assert len(ring) == 25  # +1 for closing point

def test_zero_wind_gives_near_circle():
    ring = generate_wind_stretched_polygon(CENTER_LAT, CENTER_LON, 100, 0, 0)
    dists = [_distance_m(lat, lon, CENTER_LAT, CENTER_LON) for lat, lon in ring[:-1]]
    assert max(dists) - min(dists) < 1.0

def test_wind_elongates_downwind_and_compresses_upwind():
    # wind_direction_deg = 0 means wind comes FROM north, so it blows
    # southward -> hazard zone should extend further SOUTH (downwind) than
    # NORTH (upwind), relative to the facility itself.
    ring = generate_wind_stretched_polygon(CENTER_LAT, CENTER_LON, 100, 10, 0)
    dists_by_point = [(lat, lon, _distance_m(lat, lon, CENTER_LAT, CENTER_LON)) for lat, lon in ring[:-1]]

    north_dist = max(d for lat, lon, d in dists_by_point if lat > CENTER_LAT)
    south_dist = max(d for lat, lon, d in dists_by_point if lat < CENTER_LAT)

    assert south_dist > north_dist
    # upwind extent should stay close to the original isotropic radius
    assert abs(north_dist - 100) < 5

def test_stronger_wind_stretches_more():
    ring_light = generate_wind_stretched_polygon(CENTER_LAT, CENTER_LON, 100, 2, 0)
    ring_strong = generate_wind_stretched_polygon(CENTER_LAT, CENTER_LON, 100, 15, 0)

    max_dist_light = max(_distance_m(lat, lon, CENTER_LAT, CENTER_LON) for lat, lon in ring_light[:-1])
    max_dist_strong = max(_distance_m(lat, lon, CENTER_LAT, CENTER_LON) for lat, lon in ring_strong[:-1])

    assert max_dist_strong > max_dist_light
