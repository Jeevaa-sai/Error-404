import math

METERS_PER_DEGREE_LAT = 111320.0

def offset_meters_to_latlon(center_lat, center_lon, dx_m, dy_m):
    """
    Converts a local (x, y) offset in meters from a center point into
    (lat, lon) coordinates, using the standard small-distance approximation.

    delta_lat = dy_m / 111320
    delta_lon = dx_m / (111320 * cos(radians(center_lat)))

    Fine for facility-scale distances (hundreds of meters to a few km);
    full geodesic accuracy is not required for this problem.
    """
    delta_lat = dy_m / METERS_PER_DEGREE_LAT
    delta_lon = dx_m / (METERS_PER_DEGREE_LAT * math.cos(math.radians(center_lat)))
    return (center_lat + delta_lat, center_lon + delta_lon)
