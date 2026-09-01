import { useState } from "react";
import { fetchExposure } from "../api/exposureApi";
import { outermostRing } from "../utils/geo";

const CRITICAL_LABELS = {
  hospital: "Hospital",
  clinic: "Clinic",
  school: "School",
  kindergarten: "Kindergarten",
  fire_station: "Fire station",
  police: "Police station",
};

export default function ExposurePanel({ zones }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ring = zones ? (outermostRing(zones.thermal_bands) || outermostRing(zones.overpressure_bands)) : null;

  async function checkExposure() {
    if (!ring) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExposure(ring);
      setResult(data);
    } catch (err) {
      setError(err.message || "Exposure lookup failed");
    } finally {
      setLoading(false);
    }
  }

  if (!zones) return null;

  return (
    <div className="border border-ink-700 rounded-sm p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-xs tracking-wide text-ink-100 uppercase">
          Exposure (OpenStreetMap)
        </h3>
        <button
          type="button"
          onClick={checkExposure}
          disabled={loading}
          className="text-xs text-hazard-500 hover:text-hazard-400 disabled:opacity-50 font-mono"
        >
          {loading ? "Checking…" : result ? "Refresh" : "Check exposure"}
        </button>
      </div>

      {error && <p className="text-xs text-severity-high">{error}</p>}

      {result && !error && (
        <div className="text-xs text-ink-100 space-y-1.5">
          <p>
            <span className="font-mono text-ink-100">{result.buildingCount}</span>{" "}
            <span className="text-ink-400">buildings inside the outer hazard band.</span>
          </p>
          {result.criticalSites.length > 0 ? (
            <ul className="space-y-1">
              {result.criticalSites.map((site, i) => (
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

      {!result && !error && !loading && (
        <p className="text-xs text-ink-400">
          Cross-reference the hazard zones against OpenStreetMap building and critical-infrastructure data.
        </p>
      )}
    </div>
  );
}
