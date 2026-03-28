from unittest.mock import AsyncMock, patch

import pytest

from app.models.acled import ACLEDEvent
from app.models.gdelt import GDELTArticle


class TestHealthEndpoint:
    def test_health(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


class TestConflictsEndpoint:
    def test_missing_params(self, client):
        resp = client.get("/api/conflicts")
        assert resp.status_code == 422

    def test_missing_country(self, client):
        resp = client.get("/api/conflicts?start_date=2025-03-01&end_date=2025-03-28")
        assert resp.status_code == 422

    @patch("app.routers.conflicts.fetch_acled_events", new_callable=AsyncMock)
    def test_returns_geojson(self, mock_fetch, client, sample_events):
        mock_fetch.return_value = sample_events
        resp = client.get("/api/conflicts?country=Ukraine&start_date=2025-03-01&end_date=2025-03-28")
        assert resp.status_code == 200
        data = resp.json()
        assert data["type"] == "FeatureCollection"
        assert len(data["features"]) == 4
        assert "severity_summary" in data

    @patch("app.routers.conflicts.fetch_acled_events", new_callable=AsyncMock)
    def test_geojson_feature_structure(self, mock_fetch, client, sample_events):
        mock_fetch.return_value = sample_events
        resp = client.get("/api/conflicts?country=Ukraine&start_date=2025-03-01&end_date=2025-03-28")
        feature = resp.json()["features"][0]
        assert feature["type"] == "Feature"
        assert feature["geometry"]["type"] == "Point"
        assert len(feature["geometry"]["coordinates"]) == 2
        assert "event_id" in feature["properties"]
        assert "event_date" in feature["properties"]
        assert "fatalities" in feature["properties"]

    @patch("app.routers.conflicts.fetch_acled_events", new_callable=AsyncMock)
    def test_severity_in_response(self, mock_fetch, client, sample_events):
        mock_fetch.return_value = sample_events
        resp = client.get("/api/conflicts?country=Ukraine&start_date=2025-03-01&end_date=2025-03-28")
        severity = resp.json()["severity_summary"]
        assert 1.0 <= severity["total"] <= 10.0
        assert all(
            key in severity
            for key in ["deadliness", "civilian_danger", "event_frequency", "geographic_spread", "trend_direction"]
        )

    @patch("app.routers.conflicts.fetch_acled_events", new_callable=AsyncMock)
    def test_empty_response(self, mock_fetch, client):
        mock_fetch.return_value = []
        resp = client.get("/api/conflicts?country=Nowhere&start_date=2025-03-01&end_date=2025-03-28")
        assert resp.status_code == 200
        data = resp.json()
        assert data["features"] == []
        assert data["severity_summary"]["total"] == 1.0

    @patch("app.routers.conflicts.fetch_acled_events", new_callable=AsyncMock)
    def test_acled_error_returns_502(self, mock_fetch, client):
        mock_fetch.side_effect = Exception("Connection timeout")
        resp = client.get("/api/conflicts?country=Ukraine&start_date=2025-03-01&end_date=2025-03-28")
        assert resp.status_code == 502
        assert "ACLED" in resp.json()["detail"]


class TestNewsEndpoint:
    @patch("app.routers.news.fetch_gdelt_news", new_callable=AsyncMock)
    def test_returns_articles(self, mock_fetch, client):
        mock_fetch.return_value = [
            GDELTArticle(url="https://example.com/1", title="Article 1", tone=-3.5),
            GDELTArticle(url="https://example.com/2", title="Article 2", tone=-1.5),
        ]
        resp = client.get("/api/news?country=Ukraine")
        assert resp.status_code == 200
        data = resp.json()
        assert data["query"] == "conflict Ukraine"
        assert len(data["articles"]) == 2
        assert data["average_tone"] == -2.5

    @patch("app.routers.news.fetch_gdelt_news", new_callable=AsyncMock)
    def test_custom_keyword(self, mock_fetch, client):
        mock_fetch.return_value = []
        resp = client.get("/api/news?country=Syria&keyword=bombing")
        assert resp.status_code == 200
        data = resp.json()
        assert data["query"] == "bombing Syria"

    @patch("app.routers.news.fetch_gdelt_news", new_callable=AsyncMock)
    def test_empty_articles(self, mock_fetch, client):
        mock_fetch.return_value = []
        resp = client.get("/api/news?country=Ukraine")
        assert resp.status_code == 200
        data = resp.json()
        assert data["articles"] == []
        assert data["average_tone"] == 0.0

    def test_missing_country(self, client):
        resp = client.get("/api/news")
        assert resp.status_code == 422
