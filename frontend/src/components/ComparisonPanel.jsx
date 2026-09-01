import { useState } from "react";
import FacilityForm from "./FacilityForm";
import HazardMap from "./HazardMap";
import { calculateZones } from "../api/zonesApi";

const SITE_A_DEFAULT = {
  lat: 13.0067, lon: 80.2206, tank_volume_m3: 50, tank_diameter_m: 12,
  fuel_type: "propane", wind_speed_mps: 6, wind_direction_deg: 45,
};

const SITE_B_DEFAULT = {
  lat: 13.0067, lon: 80.2206, tank_volume_m3: 150, tank_diameter_m: 20,
  fuel_type: "diesel", wind_speed_mps: 3, wind_direction_deg: 200,
};

function ConfigColumn({ label, initial }) {
  const [facility, setFacility] = useState(initial);
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-3">
      <FacilityForm label={label} onSubmit={handleSubmit} isLoading={loading} initial={initial} />
      {error && (
        <div className="text-xs text-severity-high bg-severity-high/10 border border-severity-high/40 rounded-sm px-3 py-2">
          {error}
        </div>
      )}
      <div className="h-72">
        <HazardMap facility={facility} zones={zones} />
      </div>
    </div>
  );
}

export default function ComparisonPanel() {
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <ConfigColumn label="Site A" initial={SITE_A_DEFAULT} />
        <ConfigColumn label="Site B" initial={SITE_B_DEFAULT} />
      </div>

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
