import mockZoneResponse from "../mock-data/mockZoneResponse.json";

// In production (frontend and backend on different hosts) set VITE_API_BASE
// at build time. Falls back to same-host port 8000 for local/LAN dev.
const API_BASE = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8000`;
const USE_MOCK = false;

export async function calculateZones(facilityInput) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return mockZoneResponse;
  }

  const response = await fetch(`${API_BASE}/calculate-zones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(facilityInput),
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}
