import { useState } from "react";
import FacilityForm from "./components/FacilityForm";
import HazardMap from "./components/HazardMap";
import ComparisonPanel from "./components/ComparisonPanel";
import { calculateZones } from "./api/zonesApi";

const DEFAULT_FACILITY = {
  lat: 13.0067, lon: 80.2206, tank_volume_m3: 50, tank_diameter_m: 12,
  fuel_type: "propane", wind_speed_mps: 5, wind_direction_deg: 45,
};

const EMPTY_FACILITY = {
  lat: null, lon: null, tank_volume_m3: 0, tank_diameter_m: 0,
  fuel_type: "propane", wind_speed_mps: 0, wind_direction_deg: 0,
};

function SingleView() {
  const [location, setLocation] = useState({ lat: DEFAULT_FACILITY.lat, lon: DEFAULT_FACILITY.lon });
  const [facility, setFacility] = useState(DEFAULT_FACILITY);
  const [zones, setZones] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(input) {
    setLoading(true);
    setError(null);
    try {
      const result = await calculateZones(input);
      setZones(result);
      setFacility(input);
      setLocation({ lat: input.lat, lon: input.lon });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const mapFacility = { ...facility, lat: location.lat, lon: location.lon };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <aside className="lg:w-72 shrink-0">
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
          }}
        />
        {error && (
          <div className="mt-3 text-xs text-severity-high bg-severity-high/10 border border-severity-high/40 rounded-sm px-3 py-2">
            {error}
          </div>
        )}
        {!zones && !loading && !error && (
          <div className="mt-3 text-xs text-ink-400 leading-relaxed">
            Enter facility parameters, click the map or use your location, then
            compute to see graded thermal and overpressure hazard zones.
          </div>
        )}
      </aside>
      <div className="flex-1 min-w-0 min-h-[420px]">
        <HazardMap
          facility={mapFacility}
          zones={zones}
          onPick={(lat, lon) => setLocation({ lat, lon })}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("single");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-700 px-5 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg tracking-wide uppercase text-ink-100">
            Threat-Zone Estimator
          </h1>
          <p className="text-xs text-ink-400">DER-02 — Industrial Fire &amp; Explosion Response</p>
        </div>
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
      </header>

      <main className="flex-1 p-5">
        {mode === "single" ? <SingleView /> : <ComparisonPanel />}
      </main>
    </div>
  );
}
