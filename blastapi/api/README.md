# API — DER-02 Threat-Zone Estimator (`api/` folder)

FastAPI backend + geometry engine. Imports physics functions from the sibling `physics/` package.

## IMPORTANT — run command differs from the original brief

Because this now imports `physics.*` (not just local modules), you must run uvicorn
from the **repository root** (the folder containing both `api/` and `physics/`), not
from inside `api/`:

```
cd der02/            # repo root — NOT api/
pip install -r api/requirements.txt
uvicorn api.main:app --reload
```

Running `cd api && uvicorn main:app --reload` (as the original 1-hour-sprint plan
says) will fail with `ModuleNotFoundError: No module named 'physics'` once the real
physics import is wired in, because `physics/` is a sibling of `api/`, not inside it.
The mock-only version (Step 0, hour 0-2) works fine with the old command since it
doesn't import physics yet — just remember to switch commands once you complete Step 3.

Docs at: http://localhost:8000/docs

## Two things fixed while wiring physics in

1. **Import seam**: `physics/tnt_equivalent.py` and `physics/thermal.py` originally
   used bare imports (`from fuel_lookup import ...`), which only work when physics/
   is run as a standalone script directory. Since this API imports physics as a
   proper package (`from physics.tnt_equivalent import ...`), those two files needed
   dual-mode imports (try relative, fall back to bare) so both Person 1's standalone
   tests and this API's package-style import work. Same pattern applied to this
   folder's own `geometry.py`/`main.py` for the same reason.

2. **Ellipse geometry**: the brief's spec for `generate_wind_stretched_polygon`
   centers the ellipse ON the facility. A symmetric ellipse centered on a point is
   fore-aft symmetric by construction — both ends of its major axis are equidistant
   from the center — so it cannot actually express "elongated downwind, compressed
   upwind" relative to the facility, only relative to the ellipse's own uninformative
   center. Fixed by shifting the ellipse's center downwind by
   `(semi_major - isotropic_radius)`, so the facility sits near the upwind edge
   instead of the middle. Now: upwind extent from the facility stays at the original
   isotropic radius, downwind extent grows with wind speed. Verified in
   `tests/test_geometry.py`.

## Verified end-to-end (not just unit tests)
- `GET /health` → `{"status": "ok"}`
- `POST /calculate-zones` with a realistic payload → 3 bands per hazard type, all
  polygon points cluster near the input lat/lon (no unit-mismatch bug), bigger
  tank volume produces a visibly larger radius.
- Real `uvicorn api.main:app` server tested with `curl`, not just FastAPI TestClient.

## Severity bands (cited)
See `severity_bands.py` — thermal thresholds from API RP 521 / TNO Green Book
convention (37.5 / 12.5 / 4.0 kW/m²), overpressure thresholds from CCPS Guidelines
for Consequence Analysis / HSE (35 / 16 / 3 kPa).

## Contract addition for frontend
`SeverityBand` includes a `threshold_label` field (e.g. `"37.5 kW/m²"`) beyond the
original schema, since Person 3's legend displays the actual threshold value next
to each color. Already implemented in `severity_bands.py` (`THERMAL_LABELS` /
`OVERPRESSURE_LABELS`) and wired into `main.py`.
