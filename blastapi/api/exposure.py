def calculate_environment_multiplier(environment=None):
    """Create a simple, explainable exposure multiplier from site conditions.

    This is intentionally lightweight and not a full CFD or consequence model.
    It just gives the API a way to express how nearby vehicles, trees, terrain,
    and occupancy change the effective hazard footprint in a defensible manner.
    """
    if environment is None:
        environment = {}

    tree_density = float(environment.get("tree_density", 0.0))
    vehicle_density = float(environment.get("vehicle_density", 0.0))
    nearby_buildings = float(environment.get("nearby_buildings", 0))
    terrain_roughness = float(environment.get("terrain_roughness", 0.0))
    occupancy_risk = float(environment.get("occupancy_risk", 0.0))

    tree_factor = 1.0 + (tree_density * 0.08)
    vehicle_factor = 1.0 + (vehicle_density * 0.12)
    building_factor = 1.0 + (nearby_buildings * 0.05)
    terrain_factor = 1.0 - (terrain_roughness * 0.07)
    occupancy_factor = 1.0 + (occupancy_risk * 0.10)

    overall_multiplier = (
        tree_factor
        * vehicle_factor
        * building_factor
        * max(0.5, min(1.5, terrain_factor))
        * occupancy_factor
    )

    return {
        "tree_factor": round(tree_factor, 3),
        "vehicle_factor": round(vehicle_factor, 3),
        "building_factor": round(building_factor, 3),
        "terrain_factor": round(max(0.5, min(1.5, terrain_factor)), 3),
        "occupancy_factor": round(occupancy_factor, 3),
        "overall_multiplier": round(overall_multiplier, 3),
    }
