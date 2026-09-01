import { useState } from "react";
import { buildBriefing } from "../utils/briefing";

export default function BriefingPanel({ facility, zones, exposure }) {
  const [copied, setCopied] = useState(false);
  if (!zones) return null;

  const text = buildBriefing(facility, zones, exposure);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure origin) — no-op, text is still visible to select.
    }
  }

  return (
    <div className="mt-3 border border-ink-700 rounded-sm p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-xs tracking-wide text-ink-100 uppercase">
          Auto-generated briefing
        </h3>
        <button
          type="button"
          onClick={copy}
          className="text-xs text-hazard-500 hover:text-hazard-400 font-mono"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="text-xs text-ink-100 leading-relaxed">{text}</p>
    </div>
  );
}
