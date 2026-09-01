import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

try:
    from .config import load_env_file
except ImportError:
    from config import load_env_file

# Reads blastapi/.env before anything asks for a key. Real environment
# variables take precedence, so deployments are unaffected.
_loaded_env = load_env_file()

try:
    from .schemas import (
        FacilityInput, ZoneResponse, SeverityBand, WeatherInfo,
        RiskAdjustment, WindEffect,
    )
    from .severity_bands import (
        THERMAL_BANDS_KW_M2, OVERPRESSURE_BANDS_KPA,
        THERMAL_LABELS, OVERPRESSURE_LABELS,
    )
    from .geometry import generate_wind_stretched_polygon, describe_wind_effect
    from .weather import get_weather_for_location
    from .exposure import calculate_environment_multiplier
except ImportError:
    from schemas import (
        FacilityInput, ZoneResponse, SeverityBand, WeatherInfo,
        RiskAdjustment, WindEffect,
    )
    from severity_bands import (
        THERMAL_BANDS_KW_M2, OVERPRESSURE_BANDS_KPA,
        THERMAL_LABELS, OVERPRESSURE_LABELS,
    )
    from geometry import generate_wind_stretched_polygon, describe_wind_effect
    from weather import get_weather_for_location
    from exposure import calculate_environment_multiplier

from physics.tnt_equivalent import calculate_tnt_equivalent_mass
from physics.overpressure import solve_radius_for_overpressure
from physics.thermal import calculate_heat_release_rate_kw, solve_radius_for_thermal_flux
from physics.fuel_lookup import FUEL_PROPERTIES, get_fuel_properties

app = FastAPI(title="DER-02 Threat-Zone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    # Reports whether a live weather key is configured, without ever
    # revealing the key itself — handy for checking a deployment.
    return {
        "status": "ok",
        "live_weather_configured": bool(os.getenv("OPENWEATHER_API_KEY")),
    }


@app.get("/fuels")
def list_fuels():
    return {"fuels": sorted(FUEL_PROPERTIES)}


@app.post("/calculate-zones", response_model=ZoneResponse)
def calculate_zones(input: FacilityInput):
    weather = get_weather_for_location(input.lat, input.lon, input.use_live_weather)
    wind_speed = float(input.wind_speed_mps if input.wind_speed_mps > 0 else weather["wind_speed_mps"])
    wind_direction = float(input.wind_direction_deg if input.wind_direction_deg > 0 else weather["wind_direction_deg"])

    # When the operator supplies the wind by hand there is no observation to
    # report, so echo back the values actually used rather than the
    # deterministic placeholder the fallback generates from the coordinates.
    if weather["source"] == "manual":
        weather["wind_speed_mps"] = wind_speed
        weather["wind_direction_deg"] = wind_direction
        weather["gust_mps"] = None

    environment = input.environment or {}
    risk_adjustment = calculate_environment_multiplier(environment)
    env_multiplier = float(risk_adjustment["overall_multiplier"])

    props = get_fuel_properties(input.fuel_type)
    chi_r = props["chi_r"]

    tnt_mass_kg = calculate_tnt_equivalent_mass(input.tank_volume_m3, input.fuel_type)
    heat_release_kw = calculate_heat_release_rate_kw(input.tank_diameter_m, input.fuel_type)

    wind_effect = describe_wind_effect(wind_speed, wind_direction)

    def build_band(severity, hazard_type, threshold_label, base_radius_m):
        radius_m = base_radius_m * env_multiplier
        polygon = generate_wind_stretched_polygon(
            input.lat, input.lon, radius_m,
            wind_speed, wind_direction,
        )
        return SeverityBand(
            severity=severity,
            hazard_type=hazard_type,
            threshold_label=threshold_label,
            polygon=polygon,
            base_radius_m=round(base_radius_m, 1),
            radius_m=round(radius_m, 1),
            downwind_extent_m=round(radius_m * wind_effect["downwind_stretch"], 1),
            upwind_extent_m=round(radius_m, 1),
        )

    thermal_bands = [
        build_band(
            severity, "thermal", THERMAL_LABELS[severity],
            solve_radius_for_thermal_flux(target_kw_m2, heat_release_kw, chi_r),
        )
        for severity, target_kw_m2 in THERMAL_BANDS_KW_M2.items()
    ]

    overpressure_bands = [
        build_band(
            severity, "overpressure", OVERPRESSURE_LABELS[severity],
            solve_radius_for_overpressure(target_kpa, tnt_mass_kg),
        )
        for severity, target_kpa in OVERPRESSURE_BANDS_KPA.items()
    ]

    return ZoneResponse(
        thermal_bands=thermal_bands,
        overpressure_bands=overpressure_bands,
        weather=WeatherInfo(**weather),
        risk_adjustment=RiskAdjustment(**risk_adjustment),
        wind_effect=WindEffect(**wind_effect),
        site={"lat": input.lat, "lon": input.lon},
    )


# Serves the built frontend (frontend/dist) from the same origin as the API,
# so the whole app is reachable through one link/port. Optional: only mounts
# if the build exists, so the API still runs standalone without it.
_frontend_dist = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.isdir(_frontend_dist):
    app.mount("/", StaticFiles(directory=_frontend_dist, html=True), name="frontend")
