import { useState } from "react";

const FUEL_OPTIONS = [
  { value: "propane", label: "Propane" },
  { value: "lng", label: "LNG" },
  { value: "gasoline", label: "Gasoline" },
  { value: "diesel", label: "Diesel" },
];

const DEFAULT_INPUT = {
  lat: 13.0067,
  lon: 80.2206,
  tank_volume_m3: 50,
  tank_diameter_m: 12,
  fuel_type: "propane",
  wind_speed_mps: 5,
  wind_direction_deg: 45,
};

function Field({ label, unit, children }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-xs text-ink-400 mb-1">
        <span>{label}</span>
        {unit && <span className="font-mono text-ink-700">{unit}</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full bg-ink-900 border border-ink-700 rounded-sm px-3 py-2 text-sm text-ink-100 font-mono " +
  "focus:outline-none focus:border-hazard-500 focus:ring-1 focus:ring-hazard-500 transition-colors";

export default function FacilityForm({ label, onSubmit, isLoading, initial }) {
  const [form, setForm] = useState(initial || DEFAULT_INPUT);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      lat: Number(form.lat),
      lon: Number(form.lon),
      tank_volume_m3: Number(form.tank_volume_m3),
      tank_diameter_m: Number(form.tank_diameter_m),
      wind_speed_mps: Number(form.wind_speed_mps),
      wind_direction_deg: Number(form.wind_direction_deg),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {label && (
        <h3 className="font-display text-sm tracking-wide text-ink-100 uppercase pb-1 border-b border-ink-700">
          {label}
        </h3>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Latitude">
          <input
            className={inputClass}
            type="number"
            step="0.0001"
            value={form.lat}
            onChange={(e) => update("lat", e.target.value)}
            required
          />
        </Field>
        <Field label="Longitude">
          <input
            className={inputClass}
            type="number"
            step="0.0001"
            value={form.lon}
            onChange={(e) => update("lon", e.target.value)}
            required
          />
        </Field>
      </div>

      <Field label="Tank volume" unit="m³">
        <input
          className={inputClass}
          type="number"
          min="1"
          value={form.tank_volume_m3}
          onChange={(e) => update("tank_volume_m3", e.target.value)}
          required
        />
      </Field>

      <Field label="Tank diameter" unit="m">
        <input
          className={inputClass}
          type="number"
          min="1"
          value={form.tank_diameter_m}
          onChange={(e) => update("tank_diameter_m", e.target.value)}
          required
        />
      </Field>

      <Field label="Fuel type">
        <select
          className={inputClass}
          value={form.fuel_type}
          onChange={(e) => update("fuel_type", e.target.value)}
        >
          {FUEL_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Wind speed" unit="m/s">
          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.5"
            value={form.wind_speed_mps}
            onChange={(e) => update("wind_speed_mps", e.target.value)}
          />
        </Field>
        <Field label="Wind from" unit="deg">
          <input
            className={inputClass}
            type="number"
            min="0"
            max="360"
            value={form.wind_direction_deg}
            onChange={(e) => update("wind_direction_deg", e.target.value)}
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 py-2.5 bg-hazard-500 hover:bg-hazard-600 disabled:opacity-50
                   disabled:cursor-not-allowed text-ink-950 font-display text-sm tracking-wide
                   uppercase rounded-sm transition-colors"
      >
        {isLoading ? "Calculating…" : "Compute hazard zones"}
      </button>
    </form>
  );
}
