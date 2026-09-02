#TECHBLAST

Estimates thermal-radiation and blast-overpressure hazard zones around a fuel
storage facility, explains how each zone radius was derived, and cross-references
the resulting footprint against OpenStreetMap to identify exposed buildings and
critical infrastructure.

Built as a screening-level tool: fast enough to run on scene, and transparent
enough that every metre of every zone can be traced back to a published
correlation and a stated assumption.

- **Backend** — FastAPI, physics modules in `blastapi/physics/`
- **Frontend** — React + Vite + Leaflet

---

## Features

- **Six graded hazard bands** — three thermal, three overpressure — computed
  from tank volume, tank diameter, fuel type, and wind, rendered on an
  interactive map at true scale.
- **Per-zone explanation** — each band reports its still-air radius, the effect
  of site conditions on it, and how far the wind stretched it.
- **Exposure analysis** — buildings, hospitals, schools, and emergency services
  inside the outer band are counted automatically from OpenStreetMap after each
  computation. Additional assets can be placed manually.
- **Two-site comparison** — two facilities computed side by side and diffed
  row by row, with a warning when one facility falls inside the other's hazard
  zone.
- **Live weather** — wind is entered manually or fetched from a provider chain,
  with the source and confidence of every value labelled.
- **Shareable scenarios** — the full input set encodes to a URL, so a scenario
  reopens exactly as computed.

---

## Requirements

- Python 3.10 or newer
- Node.js 18 or newer

---

## Installation

```bash
git clone https://github.com/Jeevaa-sai/Error-404.git
cd Error-404
```

**Windows**

```
setup.bat
```

**macOS / Linux**

```bash
python3 -m pip install -r requirements.txt
cd frontend && npm install && cd ..
```

`setup.bat` verifies both toolchains are present and reports what is missing
rather than failing partway through.

---

## Usage

Start the backend and frontend together:

**Windows**

```
run_all.bat
```

**macOS / Linux**

```bash
./run_all.sh
```

Then open **http://localhost:5173**.

| Service  | Address                     |
| -------- | --------------------------- |
| Frontend | http://localhost:5173       |
| Backend  | http://localhost:8000       |
| API docs | http://localhost:8000/docs  |

To run the two services separately:

```bash
# backend
cd blastapi && python -m uvicorn api.main:app --reload

# frontend
cd frontend && npm run dev
```

---

## Configuration

### Backend address

By default the frontend calls the backend on the same host that served the
page, so running both locally requires no configuration. This also covers
opening the app from another device on the same network — visiting
`http://192.168.1.42:5173` will call `http://192.168.1.42:8000` automatically.

Configuration is only needed when the backend runs on a **different machine**
than the frontend. Create `frontend/.env`:

```
VITE_API_BASE=http://<backend-host>:8000
```

No trailing slash. Vite reads `.env` at startup, so restart the dev server
afterwards. See `frontend/.env.example`.

The application header shows a connection indicator; selecting it displays the
address in use and whether the backend is reachable.

### Weather providers

Wind speed and direction can always be entered by hand. When live weather is
requested, the server tries providers in order:

1. **OpenWeather** — measured station data, requires an API key
2. **Open-Meteo** — forecast grid, no key required
3. **Deterministic estimate** derived from the coordinates

Every result is labelled `live`, `manual`, or `fallback`, so an estimate is
never presented as a measurement.

To enable OpenWeather:

```bash
cd blastapi
cp .env.example .env
# set OPENWEATHER_API_KEY
```

Restart the backend; `GET /health` will report
`"live_weather_configured": true`. `blastapi/.env` is ignored by git.

### Network access

Requests to OpenStreetMap, OpenWeather, and elevation services are proxied
through the backend rather than issued from the browser, so networks that
block third-party API hosts still function. When OpenStreetMap is unreachable,
exposure analysis and environment auto-fill degrade with an explicit message
and the remainder of the application continues to work.

---

## API

| Method | Endpoint                | Description                                        |
| ------ | ----------------------- | -------------------------------------------------- |
| `GET`  | `/health`               | Service status and whether a weather key is set     |
| `GET`  | `/fuels`                | Supported fuel types                                |
| `GET`  | `/weather`              | Wind conditions for a coordinate                    |
| `GET`  | `/environment-estimate` | Site characteristics derived from OSM and elevation |
| `GET`  | `/exposure`             | Buildings and critical sites in a bounding box      |
| `POST` | `/calculate-zones`      | Hazard bands for a facility                         |

