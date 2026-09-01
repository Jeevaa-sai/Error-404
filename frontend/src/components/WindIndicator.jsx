export default function WindIndicator({ windSpeedMps, windDirectionDeg }) {
  // windDirectionDeg is meteorological "coming from". The hazard zones
  // elongate DOWNWIND, so the arrow is drawn pointing downwind
  // (direction + 180) — it visually agrees with which way the zones stretch,
  // rather than pointing back at the source of the wind.
  const downwindDeg = (windDirectionDeg + 180) % 360;

  return (
    <div className="absolute top-3 right-3 z-[1000] bg-ink-900/90 border border-ink-700
                     rounded-sm px-3 py-2 flex items-center gap-2 backdrop-blur-sm">
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        style={{ transform: `rotate(${downwindDeg}deg)` }}
        className="transition-transform shrink-0"
      >
        <line x1="14" y1="4" x2="14" y2="22" stroke="#5b8def" strokeWidth="2" />
        <polygon points="14,2 9,10 19,10" fill="#5b8def" />
      </svg>
      <div className="text-xs leading-tight">
        <div className="text-ink-100 font-mono">{windSpeedMps} m/s</div>
        <div className="text-ink-400">from {windDirectionDeg}°</div>
      </div>
    </div>
  );
}
