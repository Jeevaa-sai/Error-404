import mockZoneResponse from "../mock-data/mockZoneResponse.json";

const API_BASE = "http://localhost:8000";
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
