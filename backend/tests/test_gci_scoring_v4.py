"""GCI scorer v4 — v3 engine with beats floored at GCI_BEAT_FLOOR."""

from __future__ import annotations

import pytest

from app.services.gci_scoring import (
    GCI_BEAT_FLOOR,
    GuidanceOutcome,
    algorithm_id,
    compute_company_gci,
    compute_company_gci_v3,
    compute_company_gci_v4,
    compute_gci_v3_detail,
    outcome_score,
    outcome_score_v3,
    outcome_score_v4,
    scorer_version,
)


def _o(guided, actual, *, low=None, high=None, period="FY24", dropped=False):
    return GuidanceOutcome(
        period,
        "revenue_growth_pct",
        guided,
        actual,
        "t",
        guided_low=low,
        guided_high=high,
        dropped=dropped,
    )


def test_v4_explicit_flag(monkeypatch):
    monkeypatch.setenv("INTELLENS_GCI_VERSION", "v4")
    assert scorer_version() == "v4"
    assert algorithm_id() == "gci_scoring_v4"


def test_v4_in_band_and_misses_match_v3():
    for o in (
        _o(6.0, 5.5, low=5.0, high=7.0),
        _o(6.0, 4.0, low=5.0, high=7.0),
        _o(6.0, 1.0, low=5.0, high=7.0),
        _o(10.0, 10.1),
    ):
        assert outcome_score_v4(o) == pytest.approx(outcome_score_v3(o))


def test_v4_beat_never_below_floor():
    huge = _o(11.0, 19.7, low=10.0, high=12.0)
    assert outcome_score_v3(huge) < 2.0
    assert GCI_BEAT_FLOOR <= outcome_score_v4(huge) < GCI_BEAT_FLOOR + 1.0


def test_v4_beat_decays_with_distance():
    small = _o(6.0, 7.5, low=5.0, high=7.0)
    large = _o(6.0, 12.0, low=5.0, high=7.0)
    assert 100.0 > outcome_score_v4(small) > outcome_score_v4(large) > GCI_BEAT_FLOOR


@pytest.mark.parametrize("dist", [0.2, 1.0, 3.0, 10.0])
def test_v4_beat_outscores_equal_distance_miss(dist):
    beat = _o(6.0, 7.0 + dist, low=5.0, high=7.0)
    miss = _o(6.0, 5.0 - dist, low=5.0, high=7.0)
    assert outcome_score_v4(beat) > outcome_score_v4(miss)


def test_v4_excludes_pending_and_dropped():
    assert outcome_score_v4(_o(6.0, None)) is None
    assert outcome_score_v4(_o(6.0, 7.0, dropped=True)) is None


def test_v4_composite_routes_and_labels_version(monkeypatch):
    monkeypatch.delenv("INTELLENS_GCI_VERSION", raising=False)
    rows = [
        _o(11.0, 19.7, low=10.0, high=12.0, period="FY22"),
        _o(5.5, 1.4, low=4.0, high=7.0, period="FY24"),
    ]
    assert compute_company_gci(rows) == compute_company_gci_v4(rows)
    assert compute_company_gci_v4(rows) > compute_company_gci_v3(rows)
    assert compute_company_gci(rows, version="v3") == compute_company_gci_v3(rows)
    assert compute_gci_v3_detail(rows, version="v4").version == "v4"
    assert outcome_score(rows[0]) == pytest.approx(outcome_score_v4(rows[0]))
