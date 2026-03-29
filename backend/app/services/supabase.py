from datetime import datetime, timedelta, timezone
from functools import lru_cache

from supabase import Client, create_client

from app.config import get_settings
from app.models.acled import ACLEDEvent


@lru_cache
def get_supabase_client() -> Client:
    """Cached client for reads on the main thread."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)


def _new_supabase_client() -> Client:
    """Fresh client for background thread writes (not thread-safe to share)."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)


_CACHE_COLUMNS = {
    "event_id_cnty", "event_date", "event_type", "sub_event_type",
    "fatalities", "latitude", "longitude", "country",
    "admin1", "admin2", "notes", "source", "fetched_at",
}

# Columns that actually exist in the Supabase table
_TABLE_COLUMNS = {
    "event_id_cnty", "event_date", "event_type", "sub_event_type",
    "country", "admin1", "admin2", "latitude", "longitude",
    "fatalities", "notes", "source", "fetched_at",
}


def upsert_events(events: list[ACLEDEvent]) -> None:
    client = _new_supabase_client()
    now = datetime.now(timezone.utc).isoformat()
    rows = [
        {k: v for k, v in {**e.model_dump(), "fetched_at": now}.items() if k in _TABLE_COLUMNS}
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


def upsert_news_articles(country: str, keyword: str, articles: list[dict]) -> None:
    client = _new_supabase_client()
    now = datetime.now(timezone.utc).isoformat()
    rows = [
        {
            "country": country,
            "keyword": keyword,
            "url": a["url"],
            "title": a["title"],
            "tone": a.get("tone", 0),
            "source_country": a.get("source_country", ""),
            "seendate": a.get("seendate", ""),
            "fetched_at": now,
        }
        for a in articles
        if a.get("url")
    ]
    if rows:
        client.table("news_articles").upsert(rows, on_conflict="country,url").execute()


def get_cached_news(country: str, keyword: str, max_age_hours: int = 6) -> list[dict] | None:
    client = get_supabase_client()
    cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
    result = (
        client.table("news_articles")
        .select("*")
        .eq("country", country)
        .eq("keyword", keyword)
        .gte("fetched_at", cutoff.isoformat())
        .order("fetched_at", desc=True)
        .limit(25)
        .execute()
    )
    if result.data:
        return result.data
    return None


def get_latest_news_timestamp(country: str) -> str | None:
    client = get_supabase_client()
    result = (
        client.table("news_articles")
        .select("fetched_at")
        .eq("country", country)
        .order("fetched_at", desc=True)
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0]["fetched_at"]
    return None


def get_cached_blurb_with_timestamp(country: str) -> tuple[str, str] | None:
    client = get_supabase_client()
    result = (
        client.table("ai_blurbs")
        .select("blurb_text, created_at")
        .eq("country", country)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0]["blurb_text"], result.data[0]["created_at"]
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
