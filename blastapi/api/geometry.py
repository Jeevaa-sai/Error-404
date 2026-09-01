import math
try:
    from .projection import offset_meters_to_latlon
except ImportError:
    from projection import offset_meters_to_latlon


def generate_wind_stretched_polygon(
    center_lat, center_lon,
    isotropic_radius_m,
    wind_speed_mps, wind_direction_deg,
    stretch_coefficient=0.05,
    num_points=36,
):
    """
    Takes a plain (isotropic) radius from the physics model and produces an
    ellipse elongated downwind and compressed upwind (relative to the
    facility itself), approximating flame tilt / plume drift under wind.

    DOCUMENTED SIMPLIFICATION: this is an honest engineering simplification
    of flame-tilt/plume-drift geometry, not a full CFD wind model. State
    this explicitly in the demo write-up.

    semi_major_axis = isotropic_radius_m * (1 + stretch_coefficient * wind_speed_mps)
    semi_minor_axis = isotropic_radius_m * (1 - 0.3 * stretch_coefficient * wind_speed_mps)

    CORRECTION vs. the naive version of this approach: an ellipse centered
    ON the facility is fore-aft symmetric by construction — both ends of
    its major axis sit exactly semi_major_axis away, so "elongated downwind,
    compressed upwind" cannot actually be expressed relative to the facility
    that way, only relative to the ellipse's own (uninformative) center.
    To get real fore-aft asymmetry, the ellipse's center is shifted downwind
    by (semi_major - isotropic_radius_m), so the facility sits near the
    ellipse's upwind edge rather than its middle:
      - upwind extent from facility stays isotropic_radius_m (unchanged
        by wind — matches the "compressed" requirement relative to a
        stretched downwind side)
      - downwind extent from facility becomes 2*semi_major - isotropic_radius_m
        (grows with wind speed)

    The ellipse's major axis is oriented along the DOWNWIND direction
    (wind_direction_deg + 180), since wind_direction_deg is the direction
    wind is COMING FROM.

    Returns a closed ring: list of (lat, lon) tuples, first == last point.
    """
    semi_major = isotropic_radius_m * (1 + stretch_coefficient * wind_speed_mps)
    semi_minor = isotropic_radius_m * max(
        0.15, (1 - 0.3 * stretch_coefficient * wind_speed_mps)
    )
    downwind_bearing_deg = (wind_direction_deg + 180) % 360
    phi = math.radians(downwind_bearing_deg)

    center_shift_m = semi_major - isotropic_radius_m
    shift_east_m = center_shift_m * math.sin(phi)
    shift_north_m = center_shift_m * math.cos(phi)

    ring = []
    for i in range(num_points):
        t = 2 * math.pi * i / num_points
        x_local = semi_major * math.cos(t)
        y_local = semi_minor * math.sin(t)

        east_m = shift_east_m + x_local * math.sin(phi) + y_local * math.cos(phi)
        north_m = shift_north_m + x_local * math.cos(phi) - y_local * math.sin(phi)

        lat, lon = offset_meters_to_latlon(center_lat, center_lon, east_m, north_m)
        ring.append((lat, lon))

    ring.append(ring[0])
    return ring


def describe_wind_effect(wind_speed_mps, wind_direction_deg, stretch_coefficient=0.05):
    """Report how the wind reshapes a zone, using the same maths as
    generate_wind_stretched_polygon, so the UI can explain the shape.

    Extents are returned as multiples of the isotropic radius:
      - downwind_stretch: how far the zone reaches with the wind
      - crosswind_stretch: how far it reaches side-on
    The upwind reach always stays at 1.0 (see the note above).
    """
    semi_major_ratio = 1 + stretch_coefficient * wind_speed_mps
    crosswind_ratio = max(0.15, 1 - 0.3 * stretch_coefficient * wind_speed_mps)
    downwind_ratio = 2 * semi_major_ratio - 1
    downwind_bearing_deg = (wind_direction_deg + 180) % 360

    if wind_speed_mps <= 0:
        explanation = (
            "With no wind the zones stay circular — every direction is equally exposed."
        )
    else:
        explanation = (
            f"Wind from {wind_direction_deg:.0f}° at {wind_speed_mps:.1f} m/s pushes the "
            f"plume toward {downwind_bearing_deg:.0f}°, stretching the downwind reach to "
            f"{downwind_ratio:.2f}x the still-air radius and narrowing the sides to "
            f"{crosswind_ratio:.2f}x. The upwind edge stays at the still-air radius."
        )

    return {
        "wind_speed_mps": round(float(wind_speed_mps), 2),
        "wind_direction_deg": round(float(wind_direction_deg), 1),
        "downwind_bearing_deg": round(downwind_bearing_deg, 1),
        "downwind_stretch": round(downwind_ratio, 3),
        "crosswind_stretch": round(crosswind_ratio, 3),
        "explanation": explanation,
    }
