# Frontend — DER-02 Threat-Zone Estimator

React + Vite + react-leaflet, matching Person 2's `/calculate-zones` API contract exactly.

## Run
```
npm install
npm run dev
```
Opens at http://localhost:5173

## Mock vs real API
`src/api/zonesApi.js` is the single integration point. It's currently set to call the
real backend at `http://localhost:8000`. To develop against mock data before Person 2's
API is live, flip the flag at the top of that file:
```js
const USE_MOCK = true;
```
No other file needs to change — every component consumes `calculateZones()`.

## Structure
```
src/
├── App.jsx                    single-site view + mode toggle
├── api/zonesApi.js             mock/real API swap point
├── mock-data/mockZoneResponse.json
└── components/
    ├── FacilityForm.jsx        lat/lon/tank/fuel/wind inputs
    ├── HazardMap.jsx            leaflet polygons, colored by severity
    ├── WindIndicator.jsx        arrow drawn pointing DOWNWIND (zone elongation direction)
    ├── SeverityLegend.jsx       color + threshold key, reads threshold_label from API
    └── ComparisonPanel.jsx      two-config side-by-side view + judge talking-points box
```

## Design notes
- Dark industrial/safety-data palette (ink navy + hazard orange) rather than a generic
  SaaS theme — deliberately grounded in industrial hazard-signage vernacular.
- Thermal bands render as filled polygons; overpressure bands render as dashed outlines
  only, so overlapping zones stay readable.
- Higher-severity (smaller) bands are drawn last so they stay visible on top of larger,
  lower-severity bands underneath.
- Wind arrow points downwind (direction + 180 from the "coming from" input) so it visually
  agrees with which way the hazard zones stretch — checked explicitly per the brief's warning
  about this being an easy visual contradiction to introduce.

## Backend contract expected
```
POST /calculate-zones
{
  "lat": 13.0067, "lon": 80.2206,
  "tank_volume_m3": 50, "tank_diameter_m": 12,
  "fuel_type": "propane",
  "wind_speed_mps": 5, "wind_direction_deg": 45
}
```
Response:
```
{
  "thermal_bands": [{ "severity": "high", "hazard_type": "thermal",
                       "threshold_label": "37.5 kW/m2", "polygon": [[lat,lon], ...] }],
  "overpressure_bands": [...]
}
```
`threshold_label` is an addition beyond the original schema — confirm with Person 2 that
severity_bands.py includes it in the response, since the legend displays it directly. If
Person 2's API omits it, the legend falls back to showing just the severity name.
