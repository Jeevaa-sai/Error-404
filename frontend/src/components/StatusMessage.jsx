// One place for the loading / error / empty states, so every panel in the app
// reports trouble the same way instead of each inventing its own styling.
export function ErrorMessage({ message, onRetry, retryLabel = "Try again" }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="text-xs text-severity-high bg-severity-high/10 border border-severity-high/40
                 rounded-sm px-3 py-2 flex items-start gap-2"
    >
      <span aria-hidden="true">⚠</span>
      <span className="flex-1 leading-relaxed">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 underline underline-offset-2 hover:text-ink-100 font-mono"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export function LoadingMessage({ message = "Working…" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="text-xs text-ink-400 flex items-center gap-2 px-3 py-2"
    >
      <span
        className="w-3 h-3 rounded-full border-2 border-ink-700 border-t-hazard-500 animate-spin shrink-0"
        aria-hidden="true"
      />
      {message}
    </div>
  );
}

export function EmptyMessage({ children }) {
  return <p className="text-xs text-ink-400 leading-relaxed">{children}</p>;
}

// Skeleton rows for panels that are waiting on their first result.
export function SkeletonLines({ count = 3 }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-3 bg-ink-700/50 rounded-sm animate-pulse" style={{ width: `${90 - i * 15}%` }} />
      ))}
    </div>
  );
}
