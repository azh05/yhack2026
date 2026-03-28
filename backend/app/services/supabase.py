from datetime import datetime, timezone
from functools import lru_cache

from supabase import Client, create_client

from app.config import get_settings
from app.models.acled import ACLEDEvent


@lru_cache
def get_supabase_client() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)


def upsert_events(events: list[ACLEDEvent]) -> None:
    client = get_supabase_client()
    rows = [
        {**e.model_dump(), "fetched_at": datetime.now(timezone.utc).isoformat()}
        for e in events
    ]
    if rows:
        client.table("conflict_events").upsert(rows, on_conflict="event_id_cnty").execute()


def get_cached_events(
    country: str, start_date: str, end_date: str
) -> list[dict] | None:
    client = get_supabase_client()
    result = (
        client.table("conflict_events")
        .select("*")
        .eq("country", country)
        .gte("event_date", start_date)
        .lte("event_date", end_date)
        .execute()
    )
    if result.data:
        return result.data
    return None


def get_cached_blurb(country: str) -> str | None:
    client = get_supabase_client()
    result = (
        client.table("ai_blurbs")
        .select("blurb_text")
        .eq("country", country)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0]["blurb_text"]
    return None


def save_blurb(country: str, text: str) -> None:
    client = get_supabase_client()
    client.table("ai_blurbs").insert(
        {
            "country": country,
            "blurb_text": text,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    ).execute()
