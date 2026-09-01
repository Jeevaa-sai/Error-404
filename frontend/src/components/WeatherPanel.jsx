import { useEffect, useState } from "react";
import { compassPoint, downwindBearing, formatRelativeTime, formatClockTime } from "../utils/format";
import { LoadingMessage, EmptyMessage, SkeletonLines } from "./StatusMessage";

const SOURCE_LABELS = {
  openweather: "OpenWeather (live station observation)",
  "open-meteo": "Open-Meteo (live forecast, no key needed)",
  manual: "Manual entry (operator supplied)",
  fallback: "Estimated (no live feed available)",
};

const CONFIDENCE_STYLES = {
  live: "text-severity-low border-severity-low/40 bg-severity-low/10",
  manual: "text-ink-100 border-ink-700 bg-ink-900",
  fallback: "text-severity-medium border-severity-medium/40 bg-severity-medium/10",
};

function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="text-ink-400">{label}</span>
      <span className="font-mono text-ink-100 text-right">{children}</span>
    </div>
  );
}

// Arrow points the way the wind is blowing (downwind), which is the direction
// the plume actually travels — the opposite of the "wind from" bearing.
function WindArrow({ fromDeg }) {
  const to = downwindBearing(fromDeg);
  if (to == null) return null;
  return (
    <span
      className="inline-block text-hazard-500 text-base leading-none"
      style={{ transform: `rotate(${to}deg)` }}
      aria-hidden="true"
    >
      ↑
    </span>
  );
}

export default function WeatherPanel({ weather, loading }) {
  // Re-reads the clock once a minute so "last updated" stays honest without a refetch.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const isStale =
    weather?.timestamp && now - new Date(weather.timestamp).getTime() > 60 * 60 * 1000;

  return (
    <section className="border border-ink-700 rounded-sm p-3">
      <h3 className="font-display text-xs tracking-wide text-ink-100 uppercase mb-2">
        Weather
      </h3>

      {loading && !weather && <SkeletonLines count={4} />}
      {loading && weather && <LoadingMessage message="Refreshing conditions…" />}

      {!loading && !weather && (
        <EmptyMessage>
          Compute hazard zones to pull in the wind conditions used for the calculation.
        </EmptyMessage>
      )}

      {weather && !loading && (
        <div className="text-xs space-y-1">
          <Row label="Wind speed">
            {Number(weather.wind_speed_mps).toFixed(1)} m/s
            {weather.gust_mps != null && (
              <span className="text-ink-400"> (gust {Number(weather.gust_mps).toFixed(1)})</span>
            )}
          </Row>

          <Row label="Wind direction">
            <span className="inline-flex items-center gap-1.5">
              <WindArrow fromDeg={weather.wind_direction_deg} />
              from {Math.round(weather.wind_direction_deg)}° {compassPoint(weather.wind_direction_deg)}
            </span>
          </Row>

          <Row label="Blowing toward">
            {Math.round(downwindBearing(weather.wind_direction_deg))}°{" "}
            {compassPoint(downwindBearing(weather.wind_direction_deg))}
          </Row>

          <Row label="Source">
            <span
              className={`px-1.5 py-0.5 rounded-sm border text-[10px] uppercase tracking-wide ${
                CONFIDENCE_STYLES[weather.confidence] || CONFIDENCE_STYLES.fallback
              }`}
            >
              {weather.confidence}
            </span>
          </Row>

          <p className="text-ink-400 leading-relaxed pt-0.5">
            {SOURCE_LABELS[weather.source] || weather.source}
          </p>

          <Row label="Last updated">
            <span className={isStale ? "text-severity-medium" : undefined}>
              {formatRelativeTime(weather.timestamp)}
            </span>
          </Row>
          {formatClockTime(weather.timestamp) && (
            <p className="text-ink-700 text-right font-mono text-[10px]">
              {formatClockTime(weather.timestamp)}
            </p>
          )}

          {weather.confidence === "fallback" && (
            <p className="text-severity-medium leading-relaxed pt-1">
              No live weather provider could be reached — these are estimated conditions
              derived from the coordinates, not a measurement. Check the server's network
              access, or enter the wind manually.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
