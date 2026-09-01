import { useState } from "react";
import { formatSigned } from "../utils/format";
import {
  DEFAULT_ENVIRONMENT,
  ENVIRONMENT_FIELDS,
  previewMultiplier,
} from "../utils/environment";

function fieldPercent(field, value) {
  const v = Number(value) || 0;
  return field.sign * v * field.coefficient * 100;
}

export default function EnvironmentControls({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const environment = value || DEFAULT_ENVIRONMENT;
  const multiplier = previewMultiplier(environment);
  const percent = (multiplier - 1) * 100;
  const touched = Math.abs(multiplier - 1) > 1e-9;

  function set(key, raw) {
    onChange({ ...environment, [key]: raw });
  }

  return (
    <section className="border border-ink-700 rounded-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <span className="font-display text-xs tracking-wide text-ink-100 uppercase">
          Environment
        </span>
        <span className="flex items-center gap-2">
          <span
            className={`font-mono text-xs ${
              !touched ? "text-ink-400" : percent > 0 ? "text-severity-high" : "text-severity-low"
            }`}
          >
            {multiplier.toFixed(3)}×
          </span>
          <span className="text-ink-400 text-xs" aria-hidden="true">{open ? "▾" : "▸"}</span>
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-ink-700 pt-3">
          {ENVIRONMENT_FIELDS.map((field) => {
            const raw = environment[field.key] ?? 0;
            const contribution = fieldPercent(field, raw);
            return (
              <div key={field.key}>
                <div className="flex items-baseline justify-between text-xs mb-1">
                  <span className="text-ink-400">{field.label}</span>
                  <span className="font-mono text-ink-100">
                    {field.kind === "fraction"
                      ? `${Math.round(Number(raw) * 100)}%`
                      : Number(raw)}
                    <span
                      className={`ml-2 ${
                        contribution === 0
                          ? "text-ink-700"
                          : contribution > 0
                            ? "text-severity-high"
                            : "text-severity-low"
                      }`}
                    >
                      {formatSigned(contribution)}
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={field.kind === "fraction" ? 1 : field.max}
                  step={field.kind === "fraction" ? 0.05 : 1}
                  value={raw}
                  disabled={disabled}
                  onChange={(e) =>
                    set(
                      field.key,
                      field.kind === "fraction" ? Number(e.target.value) : Number(e.target.value)
                    )
                  }
                  className="w-full accent-hazard-500 disabled:opacity-50"
                  aria-label={field.label}
                />
                <p className="text-[10px] text-ink-700 leading-relaxed mt-0.5">{field.hint}</p>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-1 border-t border-ink-700">
            <p className="text-[10px] text-ink-400 leading-relaxed pr-2">
              Combined effect on every zone radius:{" "}
              <span className="font-mono text-ink-100">{formatSigned(percent)}</span>
            </p>
            <button
              type="button"
              onClick={() => onChange({ ...DEFAULT_ENVIRONMENT })}
              disabled={disabled || !touched}
              className="text-[10px] text-ink-400 hover:text-ink-100 disabled:opacity-40 font-mono shrink-0"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
