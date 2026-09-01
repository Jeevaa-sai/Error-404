const FIELDS = [
  "lat", "lon", "tank_volume_m3", "tank_diameter_m",
  "fuel_type", "wind_speed_mps", "wind_direction_deg",
];

export function facilityToSearchParams(facility) {
  const params = new URLSearchParams();
  for (const key of FIELDS) {
    if (facility[key] !== null && facility[key] !== undefined && facility[key] !== "") {
      params.set(key, facility[key]);
    }
  }
  return params;
}

export function buildShareUrl(facility) {
  const params = facilityToSearchParams(facility);
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

// Returns a facility object from the current URL's query string, or null
// if it doesn't carry a full scenario (all numeric fields present and finite).
export function facilityFromLocation() {
  const params = new URLSearchParams(window.location.search);
  if (!FIELDS.every((key) => params.has(key))) return null;

  const facility = {
    lat: Number(params.get("lat")),
    lon: Number(params.get("lon")),
    tank_volume_m3: Number(params.get("tank_volume_m3")),
    tank_diameter_m: Number(params.get("tank_diameter_m")),
    fuel_type: params.get("fuel_type"),
    wind_speed_mps: Number(params.get("wind_speed_mps")),
    wind_direction_deg: Number(params.get("wind_direction_deg")),
  };

  const numericOk = [
    facility.lat, facility.lon, facility.tank_volume_m3,
    facility.tank_diameter_m, facility.wind_speed_mps, facility.wind_direction_deg,
  ].every(Number.isFinite);

  return numericOk ? facility : null;
}
