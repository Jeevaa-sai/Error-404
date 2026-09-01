import { formatMetres, formatSigned, compassPoint } from "../utils/format";
import { EmptyMessage } from "./StatusMessage";

const SEVERITY_ORDER = ["high", "medium", "low"];

function bandRadius(zones, hazardType, severity) {
  const key = hazardType === "thermal" ? "thermal_bands" : "overpressure_bands";
  const band = (zones?.[key] || []).find((b) => b.severity === severity);
  return band ? band.radius_m : null;
}

function Delta({ a, b, format = (v) => v, unit = "" }) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return <span className="text-ink-700">—</span>;
  const diff = b - a;
  if (Math.abs(diff) < 0.05) return <span className="text-ink-400">no change</span>;
  const color = diff > 0 ? "text-severity-high" : "text-severity-low";
  return (
    <span className={color}>
      {diff > 0 ? "+" : "−"}
      {format(Math.abs(diff))}
      {unit}
    </span>
  );
}

function Row({ label, left, right, delta }) {
  return (
    <tr className="border-t border-ink-700">
      <td className="py-1.5 pr-3 text-ink-400 align-top">{label}</td>
      <td className="py-1.5 pr-3 font-mono text-ink-100 text-right">{left}</td>
      <td className="py-1.5 pr-3 font-mono text-ink-100 text-right">{right}</td>
      <td className="py-1.5 font-mono text-right whitespace-nowrap">{delta}</td>
    </tr>
  );
}

function SectionRow({ title }) {
  return (
    <tr>
      <td
        colSpan={4}
        className="pt-3 pb-1 font-display uppercase tracking-wide text-[10px] text-ink-400"
      >
        {title}
      </td>
    </tr>
  );
}

export default function ComparisonSummary({ siteA, siteB }) {
  const zonesA = siteA?.zones;
  const zonesB = siteB?.zones;

  if (!zonesA || !zonesB) {
    return (
      <section className="border border-ink-700 rounded-sm p-3">
        <h3 className="font-display text-sm tracking-wide text-ink-100 uppercase mb-2">
          Side-by-side summary
        </h3>
        <EmptyMessage>
          Compute both sites to see how their zone radii, weather, and risk multipliers differ.
        </EmptyMessage>
      </section>
    );
  }

  const weatherA = zonesA.weather;
  const weatherB = zonesB.weather;
  const riskA = zonesA.risk_adjustment;
  const riskB = zonesB.risk_adjustment;

  return (
    <section className="border border-ink-700 rounded-sm p-3">
      <h3 className="font-display text-sm tracking-wide text-ink-100 uppercase mb-2">
        Side-by-side summary
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[420px]">
          <thead>
            <tr className="text-ink-400 font-display uppercase tracking-wide text-[10px]">
              <th className="text-left font-normal pb-1" />
              <th className="text-right font-normal pb-1 pr-3">Site A</th>
              <th className="text-right font-normal pb-1 pr-3">Site B</th>
              <th className="text-right font-normal pb-1">B − A</th>
            </tr>
          </thead>
          <tbody>
            <SectionRow title="Setup" />
            <Row
              label="Fuel"
              left={siteA.facility?.fuel_type ?? "—"}
              right={siteB.facility?.fuel_type ?? "—"}
              delta={
                siteA.facility?.fuel_type === siteB.facility?.fuel_type ? (
                  <span className="text-ink-400">same</span>
                ) : (
                  <span className="text-ink-100">differs</span>
                )
              }
            />
            <Row
              label="Tank volume"
              left={`${siteA.facility?.tank_volume_m3 ?? "—"} m³`}
              right={`${siteB.facility?.tank_volume_m3 ?? "—"} m³`}
              delta={
                <Delta
                  a={Number(siteA.facility?.tank_volume_m3)}
                  b={Number(siteB.facility?.tank_volume_m3)}
                  format={(v) => v.toFixed(0)}
                  unit=" m³"
                />
              }
            />

            <SectionRow title="Zone radius (after environment, before wind)" />
            {["thermal", "overpressure"].map((hazard) =>
              SEVERITY_ORDER.map((severity) => {
                const a = bandRadius(zonesA, hazard, severity);
                const b = bandRadius(zonesB, hazard, severity);
                return (
                  <Row
                    key={`${hazard}-${severity}`}
                    label={
                      <span className="capitalize">
                        {hazard === "thermal" ? "Thermal" : "Overpressure"} · {severity}
                      </span>
                    }
                    left={formatMetres(a)}
                    right={formatMetres(b)}
                    delta={<Delta a={a} b={b} format={formatMetres} />}
                  />
                );
              })
            )}

            <SectionRow title="Weather" />
            <Row
              label="Wind speed"
              left={`${Number(weatherA?.wind_speed_mps ?? 0).toFixed(1)} m/s`}
              right={`${Number(weatherB?.wind_speed_mps ?? 0).toFixed(1)} m/s`}
              delta={
                <Delta
                  a={Number(weatherA?.wind_speed_mps)}
                  b={Number(weatherB?.wind_speed_mps)}
                  format={(v) => v.toFixed(1)}
                  unit=" m/s"
                />
              }
            />
            <Row
              label="Wind from"
              left={`${Math.round(weatherA?.wind_direction_deg ?? 0)}° ${compassPoint(weatherA?.wind_direction_deg)}`}
              right={`${Math.round(weatherB?.wind_direction_deg ?? 0)}° ${compassPoint(weatherB?.wind_direction_deg)}`}
              delta={
                <Delta
                  a={Number(weatherA?.wind_direction_deg)}
                  b={Number(weatherB?.wind_direction_deg)}
                  format={(v) => v.toFixed(0)}
                  unit="°"
                />
              }
            />
            <Row
              label="Source"
              left={weatherA?.confidence ?? "—"}
              right={weatherB?.confidence ?? "—"}
              delta={
                weatherA?.confidence === weatherB?.confidence ? (
                  <span className="text-ink-400">same</span>
                ) : (
                  <span className="text-ink-100">differs</span>
                )
              }
            />

            <SectionRow title="Environment risk" />
            <Row
              label="Risk multiplier"
              left={`${riskA?.overall_multiplier ?? 1}×`}
              right={`${riskB?.overall_multiplier ?? 1}×`}
              delta={
                <Delta
                  a={Number(riskA?.overall_multiplier ?? 1)}
                  b={Number(riskB?.overall_multiplier ?? 1)}
                  format={(v) => v.toFixed(3)}
                  unit="×"
                />
              }
            />
            <Row
              label="Effect on radius"
              left={formatSigned(riskA?.overall_percent_change ?? 0)}
              right={formatSigned(riskB?.overall_percent_change ?? 0)}
              delta={
                <Delta
                  a={Number(riskA?.overall_percent_change ?? 0)}
                  b={Number(riskB?.overall_percent_change ?? 0)}
                  format={(v) => v.toFixed(1)}
                  unit=" pts"
                />
              }
            />
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-ink-700 leading-relaxed mt-2">
        Radii are the still-air values after the environment multiplier. Wind then stretches each
        zone downwind — see the wind figures above for how far.
      </p>
    </section>
  );
}
