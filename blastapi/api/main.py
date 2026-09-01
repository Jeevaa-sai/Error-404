from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from .schemas import FacilityInput, ZoneResponse, SeverityBand
    from .severity_bands import (
        THERMAL_BANDS_KW_M2, OVERPRESSURE_BANDS_KPA,
        THERMAL_LABELS, OVERPRESSURE_LABELS,
    )
    from .geometry import generate_wind_stretched_polygon
except ImportError:
    from schemas import FacilityInput, ZoneResponse, SeverityBand
    from severity_bands import (
        THERMAL_BANDS_KW_M2, OVERPRESSURE_BANDS_KPA,
        THERMAL_LABELS, OVERPRESSURE_LABELS,
    )
    from geometry import generate_wind_stretched_polygon

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


@app.post("/calculate-zones", response_model=ZoneResponse)
def calculate_zones(input: FacilityInput):
    props = get_fuel_properties(input.fuel_type)
    chi_r = props["chi_r"]

    tnt_mass_kg = calculate_tnt_equivalent_mass(input.tank_volume_m3, input.fuel_type)
    heat_release_kw = calculate_heat_release_rate_kw(input.tank_diameter_m, input.fuel_type)

    thermal_bands = []
    for severity, target_kw_m2 in THERMAL_BANDS_KW_M2.items():
        radius_m = solve_radius_for_thermal_flux(target_kw_m2, heat_release_kw, chi_r)
        polygon = generate_wind_stretched_polygon(
            input.lat, input.lon, radius_m,
            input.wind_speed_mps, input.wind_direction_deg,
        )
        thermal_bands.append(SeverityBand(
            severity=severity,
            hazard_type="thermal",
            threshold_label=THERMAL_LABELS[severity],
            polygon=polygon,
        ))

    overpressure_bands = []
    for severity, target_kpa in OVERPRESSURE_BANDS_KPA.items():
        radius_m = solve_radius_for_overpressure(target_kpa, tnt_mass_kg)
        polygon = generate_wind_stretched_polygon(
            input.lat, input.lon, radius_m,
            input.wind_speed_mps, input.wind_direction_deg,
        )
        overpressure_bands.append(SeverityBand(
            severity=severity,
            hazard_type="overpressure",
            threshold_label=OVERPRESSURE_LABELS[severity],
            polygon=polygon,
        ))

    return ZoneResponse(thermal_bands=thermal_bands, overpressure_bands=overpressure_bands)
