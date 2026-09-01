import { useCallback, useEffect, useState } from "react";
import { checkHealth } from "../api/healthApi";
import { API_BASE, API_BASE_IS_CONFIGURED } from "../api/config";

const DOT = {
  checking: "bg-ink-400 animate-pulse",
  online: "bg-severity-low",
  offline: "bg-severity-high",
};

// Polls /health so a wrong or unreachable VITE_API_BASE shows up immediately,
// rather than as a failed calculation later with no indication of the cause.
export default function BackendStatus() {
  const [state, setState] = useState("checking");
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  const probe = useCallback(async () => {
    setState("checking");
    try {
      const result = await checkHealth();
      setHealth(result);
      setError(null);
      setState(result.ok ? "online" : "offline");
    } catch (err) {
      setError(err.message);
      setHealth(null);
      setState("offline");
    }
  }, []);

  useEffect(() => {
    probe();
    // Re-checks periodically so the badge recovers on its own once the
    // backend machine comes back, without needing a page reload.
    const id = setInterval(probe, 30000);
    return () => clearInterval(id);
  }, [probe]);

  const label =
    state === "checking" ? "Connecting…" : state === "online" ? "Backend online" : "Backend offline";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 text-xs text-ink-400 hover:text-ink-100
                   border border-ink-700 hover:border-ink-400 rounded-sm px-2.5 py-1.5
                   transition-colors"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${DOT[state]}`} aria-hidden="true" />
        {label}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 z-[2000] w-72 bg-ink-900 border border-ink-700
                     rounded-sm p-3 text-xs space-y-2 shadow-lg"
        >
          <div>
            <div className="text-ink-400 mb-0.5">API address</div>
            <code className="font-mono text-ink-100 break-all">{API_BASE}</code>
            {!API_BASE_IS_CONFIGURED && (
              <p className="text-severity-medium leading-relaxed mt-1">
                Guessed from this page's host because VITE_API_BASE is not set. If the backend
                runs on another machine, set it in frontend/.env.
              </p>
            )}
          </div>

          {state === "online" && health && (
            <p className="text-ink-400 leading-relaxed">
              Reachable. Live weather{" "}
              <span className={health.liveWeatherConfigured ? "text-severity-low" : "text-severity-medium"}>
                {health.liveWeatherConfigured ? "configured" : "not configured"}
              </span>
              .
            </p>
          )}

          {state === "offline" && error && (
            <p className="text-severity-high leading-relaxed">{error}</p>
          )}

          <button
            type="button"
            onClick={probe}
            disabled={state === "checking"}
            className="w-full border border-ink-700 hover:border-ink-400 rounded-sm px-2 py-1.5
                       text-ink-400 hover:text-ink-100 disabled:opacity-50 font-mono transition-colors"
          >
            {state === "checking" ? "Checking…" : "Check again"}
          </button>
        </div>
      )}
    </div>
  );
}
