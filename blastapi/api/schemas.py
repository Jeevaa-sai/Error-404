from pydantic import BaseModel, Field
from typing import List, Tuple, Literal

FuelType = Literal[
    "propane", "lng", "gasoline", "diesel",
    "kerosene", "crude_oil", "ethanol", "butane",
]
HazardType = Literal["thermal", "overpressure"]
Severity = Literal["high", "medium", "low"]

class FacilityInput(BaseModel):
    lat: float
    lon: float
    tank_volume_m3: float = Field(gt=0)
    tank_diameter_m: float = Field(gt=0)
    fuel_type: FuelType
    wind_speed_mps: float = 0
    # meteorological convention: direction wind is COMING FROM, 0=N, 90=E, 180=S, 270=W
    wind_direction_deg: float = 0

class SeverityBand(BaseModel):
    severity: Severity
    hazard_type: HazardType
    threshold_label: str
    polygon: List[Tuple[float, float]]

class ZoneResponse(BaseModel):
    thermal_bands: List[SeverityBand]
    overpressure_bands: List[SeverityBand]
