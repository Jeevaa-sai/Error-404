from pydantic import BaseModel, Field, field_validator
from typing import List, Tuple, Literal, Optional

FuelType = Literal[
    "propane", "lng", "gasoline", "diesel",
    "kerosene", "crude_oil", "ethanol", "butane", "lpg",
]
HazardType = Literal["thermal", "overpressure"]
Severity = Literal["high", "medium", "low"]


class EnvironmentInput(BaseModel):
    tree_density: float = Field(default=0.0, ge=0.0, le=1.0)
    vehicle_density: float = Field(default=0.0, ge=0.0, le=1.0)
    nearby_buildings: int = Field(default=0, ge=0)
    terrain_roughness: float = Field(default=0.0, ge=0.0, le=1.0)
    occupancy_risk: float = Field(default=0.0, ge=0.0, le=1.0)


class FacilityInput(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    tank_volume_m3: float = Field(gt=0)
    tank_diameter_m: float = Field(gt=0)
    fuel_type: FuelType
    wind_speed_mps: float = Field(default=0.0, ge=0)
    # meteorological convention: direction wind is COMING FROM, 0=N, 90=E, 180=S, 270=W
    wind_direction_deg: float = Field(default=0.0, ge=0, le=360)
    use_live_weather: bool = False
    environment: Optional[EnvironmentInput] = None

    @field_validator("wind_direction_deg")
    @classmethod
    def validate_wind_direction_deg(cls, value):
        if value == 360:
            raise ValueError("wind_direction_deg must be in the range [0, 360), not 360.")
        return value


class WeatherInfo(BaseModel):
    source: str
    wind_speed_mps: float
    wind_direction_deg: float
    gust_mps: Optional[float] = None
    timestamp: Optional[str] = None
    confidence: str


class RiskContribution(BaseModel):
    """One environmental input's effect on the hazard footprint, in plain terms."""
    key: str
    label: str
    input_value: float
    factor: float
    # signed percentage change this input alone applies to every zone radius
    percent_change: float
    direction: Literal["expand", "shrink", "none"]
    explanation: str


class RiskAdjustment(BaseModel):
    tree_factor: float
    vehicle_factor: float
    building_factor: float
    terrain_factor: float
    occupancy_factor: float
    overall_multiplier: float
    # signed percentage the combined environment applies to every zone radius
    overall_percent_change: float = 0.0
    contributions: List[RiskContribution] = []


class SeverityBand(BaseModel):
    severity: Severity
    hazard_type: HazardType
    threshold_label: str
    polygon: List[Tuple[float, float]]
    # physics-only radius, before environment multiplier and wind stretch
    base_radius_m: float = 0.0
    # radius after the environment multiplier (still before wind stretch)
    radius_m: float = 0.0
    # how far the zone reaches from the facility along/against the wind
    downwind_extent_m: float = 0.0
    upwind_extent_m: float = 0.0


class WindEffect(BaseModel):
    """How the wind reshaped an otherwise circular zone."""
    wind_speed_mps: float
    wind_direction_deg: float
    downwind_bearing_deg: float
    # multiplier applied to the downwind reach, relative to the base radius
    downwind_stretch: float
    crosswind_stretch: float
    explanation: str


class ZoneResponse(BaseModel):
    thermal_bands: List[SeverityBand]
    overpressure_bands: List[SeverityBand]
    weather: Optional[WeatherInfo] = None
    risk_adjustment: Optional[RiskAdjustment] = None
    wind_effect: Optional[WindEffect] = None
    site: Optional[dict] = None
