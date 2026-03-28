from app.models.acled import ACLEDEvent, SeverityScore
from app.services.severity import calculate_severity


def _make_event(
    event_id: str = "UKR001",
    date: str = "2025-03-01",
    fatalities: int = 0,
    admin2: str = "Region1",
    civilian_targeting: str = "",
) -> ACLEDEvent:
    return ACLEDEvent(
        event_id_cnty=event_id,
        event_date=date,
        event_type="Battles",
        fatalities=fatalities,
        latitude=50.0,
        longitude=30.0,
        country="Ukraine",
        admin1="Test",
        admin2=admin2,
        civilian_targeting=civilian_targeting,
    )


class TestCalculateSeverity:
    def test_empty_events(self):
        score = calculate_severity([])
        assert score.total == 1.0
        assert score.deadliness == 1.0
        assert score.civilian_danger == 1.0

    def test_single_event_no_fatalities(self):
        events = [_make_event()]
        score = calculate_severity(events)
        assert 1.0 <= score.total <= 10.0
        assert score.deadliness == 1.0  # log2(1+0) + 1 = 1

    def test_high_fatalities_increases_deadliness(self):
        low = calculate_severity([_make_event(fatalities=1)])
        high = calculate_severity([_make_event(fatalities=100)])
        assert high.deadliness > low.deadliness

    def test_civilian_targeting_increases_danger(self):
        no_civilians = calculate_severity([
            _make_event(event_id="E1"),
            _make_event(event_id="E2"),
        ])
        with_civilians = calculate_severity([
            _make_event(event_id="E1", civilian_targeting="Civilian targeting"),
            _make_event(event_id="E2", civilian_targeting="Civilian targeting"),
        ])
        assert with_civilians.civilian_danger > no_civilians.civilian_danger

    def test_more_events_increases_frequency(self):
        few = calculate_severity([
            _make_event(event_id=f"E{i}", date=f"2025-03-{i+1:02d}")
            for i in range(3)
        ])
        many = calculate_severity([
            _make_event(event_id=f"E{i}", date=f"2025-03-{i+1:02d}")
            for i in range(20)
        ])
        assert many.event_frequency > few.event_frequency

    def test_geographic_spread(self):
        one_region = calculate_severity([
            _make_event(event_id="E1", admin2="RegionA", date="2025-03-01"),
            _make_event(event_id="E2", admin2="RegionA", date="2025-03-02"),
        ])
        many_regions = calculate_severity([
            _make_event(event_id="E1", admin2="RegionA", date="2025-03-01"),
            _make_event(event_id="E2", admin2="RegionB", date="2025-03-02"),
            _make_event(event_id="E3", admin2="RegionC", date="2025-03-03"),
            _make_event(event_id="E4", admin2="RegionD", date="2025-03-04"),
        ])
        assert many_regions.geographic_spread > one_region.geographic_spread

    def test_trend_escalating(self):
        """More events in second half = higher trend score."""
        events = (
            [_make_event(event_id=f"E{i}", date="2025-03-01") for i in range(2)]
            + [_make_event(event_id=f"L{i}", date="2025-03-15") for i in range(10)]
        )
        score = calculate_severity(events)
        assert score.trend_direction > 5.0  # above neutral

    def test_trend_declining(self):
        """More events in first half = lower trend score."""
        events = (
            [_make_event(event_id=f"E{i}", date="2025-03-01") for i in range(10)]
            + [_make_event(event_id=f"L{i}", date="2025-03-15") for i in range(2)]
        )
        score = calculate_severity(events)
        assert score.trend_direction < 5.0  # below neutral

    def test_score_clamped_to_range(self):
        """Total score should always be between 1 and 10."""
        # Extreme case: many fatalities, all civilian targeting, many regions
        events = [
            _make_event(
                event_id=f"E{i}",
                date=f"2025-03-{i+1:02d}",
                fatalities=1000,
                admin2=f"Region{i}",
                civilian_targeting="Civilian targeting",
            )
            for i in range(15)
        ]
        score = calculate_severity(events)
        assert 1.0 <= score.total <= 10.0
        assert 1.0 <= score.deadliness <= 10.0
        assert 1.0 <= score.civilian_danger <= 10.0

    def test_weights_sum_to_one(self):
        """Verify the weighted components produce a reasonable total."""
        events = [
            _make_event(event_id=f"E{i}", date=f"2025-03-{i+1:02d}", fatalities=5)
            for i in range(10)
        ]
        score = calculate_severity(events)
        # Manually compute expected total
        expected = (
            0.35 * score.deadliness
            + 0.25 * score.civilian_danger
            + 0.20 * score.event_frequency
            + 0.10 * score.geographic_spread
            + 0.10 * score.trend_direction
        )
        assert abs(score.total - round(expected, 2)) < 0.02

    def test_with_sample_events(self, sample_events):
        score = calculate_severity(sample_events)
        assert 1.0 <= score.total <= 10.0
        assert score.geographic_spread == 4.0  # 4 distinct admin2 regions
        assert score.civilian_danger > 1.0  # 2 of 4 events target civilians
