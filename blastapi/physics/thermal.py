import math
try:
    from .fuel_lookup import get_fuel_properties
except ImportError:
    from fuel_lookup import get_fuel_properties

def calculate_heat_release_rate_kw(tank_diameter_m, fuel_type):
    """
    Q_dot (kW) = mass_burning_rate_kg_m2_s * combustion_area_m2 *
                 heat_of_combustion_kj_per_kg

    combustion_area_m2 = pi * (tank_diameter_m / 2) ** 2

    mass_burning_rate_kg_m2_s comes from fuel_lookup.py (Babrauskas, 1983
    pool fire burning rate data).

    Units: tank_diameter_m in meters, returns heat release rate in kW.
    """
    props = get_fuel_properties(fuel_type)
    area_m2 = math.pi * (tank_diameter_m / 2) ** 2
    return props["mass_burning_rate_kg_m2_s"] * area_m2 * props["heat_of_combustion_kj_per_kg"]

def calculate_thermal_flux_kw_m2(distance_m, heat_release_rate_kw, chi_r):
    """
    Point-source radiation model:
    q (kW/m^2) = (chi_r * heat_release_rate_kw) / (4 * pi * distance_m ** 2)

    Valid for targets several fire diameters away from the source. Standard
    simplified form of the solid-flame radiation model (see e.g. NISTIR 6546,
    McGrattan et al., or SFPE Handbook Ch. on fire hazard calculations).

    Units: distance_m in meters, heat_release_rate_kw in kW, chi_r
    dimensionless (0-1), returns flux in kW/m^2.
    """
    return (chi_r * heat_release_rate_kw) / (4 * math.pi * distance_m ** 2)

def solve_radius_for_thermal_flux(target_kw_m2, heat_release_rate_kw, chi_r):
    """
    INVERSE of calculate_thermal_flux_kw_m2. Given a target thermal flux
    threshold (a severity band boundary, in kW/m^2), solves for the distance
    (m) at which that flux occurs.

    r = sqrt((chi_r * heat_release_rate_kw) / (4 * pi * target_kw_m2))
    """
    return math.sqrt((chi_r * heat_release_rate_kw) / (4 * math.pi * target_kw_m2))
