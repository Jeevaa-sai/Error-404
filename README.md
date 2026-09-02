# Error-404 — Threat-Zone Estimator

Hackatronics 2.0 hackathon project. **DER-02: industrial fire & explosion response.**

Estimates thermal-radiation and blast-overpressure hazard zones around a fuel
storage facility, explains why each zone is the size it is, and cross-references
the footprint against OpenStreetMap for exposed buildings and critical sites.

- **Backend** — FastAPI (`blastapi/`), physics in `blastapi/physics/`
- **Frontend** — React + Vite + Leaflet (`frontend/`)

---

## Quick start

Works the same on any machine — Windows, macOS, or Linux. Nothing needs
configuring for the normal case.

```bash
git clone https://github.com/Jeevaa-sai/Error-404.git
cd Error-404
```

**Windows**

```
setup.bat        # once, after cloning
run_all.bat      # every time
```

**macOS / Linux**

```bash
python3 -m pip install -r requirements.txt
cd frontend && npm install && cd ..
./run_all.sh
```

Then open **http://localhost:5173**.

Requires Python 3.10+ and Node 18+. `setup.bat` checks for both and tells you
what is missing rather than failing halfway.

---

## What it does

**Compute** — six graded bands (three thermal, three overpressure) from tank
volume, diameter, fuel type and wind, drawn on the map at their real footprint.

**Explain** — every zone reports its still-air radius, what the site conditions
did to it, and which way the wind stretched it, in words.

**Cross-reference** — buildings, hospitals, schools and emergency services
inside the outer band, counted from OpenStreetMap automatically after each
compute, plus any assets you drop yourself.

**Compare** — two facilities side by side, diffed row by row, with a cascading
risk warning when one facility sits inside the other's hazard zone.

**Share** — every scenario encodes to a URL, so the same computation reopens
exactly as computed.

---

## The model

| Stage | Formula | Source |
|---|---|---|
| Pool fire | `Q̇ = ṁ″ · A · ΔH_c` | Babrauskas, *Fire Technology*, 1983 |
| Thermal radius | `r = √(χ_r · Q̇ / 4π q)` | Point-source model; SFPE Handbook, NISTIR 6546 |
| TNT equivalence | `W_TNT = yield · E_stored / 4184` | CCPS, yield factor 0.05 |
| Blast radius | `Z = (114/ΔP)^(1/1.6)`, `R = Z · W_TNT^(1/3)` | Power-law **fit** to Kingery & Bulmash 1984 (Swisdak 1994), valid 1 < Z < 10 |

**Damage thresholds** — thermal 37.5 / 12.5 / 4.0 kW/m² (API RP 521, TNO Green
Book); overpressure 35 / 16 / 3 kPa (CCPS 1999, HSE). Cited in
`blastapi/api/severity_bands.py`.

**Site multiplier** — five inputs, each scaling every radius, multiplied
together: tree density (+8% max), vehicle density (+12% max), nearby buildings
(+5% each, count capped at 20), terrain roughness (−7% max, the only negative
term), occupancy risk (+10% max). Coefficients in `blastapi/api/exposure.py`,
mirrored in `frontend/src/utils/environment.js` so the live preview matches the
API.

**Wind** — the zone stops being a circle. At 5 m/s the downwind reach becomes
1.50× the still-air radius, the sides narrow to 0.93×, and the upwind edge stays
at 1.00×. The ellipse is shifted downwind so the facility sits near its upwind
edge rather than its centre.

### Modelling caveats

An honest engineering approximation of flame tilt and plume drift, **not CFD**.
Flat-earth lat/lon projection (fine at facility scale, not tens of km).
Point-source thermal model, not a solid-flame view-factor model. Fixed yield
factor (0.05) and stretch coefficient (0.05) rather than per-scenario fits.
Exposure counts come from OpenStreetMap buildings, not census data — a lower
bound, not a headcount.

---

## Where the frontend looks for the backend

By default the frontend calls the backend **on the same machine and host that
served the page**, so cloning and running both locally needs no configuration.
This also covers opening the app from a phone or another laptop on the same
Wi-Fi: visiting `http://192.168.1.42:5173` makes API calls to
`http://192.168.1.42:8000` automatically.

**You only need to configure something if the backend runs on a *different*
machine than the frontend.** In that case, create `frontend/.env`:

```
VITE_API_BASE=http://<backend-machine-ip>:8000
```

Find that IP with `ipconfig` (Windows) or `ip addr` (Linux/macOS) **on the
backend machine**. No trailing slash. Vite reads `.env` at startup, so restart
`npm run dev` afterwards. `frontend/.env.example` documents the format.

The header shows a **connection indicator** — click it to see which address is
in use and whether the backend is reachable.

---

## Live weather (optional)

Zone shapes use wind speed and direction, which you can always type in by hand.

The server tries **OpenWeather** (measured station data, needs a key), then
**Open-Meteo** (no key required), then a deterministic estimate derived from the
coordinates. Every result is labelled `live`, `manual`, or `fallback` in the
weather panel, so an estimate is never presented as a measurement.

To enable OpenWeather:

```bash
cd blastapi
cp .env.example .env      # copy .env.example on Windows
# then put the key after OPENWEATHER_API_KEY=
```

Restart the backend. `http://localhost:8000/health` reports
`"live_weather_configured": true`. **`blastapi/.env` is gitignored — never
commit the key.**

---

## Running on separate machines

1. Start the backend bound to all interfaces — `run_all.bat` and `run_all.sh`
   already pass `--host 0.0.0.0`. The uvicorn default of `127.0.0.1` refuses
   outside connections.
2. Allow port 8000 through the firewall. Windows prompts the first time.
3. Set `VITE_API_BASE` on each frontend machine as above.

CORS is already open to any origin, so no backend change is needed.

---

## Verify the backend alone

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/calculate-zones \
  -H "Content-Type: application/json" \
  -d '{"lat":13.0067,"lon":80.2206,"tank_volume_m3":50,"tank_diameter_m":12,
       "fuel_type":"propane","wind_speed_mps":5,"wind_direction_deg":45}'
```

Or open **http://localhost:8000/docs** for interactive testing.

## Tests

```bash
cd blastapi
python -m pytest physics api/tests -q
```

Covers the physics modules, the geometry engine, and the API endpoints.

---

## Deployment

`blastapi/Dockerfile`, `render.yaml` and `frontend/netlify.toml` are in the repo.
The Docker build context is the **repo root** (not `blastapi/`) so the single
top-level `requirements.txt` is reachable.

## Project layout

```
requirements.txt   backend Python dependencies (single, top level)
render.yaml        backend + frontend deploy config
setup.bat          one-time dependency install (Windows)
run_all.bat/.sh    start backend + frontend together

blastapi/          FastAPI service
  Dockerfile       build context is the repo root
  api/             endpoints, schemas, weather, geometry, exposure, OSM proxy
  physics/         TNT equivalence, overpressure, thermal radiation, fuel table
frontend/
  src/api/         backend clients — config.js decides the API address
  src/components/  map, forms, weather / explanation / comparison panels
  src/utils/       formatting, geometry, severity colours, briefing text
```

External calls (OpenStreetMap Overpass, OpenWeather, elevation) are proxied
through the backend rather than made from the browser, so networks that block
third-party API hosts still work.
