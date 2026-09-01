# Error-404 — Threat-Zone Estimator

Hackatronics 2.0 hackathon project. DER-02: industrial fire &amp; explosion response.

Estimates thermal-radiation and blast-overpressure hazard zones around a fuel
storage facility, shows why each zone is the size it is, and cross-references
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
python3 -m pip install -r blastapi/api/requirements.txt
cd frontend && npm install && cd ..
./run_all.sh
```

Then open **http://localhost:5173**.

Requires Python 3.10+ and Node 18+. `setup.bat` checks for both and tells you
what is missing rather than failing halfway.

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

Find that IP by running `ipconfig` (Windows) or `ip addr` (Linux/macOS) **on
the backend machine**. No trailing slash. Vite reads `.env` at startup, so
restart `npm run dev` afterwards.

`frontend/.env` is gitignored, so each machine keeps its own setting and they
never conflict. `frontend/.env.example` documents the format.

The header shows a **connection indicator** — click it to see which address is
in use and whether the backend is reachable.

---

## Live weather (optional)

Zone shapes use wind speed and direction, which you can always type in by hand.

For the server to fetch conditions itself, set an
[OpenWeather](https://openweathermap.org/api) key (free tier is enough):

```bash
cd blastapi
cp .env.example .env      # copy .env.example on Windows
# then put the key after OPENWEATHER_API_KEY=
```

Restart the backend. `http://localhost:8000/health` will report
`"live_weather_configured": true`.

Without a key the app still runs: it falls back to estimated wind derived from
the coordinates, clearly labelled `fallback` in the weather panel so nobody
mistakes it for a measurement. **`blastapi/.env` is gitignored — never commit
the key.**

---

## Running on separate machines

If the backend runs on one laptop and people open the frontend from others:

1. Start the backend bound to all interfaces — `run_all.bat` and `run_all.sh`
   already pass `--host 0.0.0.0`. The uvicorn default of `127.0.0.1` refuses
   outside connections.
2. Allow port 8000 through the firewall. Windows prompts the first time.
3. Set `VITE_API_BASE` on each frontend machine as above.

CORS is already open to any origin, so no backend change is needed.

---

## Tests

```bash
cd blastapi
python -m pytest physics api/tests -q
```

---

## Project layout

```
blastapi/          FastAPI service
  api/             endpoints, schemas, weather, geometry, exposure model
  physics/         TNT equivalence, overpressure, thermal radiation
frontend/
  src/api/         backend clients — config.js decides the API address
  src/components/  map, forms, weather / explanation / comparison panels
  src/utils/       formatting, geometry, severity colours
physics_modules/   standalone copy of the physics package
```

## Modelling caveats

The wind model stretches an otherwise circular zone downwind — an honest
engineering approximation of flame tilt and plume drift, not CFD. The
environment multiplier uses simple published-order-of-magnitude coefficients so
every metre of expansion can be explained. Damage thresholds come from API RP
521, the TNO Green Book, and CCPS consequence-analysis guidance; sources are
cited in `blastapi/api/severity_bands.py`. Exposure counts come from
OpenStreetMap buildings, not census data — a lower bound, not a headcount.
