const COMPASS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

function compassLabel(deg) {
  return COMPASS[Math.round(((deg % 360) / 22.5)) % 16];
}

function maxRadiusM(bands, ringCenterLat, ringCenterLon) {
  // Approximate radius as the farthest polygon point from the facility.
  let maxR = 0;
  for (const band of bands || []) {
    for (const [lat, lon] of band.polygon) {
      const dLat = (lat - ringCenterLat) * 111320;
      const dLon = (lon - ringCenterLon) * 111320 * Math.cos((ringCenterLat * Math.PI) / 180);
      const r = Math.sqrt(dLat * dLat + dLon * dLon);
      if (r > maxR) maxR = r;
    }
  }
  return maxR;
}

const FUEL_LABELS = {
  propane: "propane", lng: "LNG", gasoline: "gasoline", diesel: "diesel",
  kerosene: "kerosene", crude_oil: "crude oil", ethanol: "ethanol",
  butane: "butane", lpg: "LPG",
};

// Builds a plain-language summary from the computed scenario. Purely
// template-driven from the numbers already on screen — no external model
// call, so it's always available and never invents a fact the physics
// modules didn't produce.
export function buildBriefing(facility, zones, exposure) {
  if (!facility || !zones) return "";

  const fuel = FUEL_LABELS[facility.fuel_type] || facility.fuel_type;
  const downwind = compassLabel((facility.wind_direction_deg + 180) % 360);
  const thermalR = Math.round(maxRadiusM(zones.thermal_bands, facility.lat, facility.lon));
  const overpressureR = Math.round(maxRadiusM(zones.overpressure_bands, facility.lat, facility.lon));

  const lines = [];
  lines.push(
    `Scenario: a ${facility.tank_volume_m3} m³ ${fuel} tank (${facility.tank_diameter_m} m diameter) ` +
    `at ${facility.lat.toFixed(4)}, ${facility.lon.toFixed(4)}.`
  );
  lines.push(
    `Wind from the ${compassLabel(facility.wind_direction_deg)} at ${facility.wind_speed_mps} m/s pushes ` +
    `both hazard plumes toward the ${downwind}.`
  );
  lines.push(
    `Thermal radiation extends up to ~${thermalR} m downwind; blast overpressure extends up to ~${overpressureR} m.`
  );

  if (exposure) {
    if (exposure.criticalSites?.length > 0) {
      const names = exposure.criticalSites
        .map((s) => s.name || s.type.replace("_", " "))
        .slice(0, 3)
        .join(", ");
      lines.push(
        `${exposure.criticalSites.length} critical site(s) fall inside the outer hazard band, including ${names}.`
      );
    } else {
      lines.push("No hospitals, schools, or emergency services detected inside the outer hazard band.");
    }
    lines.push(`${exposure.buildingCount} building(s) sit inside the outer hazard band.`);
  }

  lines.push(
    "This is a screening-level estimate from simplified pool-fire and TNT-equivalence models — " +
    "not a substitute for a site-specific consequence analysis."
  );

  return lines.join(" ");
}
