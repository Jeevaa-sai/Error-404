// Single source of truth for severity colour, shared by the map, the legend
// and the explanation panel so a band looks the same everywhere it appears.
export const SEVERITY_COLORS = {
  high: "#d64545",
  medium: "#e8a33d",
  low: "#f0d264",
};

export const SEVERITY_ORDER = ["high", "medium", "low"];

const RANK = { high: 2, medium: 1, low: 0 };

// Most severe first — the reading order used by the legend and panels.
export function sortBySeverity(bands = []) {
  return [...bands].sort((a, b) => RANK[b.severity] - RANK[a.severity]);
}

// Most severe LAST, so the smallest, hottest band draws on top of the
// larger ones it sits inside rather than being hidden underneath them.
export function drawOrder(bands = []) {
  return [...bands].sort((a, b) => RANK[a.severity] - RANK[b.severity]);
}

// Thermal reads as a filled zone, overpressure as a dashed outline, so the
// two hazard types stay distinguishable while both carry severity colour.
export function bandStyle(band, hazardType) {
  const color = SEVERITY_COLORS[band.severity] || "#ff6a13";
  if (hazardType === "thermal") {
    return { color, weight: 2, fillColor: color, fillOpacity: 0.22 };
  }
  return { color, weight: 2, fill: false, dashArray: "6,5" };
}
