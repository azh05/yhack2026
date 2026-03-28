from typing import Any, Literal

from pydantic import BaseModel, model_validator


class ACLEDEvent(BaseModel):
    model_config = {"extra": "ignore"}

    event_id_cnty: str
    event_date: str
    event_type: str
    sub_event_type: str = ""
    fatalities: int = 0
    latitude: float = 0.0
    longitude: float = 0.0
    country: str = ""
    admin1: str = ""
    admin2: str = ""
    notes: str = ""
    source: str = ""
    inter1: str = ""
    inter2: str = ""
    civilian_targeting: str = ""

    @model_validator(mode="before")
    @classmethod
    def coerce_types(cls, data: dict[str, Any]) -> dict[str, Any]:
        if "fatalities" in data and isinstance(data["fatalities"], str):
            data["fatalities"] = int(data["fatalities"]) if data["fatalities"] else 0
        for field in ("latitude", "longitude"):
            if field in data and isinstance(data[field], str):
                data[field] = float(data[field]) if data[field] else 0.0
        return data


class SeverityScore(BaseModel):
    total: float
    deadliness: float
    civilian_danger: float
    event_frequency: float
    geographic_spread: float
    trend_direction: float


class ConflictFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    geometry: dict
    properties: dict


class ConflictGeoJSON(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[ConflictFeature]
    severity_summary: SeverityScore
