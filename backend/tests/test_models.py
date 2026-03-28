from app.models.acled import ACLEDEvent, ConflictFeature, ConflictGeoJSON, SeverityScore
from app.models.gdelt import GDELTArticle, NewsResponse


class TestACLEDEvent:
    def test_basic_creation(self):
        event = ACLEDEvent(
            event_id_cnty="UKR001",
            event_date="2025-03-01",
            event_type="Battles",
        )
        assert event.event_id_cnty == "UKR001"
        assert event.fatalities == 0
        assert event.latitude == 0.0

    def test_coerce_string_fatalities(self):
        event = ACLEDEvent(
            event_id_cnty="UKR001",
            event_date="2025-03-01",
            event_type="Battles",
            fatalities="5",
        )
        assert event.fatalities == 5

    def test_coerce_empty_string_fatalities(self):
        event = ACLEDEvent(
            event_id_cnty="UKR001",
            event_date="2025-03-01",
            event_type="Battles",
            fatalities="",
        )
        assert event.fatalities == 0

    def test_coerce_string_coordinates(self):
        event = ACLEDEvent(
            event_id_cnty="UKR001",
            event_date="2025-03-01",
            event_type="Battles",
            latitude="50.45",
            longitude="30.52",
        )
        assert event.latitude == 50.45
        assert event.longitude == 30.52

    def test_coerce_empty_string_coordinates(self):
        event = ACLEDEvent(
            event_id_cnty="UKR001",
            event_date="2025-03-01",
            event_type="Battles",
            latitude="",
            longitude="",
        )
        assert event.latitude == 0.0
        assert event.longitude == 0.0

    def test_extra_fields_ignored(self):
        event = ACLEDEvent(
            event_id_cnty="UKR001",
            event_date="2025-03-01",
            event_type="Battles",
            timestamp=1234567890,
            year=2025,
            region="Europe",
        )
        assert event.event_id_cnty == "UKR001"
        assert not hasattr(event, "timestamp")

    def test_string_inter_fields(self):
        event = ACLEDEvent(
            event_id_cnty="UKR001",
            event_date="2025-03-01",
            event_type="Battles",
            inter1="External/Other forces",
            inter2="State Forces",
        )
        assert event.inter1 == "External/Other forces"
        assert event.inter2 == "State Forces"

    def test_from_acled_api_response(self):
        """Test parsing a realistic ACLED API response dict."""
        raw = {
            "event_id_cnty": "UKR210978",
            "event_date": "2025-03-04",
            "year": 2025,
            "event_type": "Explosions/Remote violence",
            "sub_event_type": "Air/drone strike",
            "actor1": "Military Forces of Russia",
            "inter1": "External/Other forces",
            "inter2": "",
            "civilian_targeting": "",
            "country": "Ukraine",
            "admin1": "Sumy",
            "admin2": "Shostkynskyi",
            "latitude": "51.7339",
            "longitude": "34.3415",
            "fatalities": 0,
            "notes": "Drone strike at Bila Bereza",
            "source": "Ministry of Defence of Ukraine",
            "timestamp": 1764121210,
        }
        event = ACLEDEvent.model_validate(raw)
        assert event.latitude == 51.7339
        assert event.longitude == 34.3415
        assert event.inter1 == "External/Other forces"
        assert event.civilian_targeting == ""


class TestSeverityScore:
    def test_creation(self):
        score = SeverityScore(
            total=5.0,
            deadliness=6.0,
            civilian_danger=3.0,
            event_frequency=7.0,
            geographic_spread=4.0,
            trend_direction=5.0,
        )
        assert score.total == 5.0


class TestConflictGeoJSON:
    def test_geojson_structure(self):
        geojson = ConflictGeoJSON(
            features=[
                ConflictFeature(
                    geometry={"type": "Point", "coordinates": [30.52, 50.45]},
                    properties={"event_id": "UKR001"},
                )
            ],
            severity_summary=SeverityScore(
                total=5.0,
                deadliness=6.0,
                civilian_danger=3.0,
                event_frequency=7.0,
                geographic_spread=4.0,
                trend_direction=5.0,
            ),
        )
        assert geojson.type == "FeatureCollection"
        assert len(geojson.features) == 1
        assert geojson.features[0].type == "Feature"
        assert geojson.features[0].geometry["type"] == "Point"


class TestGDELTModels:
    def test_article_defaults(self):
        article = GDELTArticle()
        assert article.url == ""
        assert article.tone == 0.0

    def test_news_response(self):
        resp = NewsResponse(
            query="conflict Ukraine",
            articles=[GDELTArticle(url="https://example.com", title="Test", tone=-2.5)],
            average_tone=-2.5,
        )
        assert len(resp.articles) == 1
        assert resp.average_tone == -2.5
