export default function AssetAlerts({ assets, pickMode, onTogglePickMode, onRemove, onClear }) {
  const inHazardCount = assets.filter((a) => a.inHazard).length;

  return (
    <div className="border border-ink-700 rounded-sm p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-xs tracking-wide text-ink-100 uppercase">
          Protected assets
        </h3>
        <button
          type="button"
          onClick={onTogglePickMode}
          className={`text-xs font-mono ${
            pickMode === "asset" ? "text-hazard-500" : "text-ink-400 hover:text-ink-100"
          }`}
        >
          {pickMode === "asset" ? "Click map to place ✕ cancel" : "+ Add asset"}
        </button>
      </div>

      {assets.length === 0 ? (
        <p className="text-xs text-ink-400">
          Mark hospitals, schools, or other sites to see if they fall inside a hazard zone.
        </p>
      ) : (
        <>
          {inHazardCount > 0 && (
            <p className="text-xs text-severity-high mb-2">
              ⚠ {inHazardCount} of {assets.length} asset(s) fall inside a hazard zone.
            </p>
          )}
          <ul className="space-y-1 text-xs">
            {assets.map((asset) => (
              <li key={asset.id} className="flex items-center justify-between gap-2">
                <span className={asset.inHazard ? "text-severity-high" : "text-ink-100"}>
                  {asset.inHazard ? "⚠ " : "· "}{asset.label}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(asset.id)}
                  className="text-ink-700 hover:text-ink-400 font-mono shrink-0"
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onClear}
            className="mt-2 text-xs text-ink-700 hover:text-ink-400 font-mono"
          >
            Clear all
          </button>
        </>
      )}
    </div>
  );
}
