from app.services.gci_scoring import (
    GuidanceOutcome,
    OutcomeLabel,
    classify_outcome,
    compute_company_gci,
    delta_pct,
    gci_trend_series,
    metric_breakdown,
    outcome_score,
)


def test_us004_exact_match_scores_high():
    o = GuidanceOutcome("FY24", "revenue_growth_pct", 10.0, 10.0, "exact", 1.0)
    assert classify_outcome(o) == OutcomeLabel.MET
    assert outcome_score(o) == 100.0


def test_us004_large_miss_scores_near_zero():
    o = GuidanceOutcome("FY24", "revenue_growth_pct", 10.0, 0.0, "miss", 1.0)
    assert classify_outcome(o) == OutcomeLabel.MISSED
    assert outcome_score(o) == 0.0


def test_beat_scores_high_not_like_miss():
    beat = GuidanceOutcome("FY24", "revenue_growth_pct", 10.0, 12.0, "beat", 1.0)
    miss = GuidanceOutcome("FY24", "revenue_growth_pct", 10.0, 8.0, "miss", 1.0)
    assert outcome_score(beat) >= 85.0
    assert outcome_score(miss) < outcome_score(beat)


def test_range_guidance_in_band_is_met():
    o = GuidanceOutcome(
        "FY25",
        "revenue_growth_pct",
        6.0,
        5.5,
        "5-7%",
        1.0,
        guided_low=5.0,
        guided_high=7.0,
    )
    assert classify_outcome(o) == OutcomeLabel.MET
    assert outcome_score(o) == 100.0


def test_dropped_not_full_miss():
    o = GuidanceOutcome(
        "FY25",
        "capex_inr_cr",
        100.0,
        None,
        "dropped",
        1.0,
        dropped=True,
    )
    assert classify_outcome(o) == OutcomeLabel.DROPPED
    assert outcome_score(o) == 35.0


def test_us004_empty_outcomes_return_none():
    assert compute_company_gci([]) is None


def test_us004_mixed_outcomes_deterministic():
    outcomes = [
        GuidanceOutcome("FY24", "revenue_growth_pct", 10.0, 10.0, "a", 1.0),
        GuidanceOutcome("FY25", "revenue_growth_pct", 10.0, 5.0, "b", 1.0),
    ]
    score = compute_company_gci(outcomes)
    assert score == 50.0


def test_metric_breakdown_splits():
    outcomes = [
        GuidanceOutcome("FY24", "revenue_growth_pct", 10.0, 10.0, "a", 1.0),
        GuidanceOutcome("FY24", "ebitda_margin_pct", 20.0, 10.0, "b", 1.0),
    ]
    breakdown = metric_breakdown(outcomes)
    assert breakdown["revenue_growth_pct"] == 100.0
    assert breakdown["ebitda_margin_pct"] == 0.0


def test_delta_pct():
    assert delta_pct(10.0, 12.0) == 20.0
    assert delta_pct(10.0, 8.0) == -20.0
    assert delta_pct(10.0, None) is None


def test_trend_series():
    outcomes = [
        GuidanceOutcome("FY24", "revenue_growth_pct", 10.0, 10.0, "a", 1.0, as_of="2024-01-01"),
        GuidanceOutcome("FY25", "revenue_growth_pct", 10.0, 5.0, "b", 1.0, as_of="2025-01-01"),
    ]
    series = gci_trend_series(outcomes, ["FY24", "FY25"])
    assert series[0]["gci_score"] == 100.0
    assert series[1]["gci_score"] == 50.0
