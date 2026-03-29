import asyncio
import logging

import httpx

from app.models.gdelt import GDELTArticle

logger = logging.getLogger(__name__)

GDELT_BASE_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
_MAX_RETRIES = 3


async def fetch_gdelt_news(
    client: httpx.AsyncClient,
    query: str,
    max_records: int = 25,
) -> list[GDELTArticle]:
    params = {
        "query": f"{query} sourcelang:english",
        "mode": "ArtList",
        "maxrecords": str(max_records),
        "format": "json",
    }
    for attempt in range(_MAX_RETRIES):
        try:
            resp = await client.get(GDELT_BASE_URL, params=params, timeout=60.0)
            if resp.status_code == 429:
                wait = 6 * (attempt + 1)
                logger.info("GDELT rate-limited, retrying in %ds", wait)
                await asyncio.sleep(wait)
                continue
            resp.raise_for_status()
            raw_articles = resp.json().get("articles", [])
            articles = []
            for a in raw_articles:
                raw_tone = a.get("tone", 0)
                try:
                    tone = float(raw_tone)
                except (TypeError, ValueError):
                    tone = 0.0
                articles.append(
                    GDELTArticle(
                        url=a.get("url", ""),
                        title=a.get("title", ""),
                        tone=tone,
                        source_country=a.get("sourcecountry", ""),
                        seendate=a.get("seendate", ""),
                    )
                )
            return articles
        except httpx.TimeoutException:
            logger.warning("GDELT request timed out (attempt %d/%d)", attempt + 1, _MAX_RETRIES)
            continue
        except Exception:
            logger.warning("GDELT API request failed", exc_info=True)
            return []
    logger.warning("GDELT exhausted %d retries", _MAX_RETRIES)
    return []
