# Sources:
# - density_kg_per_m3 (liquid density at storage conditions): engineering
#   handbook values (Perry's Chemical Engineers' Handbook; NIST webbook for
#   LNG/methane at saturation).
# - heat_of_combustion_kj_per_kg (lower heating value, LHV): standard fuel
#   property tables (Perry's; EPA fuel emission factor tables).
# - chi_r (radiative fraction of combustion energy for a pool fire): Mudan &
#   Croce, "Fire Hazard Calculations for Large Open Hydrocarbon Fires," SFPE
#   Handbook of Fire Protection Engineering. LNG/methane fires burn cleaner
#   (less soot) and radiate a smaller fraction than heavier hydrocarbons.
# - mass_burning_rate_kg_m2_s: Babrauskas, "Estimating Large Pool Fire
#   Burning Rates," Fire Technology, 1983 — the standard citation for these
#   figures.

FUEL_PROPERTIES = {
    "propane": {
        "density_kg_per_m3": 500.0,
        "heat_of_combustion_kj_per_kg": 46000.0,
        "chi_r": 0.30,
        "mass_burning_rate_kg_m2_s": 0.099,
    },
    "lng": {
        "density_kg_per_m3": 450.0,
        "heat_of_combustion_kj_per_kg": 50000.0,
        "chi_r": 0.18,
        "mass_burning_rate_kg_m2_s": 0.078,
    },
    "gasoline": {
        "density_kg_per_m3": 740.0,
        "heat_of_combustion_kj_per_kg": 44000.0,
        "chi_r": 0.35,
        "mass_burning_rate_kg_m2_s": 0.055,
    },
    "diesel": {
        "density_kg_per_m3": 840.0,
        "heat_of_combustion_kj_per_kg": 43000.0,
        "chi_r": 0.32,
        "mass_burning_rate_kg_m2_s": 0.045,
    },
    "kerosene": {
        "density_kg_per_m3": 810.0,
        "heat_of_combustion_kj_per_kg": 43000.0,
        "chi_r": 0.35,
        "mass_burning_rate_kg_m2_s": 0.039,
    },
    "crude_oil": {
        "density_kg_per_m3": 870.0,
        "heat_of_combustion_kj_per_kg": 42500.0,
        "chi_r": 0.25,
        "mass_burning_rate_kg_m2_s": 0.0334,
    },
    "ethanol": {
        "density_kg_per_m3": 789.0,
        "heat_of_combustion_kj_per_kg": 26800.0,
        "chi_r": 0.15,
        "mass_burning_rate_kg_m2_s": 0.017,
    },
    "butane": {
        "density_kg_per_m3": 580.0,
        "heat_of_combustion_kj_per_kg": 45700.0,
        "chi_r": 0.30,
        "mass_burning_rate_kg_m2_s": 0.078,
    },
}

def get_fuel_properties(fuel_type):
    """
    Returns {'density_kg_per_m3': float, 'heat_of_combustion_kj_per_kg': float,
             'chi_r': float, 'mass_burning_rate_kg_m2_s': float}
    Raises ValueError if fuel_type not in the table.
    """
    key = fuel_type.lower()
    if key not in FUEL_PROPERTIES:
        raise ValueError(
            f"Unknown fuel_type '{fuel_type}'. Supported: {list(FUEL_PROPERTIES)}"
        )
    return FUEL_PROPERTIES[key]
