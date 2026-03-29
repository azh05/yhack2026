import asyncio
import logging

from fastapi import APIRouter, Request

from app.models.gdelt import GDELTArticle, NewsResponse
from app.services import cache
from app.services.gdelt import fetch_gdelt_news
from app.services.supabase import get_cached_news, upsert_news_articles

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/news")
async def get_news(
    request: Request,
    country: str,
    keyword: str = "conflict",
) -> NewsResponse:
    # 1. In-memory cache (instant)
    cache_key = f"news:{keyword}:{country}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    # 2. Supabase DB cache (persists across restarts)
    try:
        db_cached = get_cached_news(country, keyword)
        if db_cached:
            articles = [
                GDELTArticle(
                    url=row["url"],
                    title=row["title"],
                    tone=row.get("tone", 0),
                    source_country=row.get("source_country", ""),
                    seendate=row.get("seendate", ""),
                )
                for row in db_cached
            ]
            avg_tone = sum(a.tone for a in articles) / len(articles) if articles else 0.0
            response = NewsResponse(query=f"{keyword} {country}", articles=articles, average_tone=round(avg_tone, 2))
            cache.set(cache_key, response)
            return response
    except Exception:
        logger.warning("Supabase news cache check failed", exc_info=True)

    # 3. Fetch fresh from GDELT
    client = request.app.state.http_client
    query = f"{keyword} {country}"
    articles = await fetch_gdelt_news(client, query)
    avg_tone = (
        sum(a.tone for a in articles) / len(articles) if articles else 0.0
    )
    response = NewsResponse(query=query, articles=articles, average_tone=round(avg_tone, 2))
    cache.set(cache_key, response)

    # 4. Persist to Supabase in background
    if articles:
        try:
            loop = asyncio.get_running_loop()
            rows = [a.model_dump() for a in articles]
            loop.run_in_executor(None, upsert_news_articles, country, keyword, rows)
        except Exception:
            logger.warning("Failed to schedule news cache update", exc_info=True)

    return response
