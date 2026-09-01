// The free public Overpass endpoint is shared infrastructure that's
// sometimes slow, rate-limited, or briefly down. Falling through a short
// list of known mirrors makes a single bad response non-fatal — each gets a
// hard timeout so a mirror that accepts the connection but never answers
// can't stall the whole lookup.
const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

// Overpass's free instance genuinely takes several seconds for a compound
// query even when healthy (observed 5.5s for a single-clause query) — too
// close to a short timeout to leave headroom for the heavier multi-clause
// queries this app sends, so this errs generous.
const TIMEOUT_MS = 15000;

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function runOverpassQuery(query) {
  let lastError;
  for (const url of MIRRORS) {
    try {
      const response = await fetchWithTimeout(url, { method: "POST", body: query });
      if (!response.ok) {
        lastError = new Error(`Overpass API error: ${response.status}`);
        continue;
      }
      return await response.json();
    } catch (err) {
      lastError = err.name === "AbortError" ? new Error(`Overpass mirror timed out after ${TIMEOUT_MS / 1000}s`) : err;
    }
  }
  throw lastError || new Error("All Overpass mirrors failed");
}
