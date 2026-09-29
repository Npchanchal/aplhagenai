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


# --- W1.4 evidence-weighted composite -----------------------------------------


def _m(period, metric, guided, actual):
    return GuidanceOutcome(period, metric, guided, actual, "t")


def test_evidence_weighting_single_period_metric_is_context_only():
    rows = [_m(f"FY{20 + i}", "revenue_growth_pct", 10.0, 8.0) for i in range(5)]
    rows.append(_m("FY25", "operating_margin_pct", 21.0, 21.0))  # one period, perfect
    detail = compute_gci_v3_detail(rows, version="v4")
    assert "operating_margin_pct" in detail.context_metrics
    assert "operating_margin_pct" not in detail.by_metric
    assert detail.weights_used == {"revenue_growth_pct": 5.0}
    # composite equals the deep metric alone — the single perfect row cannot lift it
    assert detail.gci == detail.by_metric["revenue_growth_pct"]
    assert detail.periods_by_metric == {"revenue_growth_pct": 5, "operating_margin_pct": 1}


def test_evidence_weighting_weights_by_closed_periods_capped():
    rows = [_m(f"FY{18 + i}", "revenue_growth_pct", 10.0, 10.0) for i in range(7)]  # 7 → cap 5
    rows += [_m(f"FY{23 + i}", "ebitda_margin_pct", 20.0, 16.0) for i in range(2)]  # miss, 2 periods
    detail = compute_gci_v3_detail(rows, version="v4")
    assert detail.weights_used == {"revenue_growth_pct": 5.0, "ebitda_margin_pct": 2.0}
    s_rev = detail.by_metric["revenue_growth_pct"]
    s_ebitda = detail.by_metric["ebitda_margin_pct"]
    expected = (5 * s_rev + 2 * s_ebitda) / 7
    assert abs(detail.gci - round(expected, 1)) <= 0.1
    assert detail.gci > (s_rev + s_ebitda) / 2  # flat mean would over-weight the shallow miss


def test_evidence_weighting_all_single_period_falls_back_to_flat_mean():
    rows = [_m("FY25", "revenue_growth_pct", 10.0, 10.0), _m("FY25", "nim_pct", 4.0, 3.0)]
    detail = compute_gci_v3_detail(rows, version="v4")
    assert detail.context_metrics == {}
    assert set(detail.by_metric) == {"revenue_growth_pct", "nim_pct"}
    assert detail.low_confidence is True


def test_v3_composite_stays_flat_mean():
    rows = [_m(f"FY{20 + i}", "revenue_growth_pct", 10.0, 8.0) for i in range(5)]
    rows.append(_m("FY25", "operating_margin_pct", 21.0, 21.0))
    detail = compute_gci_v3_detail(rows, version="v3")
    assert detail.context_metrics == {}
    assert set(detail.by_metric) == {"revenue_growth_pct", "operating_margin_pct"}


def test_actual_cite_without_promise_cite_excluded():
    """Production-shaped row (has actual URL/quote/as_of) without guidance_* does not score."""
    from app.services.gci_scoring import classify_outcome

    ok = GuidanceOutcome(
        "FY24",
        "revenue_growth_pct",
        10.0,
        10.0,
        "t",
        source_url="https://example.com/actual",
        quote_span="actual 10%",
        as_of="2024-05-01",
        guidance_source_url="https://example.com/guide",
        guidance_quote="guide 10%",
        guidance_as_of="2023-05-01",
        reviewed_by="analyst:nv",
        reviewed_at="2026-09-29",
    )
    bare = GuidanceOutcome(
        "FY25",
        "operating_margin_pct",
        21.0,
        21.0,
        "t",
        source_url="https://example.com/om",
        quote_span="margin 21%",
        as_of="2025-04-17",
    )
    detail = compute_gci_v3_detail([ok, bare], version="v4")
    assert classify_outcome(bare).value == "pending_guidance_cite"
    assert outcome_score_v4(bare) is None
    assert "operating_margin_pct" not in detail.by_metric
    assert "operating_margin_pct" not in detail.context_metrics
    assert detail.gci == detail.by_metric["revenue_growth_pct"]


def test_dual_cited_without_reviewer_is_excluded():
    from app.services.gci_scoring import classify_outcome
    from app.services.score_policy import is_unreviewed

    row = GuidanceOutcome(
        "FY24",
        "revenue_growth_pct",
        10.0,
        10.0,
        "t",
        source_url="https://example.com/actual",
        quote_span="actual 10%",
        as_of="2024-05-01",
        guidance_source_url="https://example.com/guide",
        guidance_quote="guide 10%",
        guidance_as_of="2023-05-01",
    )
    assert is_unreviewed(row)
    assert classify_outcome(row).value == "met"
    assert outcome_score_v4(row) is None
    assert compute_gci_v3_detail([row], version="v4").gci is None
