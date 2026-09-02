import { useEffect, useState } from "react";
import FacilityForm from "./components/FacilityForm";
import HazardMap from "./components/HazardMap";
import ComparisonPanel from "./components/ComparisonPanel";
import ExposurePanel from "./components/ExposurePanel";
import BriefingPanel from "./components/BriefingPanel";
import AssetAlerts from "./components/AssetAlerts";
import WeatherPanel from "./components/WeatherPanel";
import ZoneExplanation from "./components/ZoneExplanation";
import { ErrorMessage } from "./components/StatusMessage";
import BackendStatus from "./components/BackendStatus";
import { DEFAULT_ENVIRONMENT } from "./utils/environment";
import { calculateZones } from "./api/zonesApi";
import { fetchExposure, CRITICAL_LABELS } from "./api/exposureApi";
import { buildShareUrl, facilityFromLocation } from "./utils/share";
import { pointInPolygon, outermostRing } from "./utils/geo";

const DEFAULT_FACILITY = {
  lat: 13.0067, lon: 80.2206, tank_volume_m3: 50, tank_diameter_m: 12,
  fuel_type: "propane", wind_speed_mps: 5, wind_direction_deg: 45,
  use_live_weather: false, environment: { ...DEFAULT_ENVIRONMENT },
};

const EMPTY_FACILITY = {
  lat: null, lon: null, tank_volume_m3: 0, tank_diameter_m: 0,
  fuel_type: "propane", wind_speed_mps: 0, wind_direction_deg: 0,
  use_live_weather: false, environment: { ...DEFAULT_ENVIRONMENT },
};

let assetIdCounter = 0;

function isAssetInHazard(asset, zones) {
  if (!zones) return false;
  const allBands = [...(zones.thermal_bands || []), ...(zones.overpressure_bands || [])];
  return allBands.some((band) => pointInPolygon([asset.lat, asset.lon], band.polygon));
}

