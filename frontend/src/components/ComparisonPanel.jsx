import { useState } from "react";
import FacilityForm from "./FacilityForm";
import HazardMap from "./HazardMap";
import { calculateZones } from "../api/zonesApi";
import { pointInPolygon } from "../utils/geo";
import ComparisonSummary from "./ComparisonSummary";
import WeatherPanel from "./WeatherPanel";
import ZoneExplanation from "./ZoneExplanation";
import { ErrorMessage } from "./StatusMessage";
import { DEFAULT_ENVIRONMENT } from "../utils/environment";

const SITE_A_DEFAULT = {
  lat: 13.0067, lon: 80.2206, tank_volume_m3: 50, tank_diameter_m: 12,
  fuel_type: "propane", wind_speed_mps: 6, wind_direction_deg: 45,
  use_live_weather: false, environment: { ...DEFAULT_ENVIRONMENT },
};

const SITE_B_DEFAULT = {
  lat: 13.0067, lon: 80.2206, tank_volume_m3: 150, tank_diameter_m: 20,
  fuel_type: "diesel", wind_speed_mps: 3, wind_direction_deg: 200,
  use_live_weather: false, environment: { ...DEFAULT_ENVIRONMENT },
};

const EMPTY_FACILITY = {
  lat: null, lon: null, tank_volume_m3: 0, tank_diameter_m: 0,
  fuel_type: "propane", wind_speed_mps: 0, wind_direction_deg: 0,
  use_live_weather: false, environment: { ...DEFAULT_ENVIRONMENT },
};

// Checks whether `point` [lat, lon] falls inside any band of `zones`,
// and if so returns the most severe band it's inside.
function worstContainingBand(point, zones) {
  if (!zones) return null;
  const order = { low: 0, medium: 1, high: 2 };
  const allBands = [...(zones.thermal_bands || []), ...(zones.overpressure_bands || [])];
  const hits = allBands.filter((band) => pointInPolygon(point, band.polygon));
  if (hits.length === 0) return null;
  return hits.reduce((worst, b) => (order[b.severity] > order[worst.severity] ? b : worst));
}

function ConfigColumn({ label, initial, onState }) {
  const [location, setLocation] = useState({ lat: initial.lat, lon: initial.lon });
  const [facility, setFacility] = useState(initial);
  const [zones, setZones] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastInput, setLastInput] = useState(null);

  async function handleSubmit(input) {
    setLoading(true);
    setError(null);
    setLastInput(input);
    try {
      const result = await calculateZones(input);
      setZones(result);
      setFacility(input);
      setLocation({ lat: input.lat, lon: input.lon });
      onState?.({ facility: input, zones: result });
    } catch (err) {
      setError(err.message || "Could not reach the hazard-zone service.");
    } finally {
      setLoading(false);
    }
  }

  const mapFacility = { ...facility, lat: location.lat, lon: location.lon };

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-3">
      <FacilityForm
        label={label}
        onSubmit={handleSubmit}
        isLoading={loading}
        initial={initial}
        location={location}
        onLocationChange={(lat, lon) => setLocation({ lat, lon })}
        onReset={() => {
          setZones(null);
          setError(null);
          setFacility(EMPTY_FACILITY);
          setLocation({ lat: null, lon: null });
          setLastInput(null);
          onState?.({ facility: null, zones: null });
        }}
      />
      <ErrorMessage
        message={error}
        onRetry={lastInput ? () => handleSubmit(lastInput) : undefined}
        retryLabel="Retry"
      />
      <div className="h-72">
        <HazardMap
          facility={mapFacility}
          zones={zones}
          onPick={(lat, lon) => setLocation({ lat, lon })}
          loading={loading}
        />
      </div>
      <WeatherPanel weather={zones?.weather} loading={loading} />
      <ZoneExplanation zones={zones} loading={loading} />
    </div>
  );
}

export default function ComparisonPanel() {
  const [notes, setNotes] = useState("");
  const [siteA, setSiteA] = useState(null);
  const [siteB, setSiteB] = useState(null);

  const dominoAonB =
    siteB?.facility && siteA?.zones
      ? worstContainingBand([siteB.facility.lat, siteB.facility.lon], siteA.zones)
      : null;
  const dominoBonA =
    siteA?.facility && siteB?.zones
      ? worstContainingBand([siteA.facility.lat, siteA.facility.lon], siteB.zones)
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <ConfigColumn label="Site A" initial={SITE_A_DEFAULT} onState={setSiteA} />
        <ConfigColumn label="Site B" initial={SITE_B_DEFAULT} onState={setSiteB} />
      </div>

      {(dominoAonB || dominoBonA) && (
        <div className="text-xs text-severity-high bg-severity-high/10 border border-severity-high/40 rounded-sm px-3 py-2 space-y-1">
          <p className="font-display uppercase tracking-wide text-[11px]">⚠ Cascading risk detected</p>
          {dominoAonB && (
            <p>Site B sits inside Site A's {dominoAonB.severity} {dominoAonB.hazard_type} zone ({dominoAonB.threshold_label}).</p>
          )}
          {dominoBonA && (
            <p>Site A sits inside Site B's {dominoBonA.severity} {dominoBonA.hazard_type} zone ({dominoBonA.threshold_label}).</p>
          )}
        </div>
      )}

      <ComparisonSummary siteA={siteA} siteB={siteB} />

      <div>
        <h3 className="font-display text-sm tracking-wide text-ink-100 uppercase pb-1 border-b border-ink-700 mb-2">
          Why the zones differ
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Talking points for judges: fuel mass drives TNT-equivalent mass, overpressure radius scales with the cube root of that mass, wind speed/direction sets how far each zone elongates downwind…"
          className="w-full h-24 bg-ink-900 border border-ink-700 rounded-sm px-3 py-2 text-sm
                     text-ink-100 placeholder:text-ink-700 font-sans resize-none
                     focus:outline-none focus:border-hazard-500 focus:ring-1 focus:ring-hazard-500"
        />
      </div>
    </div>
  );
}
