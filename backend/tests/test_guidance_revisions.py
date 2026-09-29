"""In-year guidance revisions: opening band scores, final band is a second readout."""

from fastapi.testclient import TestClient

from app.data.seed import get_outcomes
from app.main import app
from app.services.gci_scoring import (
    GuidanceOutcome,
    OutcomeLabel,
    classify_outcome,
    final_band,
    final_band_label,
    outcome_score,
    revision_direction,
)
from app.services.guidance_flags import collect_audit_flags, suggest_audit_flags

client = TestClient(app)


def _row(**kw) -> GuidanceOutcome:
    base = dict(
        period="FY23",
        metric="revenue_growth_cc_pct",
        guided_value=14.0,
        guided_low=13.0,
        guided_high=15.0,
        actual_value=15.4,
        guided_text="t",
        thread_id="x-rev",
    )
    base.update(kw)
    return GuidanceOutcome(**base)


def test_revisions_do_not_change_headline_score():
    plain = _row()
    revised = _row(
        revisions=({"as_of": "2023-01-12", "guided_low": 16.0, "guided_high": 16.5},)
    )
    assert outcome_score(plain) == outcome_score(revised)
    assert classify_outcome(revised) == OutcomeLabel.EXCEEDED


def test_final_band_readout_and_direction():
    revised = _row(
        revisions=(
            {"as_of": "2022-07-24", "guided_low": 14.0, "guided_high": 16.0},
            {"as_of": "2023-01-12", "guided_low": 16.0, "guided_high": 16.5},
        )
    )
    assert final_band(revised) == (16.0, 16.5)
    assert final_band_label(revised) == OutcomeLabel.MISSED
    assert revision_direction(revised) == "raised"
    assert final_band_label(_row()) is None
    assert revision_direction(_row()) is None


def test_different_years_on_one_thread_are_not_a_definition_shift():
    rows = [
        _row(period="FY23", guided_low=13.0, guided_high=15.0, as_of="2023-04-13"),
        _row(period="FY24", guided_low=4.0, guided_high=7.0, actual_value=1.4, as_of="2024-04-18"),
    ]
    assert "definition_shift" not in suggest_audit_flags(rows)
    assert collect_audit_flags(rows) == []


def test_conflicting_rows_for_same_period_still_flag():
    rows = [
        _row(guided_low=13.0, guided_high=15.0, as_of="2022-04-13"),
        _row(guided_low=20.0, guided_high=21.0, as_of="2022-10-13"),
    ]
    assert "definition_shift" in suggest_audit_flags(rows)
    assert collect_audit_flags(rows) == []


def test_infosys_revisions_are_sourced_and_no_fake_withdrawal():
    outcomes = [o for o in get_outcomes("infy") if o.thread_id == "infy-rev-cc"]
    assert outcomes and not any(o.dropped for o in get_outcomes("infy"))
    for o in outcomes:
        assert len(o.revisions) == 3, o.period
        for r in o.revisions:
            assert r["source_url"].startswith("https://www.sec.gov/")
            assert r["quote"] and r["as_of"] > (o.guidance_as_of or "")
    assert collect_audit_flags(get_outcomes("infy")) == []


def test_api_exposes_final_band_outcome():
    body = client.get("/api/companies/infy/gci").json()
    fy23 = next(
        o for o in body["outcomes"] if o["period"] == "FY23" and o["thread_id"] == "infy-rev-cc"
    )
    assert fy23["label"] == "exceeded"
    assert fy23["final_label"] == "missed"
    assert fy23["final_guided_low"] == 16.0
    assert fy23["revision_direction"] == "raised"
    assert len(fy23["revisions"]) == 3
    assert body["audit_deduction"] == 0
