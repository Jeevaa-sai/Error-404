export default function AssetAlerts({
  autoAssets = [],
  manualAssets = [],
  autoLoading,
  autoError,
  pickMode,
  onTogglePickMode,
  onRemove,
  onClear,
}) {
  const allAssets = [...autoAssets, ...manualAssets];
  const inHazardCount = allAssets.filter((a) => a.inHazard).length;
  const isEmpty = allAssets.length === 0;

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

      {autoLoading && (
        <p className="text-xs text-ink-400 mb-1.5">Scanning OpenStreetMap for hospitals, schools…</p>
      )}
      {autoError && <p className="text-xs text-severity-medium mb-1.5">{autoError}</p>}

      {isEmpty && !autoLoading ? (
        <p className="text-xs text-ink-400">
          Hospitals, schools, and emergency services near the facility are detected automatically
          once you compute hazard zones. Add any others by hand.
        </p>
      ) : (
        <>
          {inHazardCount > 0 && (
            <p className="text-xs text-severity-high mb-2">
              ⚠ {inHazardCount} of {allAssets.length} asset(s) fall inside a hazard zone.
            </p>
          )}

          {autoAssets.length > 0 && (
            <ul className="space-y-1 text-xs mb-2">
              {autoAssets.map((asset) => (
                <li key={asset.id} className="flex items-center justify-between gap-2">
                  <span className={asset.inHazard ? "text-severity-high" : "text-ink-100"}>
                    {asset.inHazard ? "⚠ " : "· "}{asset.label}
                  </span>
                  <span className="text-ink-700 font-mono shrink-0">OSM</span>
                </li>
              ))}
            </ul>
          )}

          {manualAssets.length > 0 && (
            <ul className="space-y-1 text-xs">
              {manualAssets.map((asset) => (
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
          )}

          {manualAssets.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="mt-2 text-xs text-ink-700 hover:text-ink-400 font-mono"
            >
              Clear added assets
            </button>
          )}
        </>
      )}
    </div>
  );
}
