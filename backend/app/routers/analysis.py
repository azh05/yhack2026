import asyncio
import logging

from fastapi import APIRouter, Request

from app.services import cache
from app.services.gemini import summarize_conflict
from app.services.gdelt import fetch_gdelt_news
from app.services.supabase import (
    get_cached_blurb_with_timestamp,
    get_cached_news,
    get_latest_news_timestamp,
    save_blurb,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/analysis")
async def get_analysis(request: Request, country: str):
    cache_key = f"analysis:{country}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    # Compare timestamps to decide if regeneration is needed
    latest_news_ts = get_latest_news_timestamp(country)
    blurb_result = get_cached_blurb_with_timestamp(country)

    if blurb_result and latest_news_ts:
        blurb_text, blurb_ts = blurb_result
        if blurb_ts >= latest_news_ts:
            response = {
                "summary": blurb_text,
                "cached": True,
                "generated_at": blurb_ts,
            }
            cache.set(cache_key, response)
            return response

    # Need to generate: get news articles
    db_news = get_cached_news(country, "conflict")
    if not db_news:
        # Fetch fresh from GDELT
        client = request.app.state.http_client
        articles = await fetch_gdelt_news(client, f"conflict {country}")
        news_text = "\n\n".join(
            a.title + ("\n" + a.content if hasattr(a, "content") and a.content else "")
            for a in articles
        )
    else:
        news_text = "\n\n".join(
            row["title"] + ("\n" + row.get("content", "") if row.get("content") else "")
            for row in db_news
        )

    if not news_text.strip():
        return {"summary": "", "cached": False, "generated_at": None}

    # Generate summary in a thread to avoid blocking
    loop = asyncio.get_running_loop()
    summary = await loop.run_in_executor(None, summarize_conflict, news_text)

    # Persist to Supabase in background
    from datetime import datetime, timezone

    generated_at = datetime.now(timezone.utc).isoformat()
    loop.run_in_executor(None, save_blurb, country, summary)

    response = {
        "summary": summary,
        "cached": False,
        "generated_at": generated_at,
    }
    cache.set(cache_key, response)
    return response
