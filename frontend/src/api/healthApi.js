import { apiFetch, API_BASE } from "./config";

// Confirms the backend is reachable at the configured address, and reports
// whether it has a live weather key. Used by the connection indicator so a
// misconfigured VITE_API_BASE is obvious before anyone computes a scenario.
export async function checkHealth() {
  const data = await apiFetch("/health", { timeoutMs: 5000 });
  return {
    ok: data.status === "ok",
    liveWeatherConfigured: Boolean(data.live_weather_configured),
    apiBase: API_BASE,
  };
}
