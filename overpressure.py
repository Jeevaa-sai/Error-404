SCALED_DISTANCE_MIN = 1.0
SCALED_DISTANCE_MAX = 10.0

def calculate_overpressure_kpa(distance_m, tnt_mass_kg):
    """
    Simplified power-law fit to the Kingery-Bulmash scaled-distance blast
    correlation (Kingery & Bulmash, 1984; refined by Swisdak, 1994),
    commonly used as a quick engineering approximation for hemispherical
    surface burst overpressure.

    Z = distance_m / (tnt_mass_kg ** (1/3))     # scaled distance, m/kg^(1/3)
    delta_P_kPa = 114 / (Z ** 1.6)

    Valid roughly for 1 < Z < 10 m/kg^(1/3). Outside this range the fit
    diverges from the real Kingery-Bulmash tables; a warning is printed
    rather than silently returning a nonsense number.

    Units: distance_m in meters, tnt_mass_kg in kg TNT-equivalent,
    returns overpressure in kPa.
    """
    z = distance_m / (tnt_mass_kg ** (1 / 3))
    if not (SCALED_DISTANCE_MIN < z < SCALED_DISTANCE_MAX):
        print(f"WARNING: scaled distance Z={z:.2f} is outside validated "
              f"range ({SCALED_DISTANCE_MIN}, {SCALED_DISTANCE_MAX}) m/kg^(1/3); "
              f"result is an extrapolation, treat with caution.")
    return 114.0 / (z ** 1.6)

def solve_radius_for_overpressure(target_kpa, tnt_mass_kg):
    """
    INVERSE of calculate_overpressure_kpa. Given a target overpressure
    threshold (a severity band boundary, in kPa), solves for the distance
    R (m) at which that overpressure occurs.

    Z = (114 / target_kpa) ** (1/1.6)
    R = Z * (tnt_mass_kg ** (1/3))

    This is the function the geometry engine calls to get the radius of
    each severity band ring.
    """
    z = (114.0 / target_kpa) ** (1 / 1.6)
    return z * (tnt_mass_kg ** (1 / 3))
