const COMPASS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

export function compassPoint(deg) {
  if (!Number.isFinite(deg)) return "—";
  return COMPASS[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
}

// "Wind from" is the meteorological convention; the plume travels the other way.
export function downwindBearing(deg) {
  return Number.isFinite(deg) ? (deg + 180) % 360 : null;
}

export function formatMetres(m) {
  if (!Number.isFinite(m)) return "—";
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
}

export function formatSigned(value, unit = "%") {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return `0${unit}`;
  return `${rounded > 0 ? "+" : ""}${rounded}${unit}`;
}

export function formatRelativeTime(isoString) {
  if (!isoString) return "unknown";
  const then = new Date(isoString);
  if (Number.isNaN(then.getTime())) return "unknown";
  const seconds = Math.round((Date.now() - then.getTime()) / 1000);
  if (seconds < 0) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`;
  return then.toLocaleString();
}

export function formatClockTime(isoString) {
  if (!isoString) return null;
  const then = new Date(isoString);
  return Number.isNaN(then.getTime()) ? null : then.toLocaleTimeString();
}
