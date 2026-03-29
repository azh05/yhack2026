import asyncio
import collections
import datetime
import logging
import statistics

from fastapi import APIRouter, HTTPException, Query, Request

from app.models.acled import ACLEDEvent, ConflictFeature, ConflictGeoJSON, ConflictZone
from app.services import cache
from app.services.acled import fetch_acled_events
from app.services.severity import calculate_severity
from app.services.supabase import get_cached_events, upsert_events

logger = logging.getLogger(__name__)

router = APIRouter()

WATCHED_COUNTRIES = [
    {"country": "Sudan",                            "region": "Sub-Saharan Africa"},
    {"country": "Ukraine",                          "region": "Eastern Europe"},
    {"country": "Palestine",                        "region": "Middle East & North Africa"},
    {"country": "Myanmar",                          "region": "Southeast Asia"},
    {"country": "Syria",                            "region": "Middle East & North Africa"},
    {"country": "Somalia",                          "region": "Sub-Saharan Africa"},
    {"country": "Ethiopia",                         "region": "Sub-Saharan Africa"},
    {"country": "Democratic Republic of Congo",     "region": "Sub-Saharan Africa"},
    {"country": "Mali",                             "region": "Sub-Saharan Africa"},
    {"country": "Nigeria",                          "region": "Sub-Saharan Africa"},
    {"country": "Afghanistan",                      "region": "South Asia"},
    {"country": "Yemen",                            "region": "Middle East & North Africa"},
    {"country": "Haiti",                            "region": "Central America & Caribbean"},
    {"country": "Colombia",                         "region": "South America"},
    {"country": "Pakistan",                         "region": "South Asia"},
]


async def _fetch_country_events(
    client,
    country: str,
    start_date: str,
    end_date: str,
) -> list[ACLEDEvent]:
    """Fetch events for a single country, trying cache first then ACLED."""
    try:
        cached = get_cached_events(country, start_date, end_date)
        if cached:
            return [ACLEDEvent.model_validate(row) for row in cached]
    except Exception:
        logger.warning("Supabase cache check failed for %s, fetching fresh", country, exc_info=True)

    events = await fetch_acled_events(client, country, start_date, end_date)

    try:
        loop = asyncio.get_running_loop()
        future = loop.run_in_executor(None, upsert_events, events)
        future.add_done_callback(
            lambda f: logger.warning("Failed to cache events for %s", country, exc_info=f.exception())
            if f.exception()
            else None
        )
    except Exception:
        logger.warning("Failed to schedule cache update for %s", country, exc_info=True)

    return events


@router.get("/conflict-zones")
async def get_conflict_zones(
    request: Request,
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
) -> list[ConflictZone]:
    # ACLED data availability lags ~1 year; use a recent available window
    # so the demo always returns data.
    if start_date is None:
        start_date = "2025-02-01"
    if end_date is None:
        end_date = "2025-03-28"

    cache_key = f"zones:{start_date}:{end_date}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    client = request.app.state.http_client
    sem = asyncio.Semaphore(3)

    async def fetch_one(entry: dict) -> tuple[dict, list[ACLEDEvent]]:
        async with sem:
            events = await _fetch_country_events(client, entry["country"], start_date, end_date)
            return entry, events

    results = await asyncio.gather(
        *[fetch_one(entry) for entry in WATCHED_COUNTRIES],
        return_exceptions=True,
    )

    zones: list[ConflictZone] = []
    for result in results:
        if isinstance(result, BaseException):
            logger.error("Error fetching conflict zone data: %s", result, exc_info=result)
            continue

        entry, events = result
        if not events:
            continue

        country = entry["country"]
        region = entry["region"]

        severity_summary = calculate_severity(events)

        lats = [e.latitude for e in events]
        lngs = [e.longitude for e in events]
        centroid_lat = statistics.mean(lats)
        centroid_lng = statistics.mean(lngs)

        event_count = len(events)
        fatalities30d = sum(e.fatalities for e in events)

        trend_val = severity_summary.trend_direction
        if trend_val >= 6.5:
            trend = "escalating"
        elif trend_val <= 3.5:
            trend = "de-escalating"
        else:
            trend = "stable"

        type_counter = collections.Counter(e.event_type for e in events)
        primary_type = type_counter.most_common(1)[0][0]

        description = (
            f"{event_count} recorded events with {fatalities30d} fatalities in the selected period."
        )

        zones.append(
            ConflictZone(
                id=country.lower().replace(" ", "-"),
                name=country,
                country=country,
                region=region,
                latitude=centroid_lat,
                longitude=centroid_lng,
                severity=severity_summary.total,
                eventCount=event_count,
                fatalities30d=fatalities30d,
                trend=trend,
                primaryType=primary_type,
                description=description,
            )
        )

    zones.sort(key=lambda z: z.severity, reverse=True)
    cache.set(cache_key, zones)
    return zones


@router.get("/conflicts")
async def get_conflicts(
    request: Request,
    country: str,
    start_date: str,
    end_date: str,
) -> ConflictGeoJSON:
    client = request.app.state.http_client

    # Check cache first
    try:
        cached = get_cached_events(country, start_date, end_date)
        if cached:
            events = [ACLEDEvent.model_validate(row) for row in cached]
            severity = calculate_severity(events)
            return _build_geojson(events, severity)
    except Exception:
        logger.warning("Supabase cache check failed, fetching fresh", exc_info=True)

    # Fetch from ACLED
    try:
        events = await fetch_acled_events(client, country, start_date, end_date)
    except Exception as e:
        logger.error("Error while fetching events from ACLED", exc_info=True)
        raise HTTPException(
            status_code=502,
            detail="Failed to fetch conflict data from ACLED",
        )

    severity = calculate_severity(events)

    # Cache in background
    try:
        loop = asyncio.get_running_loop()
        future = loop.run_in_executor(None, upsert_events, events)
        future.add_done_callback(
            lambda f: logger.warning("Failed to cache events", exc_info=f.exception())
            if f.exception()
            else None
        )
    except Exception:
        logger.warning("Failed to schedule cache update", exc_info=True)

    return _build_geojson(events, severity)


def _build_geojson(events: list[ACLEDEvent], severity) -> ConflictGeoJSON:
    features = []
    for e in events:
        features.append(
            ConflictFeature(
                geometry={
                    "type": "Point",
                    "coordinates": [e.longitude, e.latitude],
                },
                properties={
                    "event_id": e.event_id_cnty,
                    "event_date": e.event_date,
                    "event_type": e.event_type,
                    "fatalities": e.fatalities,
                    "country": e.country,
                    "admin1": e.admin1,
                    "admin2": e.admin2,
                    "notes": e.notes,
                    "source": e.source,
                },
            )
        )
    return ConflictGeoJSON(features=features, severity_summary=severity)