function SingleView() {
  const sharedFacility = facilityFromLocation();
  const initialFacility = sharedFacility || DEFAULT_FACILITY;

  const [location, setLocation] = useState({ lat: initialFacility.lat, lon: initialFacility.lon });
  const [facility, setFacility] = useState(initialFacility);
  const [zones, setZones] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [assets, setAssets] = useState([]);
  const [pickMode, setPickMode] = useState("location"); // "location" | "asset"
  const [lastInput, setLastInput] = useState(null);
  const [exposure, setExposure] = useState(null);
  const [exposureLoading, setExposureLoading] = useState(false);
  const [exposureError, setExposureError] = useState(null);

  useEffect(() => {
    if (sharedFacility) {
      handleSubmit(sharedFacility);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(input) {
    setLoading(true);
    setError(null);
    setLastInput(input);
    try {
      const result = await calculateZones(input);
      setZones(result);
      setFacility(input);
      setLocation({ lat: input.lat, lon: input.lon });
      refreshExposure(result);
    } catch (err) {
      setError(err.message || "Could not reach the hazard-zone service.");
    } finally {
      setLoading(false);
    }
  }

  // Runs automatically once zones compute, so "Protected assets" and the
  // briefing already know about nearby hospitals/schools/emergency services
  // without the operator having to click a separate "check exposure" step.
  async function refreshExposure(zonesResult) {
    const ring = outermostRing(zonesResult?.thermal_bands) || outermostRing(zonesResult?.overpressure_bands);
    if (!ring) return;
    setExposureLoading(true);
    setExposureError(null);
    try {
      const result = await fetchExposure(ring);
      setExposure(result);
    } catch (err) {
      setExposureError(err.message || "Could not check OpenStreetMap for nearby critical sites.");
    } finally {
      setExposureLoading(false);
    }
  }

  function handleMapPick(lat, lon) {
    if (pickMode === "asset") {
      const label = window.prompt("Label for this asset (e.g. \"City Hospital\")");
      if (label) {
        setAssets((prev) => [...prev, { id: assetIdCounter++, lat, lon, label }]);
      }
      setPickMode("location");
    } else {
      setLocation({ lat, lon });
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(buildShareUrl(facility));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — no-op.
    }
  }

  const mapFacility = { ...facility, lat: location.lat, lon: location.lon };
  const manualAssetsWithStatus = assets.map((a) => ({ ...a, inHazard: isAssetInHazard(a, zones) }));
  const autoAssetsWithStatus = (exposure?.criticalSites || []).map((site, i) => ({
    id: `auto-${i}`,
    lat: site.lat,
    lon: site.lon,
    label: site.name ? `${CRITICAL_LABELS[site.type] || site.type} — ${site.name}` : (CRITICAL_LABELS[site.type] || site.type),
    inHazard: isAssetInHazard(site, zones),
  }));
  const assetsWithStatus = [...autoAssetsWithStatus, ...manualAssetsWithStatus];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <aside className="lg:w-72 shrink-0 overflow-y-auto">
          <FacilityForm
            onSubmit={handleSubmit}
            isLoading={loading}
            initial={DEFAULT_FACILITY}
            location={location}
            onLocationChange={(lat, lon) => setLocation({ lat, lon })}
            onReset={() => {
              setZones(null);
              setError(null);
              setFacility(EMPTY_FACILITY);
              setLocation({ lat: null, lon: null });
              setLastInput(null);
              setExposure(null);
              setExposureError(null);
            }}
          />
          <div className="mt-3">
            <ErrorMessage
              message={error}
              onRetry={lastInput ? () => handleSubmit(lastInput) : undefined}
              retryLabel="Retry"
            />
          </div>
          {!zones && !loading && !error && (
            <div className="mt-3 text-xs text-ink-400 leading-relaxed">
              Enter facility parameters, click the map or use your location, then
              compute to see graded thermal and overpressure hazard zones.
            </div>
          )}

          {zones && (
            <button
              type="button"
              onClick={copyShareLink}
              className="mt-3 w-full text-xs text-ink-400 hover:text-ink-100 border border-ink-700
                         hover:border-ink-400 rounded-sm px-3 py-2 font-mono transition-colors"
            >
              {copied ? "Link copied" : "🔗 Copy share link"}
            </button>
          )}
        </aside>
        <div className="flex-1 min-w-0 h-[420px] lg:h-[600px]">
          <HazardMap
            facility={mapFacility}
            zones={zones}
            onPick={handleMapPick}
            assets={assetsWithStatus}
            loading={loading}
          />
        </div>
      </div>

      {/* Compact panels share a row; "why these zones" runs much longer than
          any of them, so it gets its own full-width row below instead of
          forcing the whole grid row to match its height and leaving the
          shorter panels stranded above dead space. */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        <AssetAlerts
          autoAssets={autoAssetsWithStatus}
          manualAssets={manualAssetsWithStatus}
          autoLoading={exposureLoading}
          autoError={exposureError}
          pickMode={pickMode}
          onTogglePickMode={() => setPickMode((m) => (m === "asset" ? "location" : "asset"))}
          onRemove={(id) => setAssets((prev) => prev.filter((a) => a.id !== id))}
          onClear={() => setAssets([])}
        />
        <WeatherPanel weather={zones?.weather} loading={loading} />
        <ExposurePanel
          zones={zones}
          exposure={exposure}
          loading={exposureLoading}
          error={exposureError}
          onRefresh={() => refreshExposure(zones)}
        />
        <BriefingPanel facility={facility} zones={zones} exposure={exposure} />
      </div>

      <ZoneExplanation zones={zones} loading={loading} />
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("single");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-2 border-hazard-500 px-5 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg tracking-wide uppercase text-ink-100">
            Threat-Zone Estimator
          </h1>
          <p className="text-xs text-ink-400">DER-02 — Industrial Fire &amp; Explosion Response</p>
        </div>
        <div className="flex items-center gap-2">
        <BackendStatus />
        <nav className="flex gap-1 bg-ink-900 border border-ink-700 rounded-sm p-1">
          {["single", "compare"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs font-display uppercase tracking-wide rounded-sm transition-colors ${
                mode === m
                  ? "bg-hazard-500 text-ink-950"
                  : "text-ink-400 hover:text-ink-100"
              }`}
            >
              {m === "single" ? "Single site" : "Compare two"}
            </button>
          ))}
        </nav>
        </div>
      </header>

      <main className="flex-1 p-5">
        {mode === "single" ? <SingleView /> : <ComparisonPanel />}
      </main>
    </div>
  );
}
