import logging

import httpx

from app.models.gdelt import GDELTArticle

logger = logging.getLogger(__name__)

GDELT_BASE_URL = "https://api.gdeltproject.org/api/v2/doc/doc"


async def fetch_gdelt_news(
    client: httpx.AsyncClient,
    query: str,
    max_records: int = 25,
) -> list[GDELTArticle]:
    params = {
        "query": query,
        "mode": "ArtList",
        "maxrecords": str(max_records),
        "format": "json",
    }
    try:
        resp = await client.get(GDELT_BASE_URL, params=params)
        resp.raise_for_status()
        raw_articles = resp.json().get("articles", [])
        articles = []
        for a in raw_articles:
            articles.append(
                GDELTArticle(
                    url=a.get("url", ""),
                    title=a.get("title", ""),
                    tone=float(a.get("tone", 0)),
                    source_country=a.get("sourcecountry", ""),
                    seendate=a.get("seendate", ""),
                )
            )
        return articles
    except Exception:
        logger.warning("GDELT API request failed", exc_info=True)
        return []
