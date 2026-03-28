import asyncio
import logging

from fastapi import APIRouter, HTTPException, Request

from app.models.acled import ACLEDEvent, ConflictFeature, ConflictGeoJSON
from app.services.acled import fetch_acled_events
from app.services.severity import calculate_severity
from app.services.supabase import get_cached_events, upsert_events

logger = logging.getLogger(__name__)

router = APIRouter()


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
        asyncio.get_event_loop().run_in_executor(None, upsert_events, events)
    except Exception:
        logger.warning("Failed to cache events", exc_info=True)

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
