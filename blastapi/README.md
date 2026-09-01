# DER-02 — Threat-Zone Estimation for Industrial Fire/Explosion Response

Monorepo: `physics/` (Person 1), `api/` (Person 2), `frontend/` (Person 3).

## Run everything together

Terminal 1 — backend:
```
cd der02
pip install -r api/requirements.txt
uvicorn api.main:app --reload
```

Terminal 2 — frontend:
```
cd der02/frontend
npm install
npm run dev
```

Open http://localhost:5173. Submit a facility, see thermal + overpressure zones
render on the map, wind-distorted, with a legend and downwind indicator.

## Verify the backend alone
```
curl http://localhost:8000/health
curl -X POST http://localhost:8000/calculate-zones \
  -H "Content-Type: application/json" \
  -d '{"lat":13.0067,"lon":80.2206,"tank_volume_m3":50,"tank_diameter_m":12,
       "fuel_type":"propane","wind_speed_mps":6,"wind_direction_deg":45}'
```
Or open http://localhost:8000/docs for interactive testing.

## Run all tests
```
cd physics && python3 -m pytest tests/ -v && cd ..
cd api && python3 -m pytest tests/ -v && cd ..
```

## What's implemented
- Physics: TNT-equivalence + Kingery-Bulmash-style overpressure, point-source
  thermal radiation. Every constant cited. Mandatory reference test included
  (with a documented ~5% gap explained, not hidden).
- Geometry: wind-stretched ellipse, corrected so the facility sits near the
  upwind edge (not the ellipse's symmetric center) — genuine downwind
  elongation / upwind compression, not just a bigger-in-one-direction blob.
- Severity bands: 3 thermal (37.5/12.5/4.0 kW/m²) + 3 overpressure (35/16/3 kPa),
  both cited to standard process-safety references.
- Frontend: single-site view + two-site comparison view, colored/severity-coded
  polygons, downwind indicator, legend reading live threshold labels from the API.

## Known simplifications to state to judges
- Flat-earth lat/lon projection (fine at facility scale, not for tens of km)
- Point-source thermal model, not full solid-flame view-factor model
- Single fixed yield_factor (0.05) and stretch_coefficient (0.05) rather than
  fitted per-scenario values
- Wind-stretch ellipse is a geometric approximation of plume drift, not CFD
