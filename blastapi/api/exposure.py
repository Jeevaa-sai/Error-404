# Each environmental input scales the hazard radius by a fixed amount per unit
# of input. These are deliberately simple, transparent coefficients — not a CFD
# or consequence model — so the UI can explain every metre of expansion.
#   tree_density      0..1  fraction of the surroundings under tree cover
#   vehicle_density   0..1  fraction of the surroundings occupied by vehicles
#   nearby_buildings  count of structures within the immediate area
#   terrain_roughness 0..1  broken/built-up ground that absorbs blast energy
#   occupancy_risk    0..1  how heavily the area is populated
FACTOR_SPEC = {
    "tree_density": {
        "label": "Tree density",
        "coefficient": 0.08,
        "sign": 1,
        "reason": "vegetation adds fuel that can carry fire outward",
    },
    "vehicle_density": {
        "label": "Vehicle density",
        "coefficient": 0.12,
        "sign": 1,
        "reason": "parked vehicles add fuel tanks that can rupture and extend the fire",
    },
    "nearby_buildings": {
        "label": "Nearby buildings",
        "coefficient": 0.05,
        "sign": 1,
        "reason": "structures channel and reflect blast pressure instead of letting it disperse",
    },
    "terrain_roughness": {
        "label": "Terrain roughness",
        "coefficient": 0.07,
        "sign": -1,
        "reason": "broken ground absorbs and scatters blast energy, pulling the zone in",
    },
    "occupancy_risk": {
        "label": "Occupancy risk",
        "coefficient": 0.10,
        "sign": 1,
        "reason": "a densely occupied area is treated with a wider precautionary margin",
    },
}

TERRAIN_FACTOR_FLOOR = 0.5
TERRAIN_FACTOR_CEILING = 1.5


def _describe(label, factor, reason):
    if abs(factor - 1.0) < 1e-9:
        return f"{label} is at zero, so it leaves the zones unchanged."
    percent = abs(factor - 1.0) * 100
    verb = "expands" if factor > 1.0 else "shrinks"
    return f"{label} {verb} every zone radius by {percent:.1f}% — {reason}."


def calculate_environment_multiplier(environment=None):
    """Create a simple, explainable exposure multiplier from site conditions.

    This is intentionally lightweight and not a full CFD or consequence model.
    It just gives the API a way to express how nearby vehicles, trees, terrain,
    and occupancy change the effective hazard footprint in a defensible manner.

    Returns the individual factors, the combined multiplier, and a per-input
    breakdown the UI uses to explain why a zone expanded or shrank.
    """
    if environment is None:
        environment = {}
    if hasattr(environment, "model_dump"):
        environment = environment.model_dump()

    contributions = []
    factors = {}
    overall_multiplier = 1.0

    for key, spec in FACTOR_SPEC.items():
        value = float(environment.get(key, 0.0) or 0.0)
        factor = 1.0 + spec["sign"] * value * spec["coefficient"]
        if key == "terrain_roughness":
            factor = max(TERRAIN_FACTOR_FLOOR, min(TERRAIN_FACTOR_CEILING, factor))

        factor = round(factor, 3)
        factors[key] = factor
        overall_multiplier *= factor

        if abs(factor - 1.0) < 1e-9:
            direction = "none"
        elif factor > 1.0:
            direction = "expand"
        else:
            direction = "shrink"

        contributions.append({
            "key": key,
            "label": spec["label"],
            "input_value": value,
            "factor": factor,
            "percent_change": round((factor - 1.0) * 100, 1),
            "direction": direction,
            "explanation": _describe(spec["label"], factor, spec["reason"]),
        })

    overall_multiplier = round(overall_multiplier, 3)

    return {
        "tree_factor": factors["tree_density"],
        "vehicle_factor": factors["vehicle_density"],
        "building_factor": factors["nearby_buildings"],
        "terrain_factor": factors["terrain_roughness"],
        "occupancy_factor": factors["occupancy_risk"],
        "overall_multiplier": overall_multiplier,
        "overall_percent_change": round((overall_multiplier - 1.0) * 100, 1),
        "contributions": contributions,
    }
