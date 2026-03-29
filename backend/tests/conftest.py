from unittest.mock import patch

import httpx
import pytest
from fastapi.testclient import TestClient

from app.models.acled import ACLEDEvent


@pytest.fixture
def sample_events() -> list[ACLEDEvent]:
    """A small set of realistic ACLED events for testing."""
    return [
        ACLEDEvent(
            event_id_cnty="UKR001",
            event_date="2025-03-01",
            event_type="Battles",
            fatalities=5,
            latitude=50.45,
            longitude=30.52,
            country="Ukraine",
            admin1="Kyiv",
            admin2="Kyivskyi",
            notes="Clashes near Kyiv",
            source="Test Source",
            inter1="State Forces",
            inter2="Rebel Groups",
            civilian_targeting="",
        ),
        ACLEDEvent(
            event_id_cnty="UKR002",
            event_date="2025-03-05",
            event_type="Violence against civilians",
            fatalities=2,
            latitude=48.46,
            longitude=35.04,
            country="Ukraine",
            admin1="Dnipropetrovsk",
            admin2="Dniprovskyi",
            notes="Drone strike on residential area",
            source="Test Source",
            inter1="State Forces",
            inter2="Civilians",
            civilian_targeting="Civilian targeting",
        ),
        ACLEDEvent(
            event_id_cnty="UKR003",
            event_date="2025-03-10",
            event_type="Explosions/Remote violence",
            fatalities=0,
            latitude=49.99,
            longitude=36.25,
            country="Ukraine",
            admin1="Kharkiv",
            admin2="Kharkivskyi",
            notes="Shelling near Kharkiv",
            source="Test Source",
            inter1="State Forces",
            inter2="State Forces",
            civilian_targeting="",
        ),
        ACLEDEvent(
            event_id_cnty="UKR004",
            event_date="2025-03-15",
            event_type="Explosions/Remote violence",
            fatalities=10,
            latitude=47.86,
            longitude=35.16,
            country="Ukraine",
            admin1="Zaporizhia",
            admin2="Zaporizkyi",
            notes="Major bombardment",
            source="Test Source",
            inter1="State Forces",
            inter2="Civilians",
            civilian_targeting="Civilian targeting",
        ),
    ]


@pytest.fixture
def client() -> TestClient:
    """FastAPI test client with mocked Supabase cache."""
    from app.services import cache
    cache._store.clear()
    with patch("app.routers.conflicts.get_cached_events", return_value=None), \
         patch("app.routers.conflicts.upsert_events"), \
         patch("app.routers.news.get_cached_news", return_value=None), \
         patch("app.routers.news.upsert_news_articles"):
        from app.main import app
        with TestClient(app) as c:
            yield c