```bash
curl -X POST http://localhost:8000/calculate-zones \
  -H "Content-Type: application/json" \
  -d '{"lat":13.0067,"lon":80.2206,"tank_volume_m3":50,"tank_diameter_m":12,
       "fuel_type":"propane","wind_speed_mps":5,"wind_direction_deg":45}'
```

`wind_direction_deg` follows the meteorological convention — the direction the
wind is coming **from**, where 0° is north. Supported fuels: propane, LNG,
gasoline, diesel, kerosene, crude oil, ethanol, butane, LPG.

Interactive documentation is available at `/docs`.

---

## Methodology

| Stage           | Relationship                                       | Reference                                                             |
| --------------- | -------------------------------------------------- | --------------------------------------------------------------------- |
| Pool fire       | `Q̇ = ṁ″ · A · ΔH_c`                                | Babrauskas, *Fire Technology*, 1983                                   |
| Thermal radius  | `r = √(χ_r · Q̇ / 4π q)`                            | Point-source model; SFPE Handbook, NISTIR 6546                        |
| TNT equivalence | `W = yield · E_stored / 4184`                       | CCPS; yield factor 0.05                                               |
| Blast radius    | `Z = (114/ΔP)^(1/1.6)`, `R = Z · W^(1/3)`           | Power-law fit to Kingery & Bulmash (1984), Swisdak (1994); valid 1 < Z < 10 |

**Damage thresholds.** Thermal bands at 37.5, 12.5, and 4.0 kW/m² (API RP 521,
TNO Green Book). Overpressure bands at 35, 16, and 3 kPa (CCPS 1999, HSE).
Values and citations are in `blastapi/api/severity_bands.py`.

**Site multiplier.** Five inputs scale every radius and combine multiplicatively:
tree density (up to +8%), vehicle density (up to +12%), nearby buildings (+5%
each, count capped at 20), terrain roughness (up to −7%, the only reducing
term), and occupancy risk (up to +10%). Coefficients are defined in
`blastapi/api/exposure.py` and mirrored in `frontend/src/utils/environment.js`
so the interface preview matches the API result.

**Wind.** Zones are elongated downwind rather than circular. At 5 m/s the
downwind reach becomes 1.50× the still-air radius, crosswind narrows to 0.93×,
and the upwind edge remains at 1.00×. The ellipse is offset so the facility sits
near its upwind edge rather than its centre.

### Limitations

- A geometric approximation of flame tilt and plume drift, not a CFD simulation.
- Point-source thermal model rather than a solid-flame view-factor model.
- Fixed yield factor (0.05) and stretch coefficient (0.05) rather than values
  fitted per scenario.
- Flat-earth projection for latitude and longitude — appropriate at facility
  scale, not across tens of kilometres.
- The blast correlation is a power-law fit and is flagged when the scaled
  distance falls outside its validated range.
- Exposure counts derive from OpenStreetMap building data, not census figures,
  and represent a lower bound rather than an occupancy count.

---

## Testing

```bash
cd blastapi
python -m pytest physics api/tests -q
```

Covers the physics modules, the geometry engine, and the API endpoints.

---

## Deployment

`blastapi/Dockerfile`, `render.yaml`, and `frontend/netlify.toml` are included.
The Docker build context is the repository root rather than `blastapi/`, so the
top-level `requirements.txt` is reachable during the build.

```bash
docker build -f blastapi/Dockerfile -t threat-zone-api .
docker run -p 8000:8000 threat-zone-api
```

---

## Project structure

```
requirements.txt      Backend Python dependencies
render.yaml           Deployment configuration
setup.bat             One-time dependency installation (Windows)
run_all.bat/.sh       Start backend and frontend together

blastapi/
  Dockerfile          Build context is the repository root
  api/                Endpoints, schemas, weather, geometry, exposure, OSM proxy
  physics/            TNT equivalence, overpressure, thermal radiation, fuel data

frontend/
  src/api/            Backend clients; config.js resolves the API address
  src/components/     Map, forms, weather, explanation, and comparison panels
  src/utils/          Formatting, geometry, severity colours, briefing text
```
