// Single source of truth for where the backend lives.
//
// Set VITE_API_BASE in frontend/.env to the backend machine's address, e.g.
//   VITE_API_BASE=http://<backend-machine-ip>:8000
// Vite inlines it at build time, so restart `npm run dev` after changing it.
//
// The fallback only works when the backend happens to sit on the same host
// that served this page. When the backend runs on a separate machine that is
// never true, which is why VITE_API_BASE has to be set explicitly.
const CONFIGURED = import.meta.env.VITE_API_BASE?.trim();

const SAME_HOST_FALLBACK =
  typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://localhost:8000";

// Trailing slashes would produce "//calculate-zones" once joined with a path.
export const API_BASE = (CONFIGURED || SAME_HOST_FALLBACK).replace(/\/+$/, "");

// True when the address came from configuration rather than being guessed —
// used to explain a connection failure accurately.
export const API_BASE_IS_CONFIGURED = Boolean(CONFIGURED);

export function apiUrl(path) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

// A fetch that fails with a useful message. A cross-machine call that is
// blocked, refused, or times out surfaces in the browser only as an opaque
// "Failed to fetch", which tells the operator nothing about what to fix.
export async function apiFetch(path, options = {}) {
  const { timeoutMs = 15000, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(apiUrl(path), { ...rest, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`No response from the backend at ${API_BASE} (timed out).`);
    }
    throw new Error(
      `Cannot reach the backend at ${API_BASE}. ` +
        (API_BASE_IS_CONFIGURED
          ? "Check the machine is on, the address is right, and the server is bound to 0.0.0.0."
          : "VITE_API_BASE is not set, so this guessed the backend is on the same host as this page.")
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    // FastAPI reports problems in `detail`: a string, or a list of field
    // errors for a 422. Surface those rather than a bare status code.
    let detail = null;
    try {
      const body = await response.json();
      detail = Array.isArray(body?.detail)
        ? body.detail.map((d) => `${d.loc?.slice(1).join(".") || "field"}: ${d.msg}`).join("; ")
        : body?.detail;
    } catch {
      // Non-JSON error body — fall through to the status message.
    }
    throw new Error(detail || `Backend returned ${response.status} ${response.statusText}`);
  }

  return response.json();
}
