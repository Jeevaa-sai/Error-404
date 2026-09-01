import { apiFetch } from "./config";

// Proxied through our own backend (GET /environment-estimate) rather than
// calling Overpass/Open-Meteo directly from the browser — some networks
// (campus/corporate proxies, ad/tracker blockers) block a browser fetching
// third-party API hosts directly, which used to surface as an unactionable
// "Failed to fetch". The backend can genuinely take 15-20s under load, so
// this needs more headroom than apiFetch's default timeout.
export async function fetchEnvironmentEstimate(lat, lon) {
  return apiFetch(`/environment-estimate?lat=${lat}&lon=${lon}`, { timeoutMs: 25000 });
}
