const SEVERITY_COLORS = {
  high: "#d64545",
  medium: "#e8a33d",
  low: "#f0d264",
};

function bandsByseverity(bands) {
  const order = ["high", "medium", "low"];
  return [...bands].sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
}

export default function SeverityLegend({ thermalBands = [], overpressureBands = [] }) {
  const thermal = bandsByseverity(thermalBands);
  const overpressure = bandsByseverity(overpressureBands);

  return (
    <div className="absolute bottom-3 left-3 z-[1000] bg-ink-900/90 border border-ink-700
                     rounded-sm px-3 py-2.5 text-xs backdrop-blur-sm min-w-[190px]">
      {thermal.length > 0 && (
        <div className="mb-2">
          <div className="text-ink-400 mb-1 font-display uppercase tracking-wide text-[10px]">
            Thermal radiation
          </div>
          {thermal.map((b) => (
            <div key={b.severity} className="flex items-center gap-2 py-0.5">
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ background: SEVERITY_COLORS[b.severity], opacity: 0.75 }}
              />
              <span className="text-ink-100 capitalize">{b.severity}</span>
              <span className="text-ink-400 font-mono ml-auto">{b.threshold_label || ""}</span>
            </div>
          ))}
        </div>
      )}

      {overpressure.length > 0 && (
        <div>
          <div className="text-ink-400 mb-1 font-display uppercase tracking-wide text-[10px]">
            Blast overpressure
          </div>
          {overpressure.map((b) => (
            <div key={b.severity} className="flex items-center gap-2 py-0.5">
              <span
                className="w-3 h-3 rounded-sm shrink-0 border-2 border-dashed"
                style={{ borderColor: "#5b8def", background: "transparent" }}
              />
              <span className="text-ink-100 capitalize">{b.severity}</span>
              <span className="text-ink-400 font-mono ml-auto">{b.threshold_label || ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
