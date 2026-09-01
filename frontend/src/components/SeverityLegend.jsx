import { SEVERITY_COLORS, sortBySeverity } from "../utils/severity";

// Swatches mirror how the map draws each hazard: thermal as a filled zone,
// overpressure as a dashed outline — both carrying the severity colour.
function Swatch({ severity, hazardType }) {
  const color = SEVERITY_COLORS[severity];
  if (hazardType === "thermal") {
    return (
      <span
        className="w-3 h-3 rounded-sm shrink-0"
        style={{ background: color, opacity: 0.75, border: `1px solid ${color}` }}
      />
    );
  }
  return (
    <span
      className="w-3 h-3 rounded-sm shrink-0"
      style={{ border: `2px dashed ${color}`, background: "transparent" }}
    />
  );
}

function Section({ title, bands, hazardType }) {
  if (bands.length === 0) return null;
  return (
    <div>
      <div className="text-ink-400 mb-1 font-display uppercase tracking-wide text-[10px]">
        {title}
      </div>
      {sortBySeverity(bands).map((b) => (
        <div key={b.severity} className="flex items-center gap-2 py-0.5">
          <Swatch severity={b.severity} hazardType={hazardType} />
          <span className="text-ink-100 capitalize">{b.severity}</span>
          <span className="text-ink-400 font-mono ml-auto">{b.threshold_label || ""}</span>
        </div>
      ))}
    </div>
  );
}

export default function SeverityLegend({ thermalBands = [], overpressureBands = [] }) {
  if (thermalBands.length === 0 && overpressureBands.length === 0) return null;

  return (
    <div
      className="absolute bottom-3 left-3 z-[1000] bg-ink-900/90 border border-ink-700
                 rounded-sm px-3 py-2.5 text-xs backdrop-blur-sm min-w-[190px] space-y-2"
    >
      <Section title="Thermal radiation" bands={thermalBands} hazardType="thermal" />
      <Section title="Blast overpressure" bands={overpressureBands} hazardType="overpressure" />
      <p className="text-ink-700 text-[10px] leading-relaxed pt-1 border-t border-ink-700">
        Filled = thermal · dashed = overpressure. Colour shows severity.
      </p>
    </div>
  );
}
