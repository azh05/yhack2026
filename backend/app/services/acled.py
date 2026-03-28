import logging
import time

import httpx

from app.config import get_settings
from app.models.acled import ACLEDEvent

logger = logging.getLogger(__name__)

ACLED_TOKEN_URL = "https://acleddata.com/oauth/token"
ACLED_API_URL = "https://acleddata.com/api/acled/read"

_access_token: str | None = None
_token_expires_at: float = 0


async def _get_access_token(client: httpx.AsyncClient) -> str:
    """Get a valid OAuth access token, refreshing if needed."""
    global _access_token, _token_expires_at

    if _access_token and time.time() < _token_expires_at:
        return _access_token

    settings = get_settings()
    resp = await client.post(
        ACLED_TOKEN_URL,
        data={
            "username": settings.acled_email,
            "password": settings.acled_password,
            "grant_type": "password",
            "client_id": "acled",
        },
    )
    resp.raise_for_status()
    token_data = resp.json()
    _access_token = token_data["access_token"]
    # Expire 5 min early to be safe (token lasts 24h)
    _token_expires_at = time.time() + token_data.get("expires_in", 86400) - 300
    logger.info("ACLED OAuth token acquired")
    return _access_token


async def fetch_acled_events(
    client: httpx.AsyncClient,
    country: str,
    start_date: str,
    end_date: str,
    limit: int = 500,
) -> list[ACLEDEvent]:
    token = await _get_access_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    events: list[ACLEDEvent] = []
    page = 1

    # Paginate through ACLED results until we either exhaust the data or
    # reach the overall caller-specified limit.
    while len(events) < limit:
        remaining = limit - len(events)
        page_limit = remaining
        params = {
            "country": country,
            "event_date": f"{start_date}|{end_date}",
            "event_date_where": "BETWEEN",
            "limit": str(page_limit),
            "page": str(page),
        }
        resp = await client.get(ACLED_API_URL, params=params, headers=headers)
        resp.raise_for_status()
        data = resp.json().get("data", [])

        if not data:
            break

        page_events = [ACLEDEvent.model_validate(item) for item in data]
        events.extend(page_events)

        # If we received fewer results than requested for this page,
        # there are no more pages to fetch.
        if len(data) < page_limit:
            break

        page += 1

    return events
