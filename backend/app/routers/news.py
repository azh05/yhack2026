from fastapi import APIRouter, Request

from app.models.gdelt import NewsResponse
from app.services.gdelt import fetch_gdelt_news

router = APIRouter()


@router.get("/news")
async def get_news(
    request: Request,
    country: str,
    keyword: str = "conflict",
) -> NewsResponse:
    client = request.app.state.http_client
    query = f"{keyword} {country}"
    articles = await fetch_gdelt_news(client, query)
    avg_tone = (
        sum(a.tone for a in articles) / len(articles) if articles else 0.0
    )
    return NewsResponse(query=query, articles=articles, average_tone=round(avg_tone, 2))
