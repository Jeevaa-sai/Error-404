try:
    from .fuel_lookup import get_fuel_properties
except ImportError:
    from fuel_lookup import get_fuel_properties

TNT_SPECIFIC_ENERGY_KJ_PER_KG = 4184.0

def calculate_stored_energy_kj(tank_volume_m3, fuel_type):
    """
    E_stored (kJ) = tank_volume_m3 * density_kg_per_m3 * heat_of_combustion_kj_per_kg
    Returns total chemical energy stored in the tank, in kJ.
    """
    props = get_fuel_properties(fuel_type)
    mass_kg = tank_volume_m3 * props["density_kg_per_m3"]
    return mass_kg * props["heat_of_combustion_kj_per_kg"]

def calculate_tnt_equivalent_mass(tank_volume_m3, fuel_type, yield_factor=0.05):
    """
    W_TNT (kg) = yield_factor * E_stored (kJ) / 4184 (kJ/kg, TNT specific energy)

    yield_factor: fraction of stored chemical energy that actually converts
    to blast (overpressure) energy. Real vapor cloud explosions do NOT
    convert anywhere near 100% of stored energy to blast — published yield
    factors for unconfined vapor cloud explosions typically range ~0.03-0.1
    (CCPS, "Guidelines for Vapor Cloud Explosion, Pressure Vessel Burst,
    BLEVE and Flash Fire Hazards"). Default 0.05 is a mid-range, defensible
    starting assumption for an MVP model — state this explicitly if asked.
    """
    e_stored_kj = calculate_stored_energy_kj(tank_volume_m3, fuel_type)
    return (yield_factor * e_stored_kj) / TNT_SPECIFIC_ENERGY_KJ_PER_KG
