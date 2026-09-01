import { formatMetres, formatSigned, compassPoint } from "../utils/format";
import { EmptyMessage, SkeletonLines } from "./StatusMessage";
import { SEVERITY_COLORS, sortBySeverity } from "../utils/severity";

function BandRow({ band, expanded }) {
  const delta = band.radius_m - band.base_radius_m;
  return (
    <div className="flex items-baseline gap-2 py-0.5">
      <span
        className="w-2 h-2 rounded-sm shrink-0 translate-y-px"
        style={{ background: SEVERITY_COLORS[band.severity] }}
        aria-hidden="true"
      />
      <span className="text-ink-100 capitalize w-14 shrink-0">{band.severity}</span>
      <span className="text-ink-700 font-mono text-[10px] w-16 shrink-0">{band.threshold_label}</span>
      <span className="font-mono text-ink-400 ml-auto text-right">
        {formatMetres(band.base_radius_m)}
        {Math.abs(delta) >= 0.5 && (
          <>
            {" → "}
            <span className={expanded ? "text-severity-high" : "text-severity-low"}>
              {formatMetres(band.radius_m)}
            </span>
          </>
        )}
      </span>
    </div>
  );
}

function HazardBlock({ title, bands, expanded }) {
  if (!bands || bands.length === 0) return null;
  return (
    <div>
      <div className="text-ink-400 font-display uppercase tracking-wide text-[10px] mb-1">
        {title}
      </div>
      {sortBySeverity(bands).map((band) => (
        <BandRow key={band.severity} band={band} expanded={expanded} />
      ))}
    </div>
  );
}

export default function ZoneExplanation({ zones, loading }) {
  if (loading && !zones) {
    return (
      <section className="border border-ink-700 rounded-sm p-3">
        <h3 className="font-display text-xs tracking-wide text-ink-100 uppercase mb-2">
          Why these zones
        </h3>
        <SkeletonLines count={5} />
      </section>
    );
  }

  if (!zones) {
    return (
      <section className="border border-ink-700 rounded-sm p-3">
        <h3 className="font-display text-xs tracking-wide text-ink-100 uppercase mb-2">
          Why these zones
        </h3>
        <EmptyMessage>
          Once you compute, this explains how the still-air radius was reshaped by the
          environment and the wind.
        </EmptyMessage>
      </section>
    );
  }

  const risk = zones.risk_adjustment;
  const wind = zones.wind_effect;
  const overallPercent = risk ? (risk.overall_percent_change ?? (risk.overall_multiplier - 1) * 100) : 0;
  const expanded = overallPercent > 0;
  const unchanged = Math.abs(overallPercent) < 0.05;

  // Only the inputs that actually moved the numbers are worth listing.
  const activeContributions = (risk?.contributions || [])
    .filter((c) => c.direction !== "none")
    .sort((a, b) => Math.abs(b.percent_change) - Math.abs(a.percent_change));

  return (
    <section className="border border-ink-700 rounded-sm p-3 text-xs">
      <h3 className="font-display text-xs tracking-wide text-ink-100 uppercase mb-3">
        Why these zones
      </h3>

      <div className="md:grid md:grid-cols-2 md:gap-6 space-y-3 md:space-y-0">
        <div className="space-y-3">
          <div>
            <p
              className={`font-mono ${
                unchanged ? "text-ink-100" : expanded ? "text-severity-high" : "text-severity-low"
              }`}
            >
              {unchanged
                ? "Zones are at their still-air size"
                : `Zones ${expanded ? "expanded" : "shrank"} by ${formatSigned(overallPercent)}`}
            </p>
            <p className="text-ink-400 leading-relaxed mt-1">
              {unchanged
                ? "No environmental input is raised, so each radius is exactly what the fuel and tank size give on their own."
                : `The site conditions multiply every radius by ${risk.overall_multiplier}×, on top of the radius the fuel and tank size produce on their own.`}
            </p>
          </div>

          {activeContributions.length > 0 && (
            <div>
              <div className="text-ink-400 font-display uppercase tracking-wide text-[10px] mb-1">
                What moved them
              </div>
              <ul className="space-y-1.5">
                {activeContributions.map((c) => (
                  <li key={c.key} className="leading-relaxed">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-ink-100">{c.label}</span>
                      <span
                        className={`font-mono shrink-0 ${
                          c.direction === "expand" ? "text-severity-high" : "text-severity-low"
                        }`}
                      >
                        {formatSigned(c.percent_change)}
                      </span>
                    </span>
                    <span className="text-ink-700 block">{c.explanation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {wind && (
            <div>
              <div className="text-ink-400 font-display uppercase tracking-wide text-[10px] mb-1">
                What the wind did
              </div>
              <p className="text-ink-700 leading-relaxed">{wind.explanation}</p>
              {wind.wind_speed_mps > 0 && (
                <p className="text-ink-400 mt-1">
                  Longest reach is toward{" "}
                  <span className="font-mono text-ink-100">
                    {Math.round(wind.downwind_bearing_deg)}° {compassPoint(wind.downwind_bearing_deg)}
                  </span>
                  .
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2 md:pl-6 md:border-l border-ink-700 pt-3 md:pt-0 border-t md:border-t-0">
          <div className="text-ink-700 text-[10px]">
            Radius still-air → after environment (before wind stretch)
          </div>
          <HazardBlock title="Thermal radiation" bands={zones.thermal_bands} expanded={expanded} />
          <HazardBlock title="Blast overpressure" bands={zones.overpressure_bands} expanded={expanded} />
        </div>
      </div>
    </section>
  );
}
