import { CRITICAL_LABELS } from "../api/exposureApi";

// Purely presentational — App fetches exposure automatically as soon as
// zones compute (so this and AssetAlerts always agree on the same result
// instead of each triggering its own OpenStreetMap lookup), and just hands
// the outcome down here.
export default function ExposurePanel({ zones, exposure, loading, error, onRefresh }) {
  if (!zones) return null;

  return (
    <div className="border border-ink-700 rounded-sm p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-xs tracking-wide text-ink-100 uppercase">
          Exposure (OpenStreetMap)
        </h3>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="text-xs text-hazard-500 hover:text-hazard-400 disabled:opacity-50 font-mono"
        >
          {loading ? "Checking…" : "Refresh"}
        </button>
      </div>

      {loading && !exposure && <p className="text-xs text-ink-400">Scanning OpenStreetMap…</p>}

      {error && <p className="text-xs text-severity-high">{error}</p>}

      {exposure && !error && (
        <div className="text-xs text-ink-100 space-y-1.5">
          <p>
            <span className="font-mono text-ink-100">{exposure.buildingCount}</span>{" "}
            <span className="text-ink-400">buildings inside the outer hazard band.</span>
          </p>
          {exposure.criticalSites.length > 0 ? (
            <ul className="space-y-1">
              {exposure.criticalSites.map((site, i) => (
                <li key={i} className="flex items-center gap-2 text-severity-high">
                  <span className="w-1.5 h-1.5 rounded-full bg-severity-high shrink-0" />
                  {CRITICAL_LABELS[site.type] || site.type}
                  {site.name ? ` — ${site.name}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-400">No hospitals, schools, or emergency services detected inside.</p>
          )}
          <p className="text-ink-700 leading-relaxed">
            Building/amenity counts from OpenStreetMap, not census population data — treat as a
            lower-bound proxy for exposure, not an exact headcount.
          </p>
        </div>
      )}

      {!exposure && !error && !loading && (
        <p className="text-xs text-ink-400">
          Cross-referencing the hazard zones against OpenStreetMap building and critical-infrastructure data…
        </p>
      )}
    </div>
  );
}
