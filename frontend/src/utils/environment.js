// Shared with blastapi/api/exposure.py — keep the coefficients in step so the
// preview shown in the form matches what the API returns.
export const DEFAULT_ENVIRONMENT = {
  tree_density: 0,
  vehicle_density: 0,
  nearby_buildings: 0,
  terrain_roughness: 0,
  occupancy_risk: 0,
};

// Mirrors FACTOR_SPEC in blastapi/api/exposure.py — keep the coefficients in
// step so the preview shown here matches what the API returns.
export const ENVIRONMENT_FIELDS = [
  {
    key: "tree_density", label: "Tree density", kind: "fraction",
    coefficient: 0.08, sign: 1,
    hint: "Vegetation around the site that can carry fire outward.",
  },
  {
    key: "vehicle_density", label: "Vehicle density", kind: "fraction",
    coefficient: 0.12, sign: 1,
    hint: "Parked vehicles add fuel tanks that can rupture and extend the fire.",
  },
  {
    key: "nearby_buildings", label: "Nearby buildings", kind: "count",
    coefficient: 0.05, sign: 1, max: 20,
    hint: "Structures reflect and channel blast pressure instead of dispersing it.",
  },
  {
    key: "terrain_roughness", label: "Terrain roughness", kind: "fraction",
    coefficient: 0.07, sign: -1,
    hint: "Broken ground absorbs blast energy and pulls the zones in.",
  },
  {
    key: "occupancy_risk", label: "Occupancy risk", kind: "fraction",
    coefficient: 0.10, sign: 1,
    hint: "A densely occupied area gets a wider precautionary margin.",
  },
];

// Local preview of the multiplier so the operator sees the effect before
// recomputing. The API result is authoritative and replaces this once returned.
export function previewMultiplier(environment) {
  return ENVIRONMENT_FIELDS.reduce((acc, field) => {
    const value = Number(environment?.[field.key]) || 0;
    let factor = 1 + field.sign * value * field.coefficient;
    if (field.key === "terrain_roughness") factor = Math.max(0.5, Math.min(1.5, factor));
    return acc * factor;
  }, 1);
}
