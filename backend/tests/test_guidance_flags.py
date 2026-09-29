"""Audit flags, revision timeline, and enriched red alerts."""

from app.data.seed import reset_data
from app.services.guidance_flags import (
    audit_summary,
    collect_audit_flags,
    revision_timeline,
)
from app.services.gci_scoring import GuidanceOutcome
from app.services.repository import get_company_gci, list_alerts


def setup_function():
    reset_data()


def teardown_module():
    reset_data()


def test_dropped_outcome_suggests_withdrawal_without_deduction():
    from app.services.guidance_flags import suggest_audit_flags

    outs = [
        GuidanceOutcome(
            period="FY25",
            metric="revenue_growth_pct",
            guided_value=10.0,
            actual_value=None,
            guided_text="withdrawn",
            dropped=True,
            as_of="2025-01-01",
        )
    ]
    assert "guidance_withdrawal" in suggest_audit_flags(outs)
    assert collect_audit_flags(outs) == []
    summary = audit_summary(outs)
    assert summary["deduction"] == 0.0
    assert summary["badges"] == []


def test_restatement_text_sets_flag():
    outs = [
        GuidanceOutcome(
            period="FY24",
            metric="revenue_growth_pct",
            guided_value=12.0,
            actual_value=11.0,
            guided_text="After restatement of FY24 results",
            source_ref="restatement-note",
            as_of="2024-06-01",
        )
    ]
    from app.services.guidance_flags import suggest_audit_flags

    assert "restatement" in suggest_audit_flags(outs)
    assert collect_audit_flags(outs) == []


def test_revision_timeline_ordered():
    outs = [
        GuidanceOutcome(
            period="FY25",
            metric="revenue_growth_pct",
            guided_value=10.0,
            guided_low=9.0,
            guided_high=11.0,
            actual_value=None,
            guided_text="initial",
            thread_id="t1",
            as_of="2024-06-01",
        ),
        GuidanceOutcome(
            period="FY25",
            metric="revenue_growth_pct",
            guided_value=14.0,
            guided_low=13.0,
            guided_high=15.0,
            actual_value=14.5,
            guided_text="raised",
            thread_id="t1",
            as_of="2024-11-01",
        ),
    ]
    events = revision_timeline(outs, company_id="x", ticker="X")
    assert len(events) >= 2
    assert events[0]["kind"] == "stated"
    assert events[1]["kind"] in ("revised_up", "resolved_exceeded", "resolved_met")


def test_company_gci_includes_audit_and_timeline():
    detail = get_company_gci("asianpaints")
    assert hasattr(detail, "audit_flags")
    assert hasattr(detail, "revision_timeline")
    assert isinstance(detail.revision_timeline, list)
    # asianpaints: no analyst-set flags in seed
    assert detail.audit_deduction == 0
    assert detail.audit_flags == []


def test_alerts_include_dropped_row_not_heuristic_withdrawal():
    from app.services.repository import merge_matched

    merge_matched(
        "asianpaints",
        [
            {
                "period": "FY99",
                "metric": "revenue_growth_pct",
                "guided_value": 10.0,
                "guided_text": "withdrawn",
                "dropped": True,
                "actual_value": None,
                "as_of": "2025-01-01",
            }
        ],
    )
    kinds = {a.kind for a in list_alerts()}
    assert "guidance_dropped" in kinds
    assert "guidance_withdrawal" not in kinds
