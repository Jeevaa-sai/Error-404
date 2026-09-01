import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

try:
    from .schemas import FacilityInput, ZoneResponse, SeverityBand, WeatherInfo, RiskAdjustment
    from .severity_bands import (
        THERMAL_BANDS_KW_M2, OVERPRESSURE_BANDS_KPA,
        THERMAL_LABELS, OVERPRESSURE_LABELS,
    )
    from .geometry import generate_wind_stretched_polygon
    from .weather import get_weather_for_location
    from .exposure import calculate_environment_multiplier
except ImportError:
    from schemas import FacilityInput, ZoneResponse, SeverityBand, WeatherInfo, RiskAdjustment
    from severity_bands import (
        THERMAL_BANDS_KW_M2, OVERPRESSURE_BANDS_KPA,
        THERMAL_LABELS, OVERPRESSURE_LABELS,
    )
    from geometry import generate_wind_stretched_polygon
    from weather import get_weather_for_location
    from exposure import calculate_environment_multiplier

from physics.tnt_equivalent import calculate_tnt_equivalent_mass
from physics.overpressure import solve_radius_for_overpressure
from physics.thermal import calculate_heat_release_rate_kw, solve_radius_for_thermal_flux
from physics.fuel_lookup import get_fuel_properties

app = FastAPI(title="DER-02 Threat-Zone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/fuels")
def list_fuels():
    supported = ["propane", "lng", "gasoline", "diesel"]
    return {"fuels": supported}


@app.post("/calculate-zones", response_model=ZoneResponse)
def calculate_zones(input: FacilityInput):
    weather = get_weather_for_location(input.lat, input.lon, input.use_live_weather)
    wind_speed = float(input.wind_speed_mps if input.wind_speed_mps > 0 else weather["wind_speed_mps"])
    wind_direction = float(input.wind_direction_deg if input.wind_direction_deg > 0 else weather["wind_direction_deg"])

    environment = input.environment or {}
    risk_adjustment = calculate_environment_multiplier(environment)
    env_multiplier = float(risk_adjustment["overall_multiplier"])

    props = get_fuel_properties(input.fuel_type)
    chi_r = props["chi_r"]

    tnt_mass_kg = calculate_tnt_equivalent_mass(input.tank_volume_m3, input.fuel_type)
    heat_release_kw = calculate_heat_release_rate_kw(input.tank_diameter_m, input.fuel_type)

    thermal_bands = []
    for severity, target_kw_m2 in THERMAL_BANDS_KW_M2.items():
        radius_m = solve_radius_for_thermal_flux(target_kw_m2, heat_release_kw, chi_r) * env_multiplier
        polygon = generate_wind_stretched_polygon(
            input.lat, input.lon, radius_m,
            wind_speed, wind_direction,
        )
        thermal_bands.append(SeverityBand(
            severity=severity,
            hazard_type="thermal",
            threshold_label=THERMAL_LABELS[severity],
            polygon=polygon,
        ))

    overpressure_bands = []
    for severity, target_kpa in OVERPRESSURE_BANDS_KPA.items():
        radius_m = solve_radius_for_overpressure(target_kpa, tnt_mass_kg) * env_multiplier
        polygon = generate_wind_stretched_polygon(
            input.lat, input.lon, radius_m,
            wind_speed, wind_direction,
        )
        overpressure_bands.append(SeverityBand(
            severity=severity,
            hazard_type="overpressure",
            threshold_label=OVERPRESSURE_LABELS[severity],
            polygon=polygon,
        ))

    return ZoneResponse(
        thermal_bands=thermal_bands,
        overpressure_bands=overpressure_bands,
        weather=WeatherInfo(**weather),
        risk_adjustment=RiskAdjustment(**risk_adjustment),
        site={"lat": input.lat, "lon": input.lon},
    )


# Serves the built frontend (frontend/dist) from the same origin as the API,
# so the whole app is reachable through one link/port. Optional: only mounts
# if the build exists, so the API still runs standalone without it.
_frontend_dist = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.isdir(_frontend_dist):
    app.mount("/", StaticFiles(directory=_frontend_dist, html=True), name="frontend")
