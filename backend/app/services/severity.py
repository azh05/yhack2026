import math
from datetime import datetime

import pandas as pd

from app.models.acled import ACLEDEvent, SeverityScore


def _scale_log(value: float, base: float = 2.0) -> float:
    return min(10.0, 1.0 + math.log2(1.0 + value))


def calculate_severity(events: list[ACLEDEvent]) -> SeverityScore:
    if not events:
        return SeverityScore(
            total=1.0,
            deadliness=1.0,
            civilian_danger=1.0,
            event_frequency=1.0,
            geographic_spread=1.0,
            trend_direction=1.0,
        )

    df = pd.DataFrame([e.model_dump() for e in events])
    df["event_date"] = pd.to_datetime(df["event_date"])

    # Deadliness (35%): log-scaled total fatalities
    total_fatalities = df["fatalities"].sum()
    deadliness = _scale_log(total_fatalities)

    # Civilian Danger (25%): proportion of events targeting civilians
    civilian_events = (df["civilian_targeting"] != "").sum()
    civilian_ratio = civilian_events / len(df)
    civilian_danger = 1.0 + 9.0 * civilian_ratio  # linear [1, 10]

    # Event Frequency (20%): events per week
    date_range = (df["event_date"].max() - df["event_date"].min()).days
    weeks = max(date_range / 7.0, 1.0)
    events_per_week = len(df) / weeks
    event_frequency = _scale_log(events_per_week)

    # Geographic Spread (10%): distinct admin2 regions
    distinct_regions = df["admin2"].nunique()
    geographic_spread = min(10.0, float(distinct_regions))

    # Trend Direction (10%): second-half vs first-half event count
    midpoint = df["event_date"].min() + (df["event_date"].max() - df["event_date"].min()) / 2
    first_half = (df["event_date"] <= midpoint).sum()
    second_half = (df["event_date"] > midpoint).sum()
    change_ratio = (second_half - first_half) / max(first_half, 1)
    # Map from [-1, 2+] to [1, 10]
    trend_direction = max(1.0, min(10.0, 5.0 + change_ratio * 3.0))

    total = (
        0.35 * deadliness
        + 0.25 * civilian_danger
        + 0.20 * event_frequency
        + 0.10 * geographic_spread
        + 0.10 * trend_direction
    )
    total = max(1.0, min(10.0, total))

    return SeverityScore(
        total=round(total, 2),
        deadliness=round(deadliness, 2),
        civilian_danger=round(civilian_danger, 2),
        event_frequency=round(event_frequency, 2),
        geographic_spread=round(geographic_spread, 2),
        trend_direction=round(trend_direction, 2),
    )
