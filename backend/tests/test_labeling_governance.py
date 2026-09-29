"""W2.5 — labeling governance: reviewer stamps and label_accept audit rows."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.data.seed import reset_data
from app.main import app

client = TestClient(app)


def setup_function():
    reset_data()


def test_trust_labeling_governance_counts_accepts():
    gov = client.get("/api/trust").json()["labeling_governance"]
    assert gov["two_person_review"] is True
    assert gov["accepted"] > 0
    assert any(r.get("reviewer_id") for r in (gov.get("recent") or []))
    note = gov["note"]
    assert "one analyst" in note
    assert "single-analyst review" in note
    assert "hand_labeled" not in note


def test_scored_rows_carry_reviewer_and_dossier_stamp():
    d = client.get("/api/companies/infy/gci").json()
    assert d["gci_score"] == 76.5
    assert d["reviewed_at"] == "2026-09-29"
    scored = [o for o in d["outcomes"] if o.get("contribution_score") is not None]
    assert scored
    for o in scored:
        assert o["reviewed_by"]
        assert o["reviewed_at"]


def test_accept_draft_writes_label_accept(tmp_path, monkeypatch):
    from app.data import audit_log

    monkeypatch.setattr(audit_log, "_PATH", tmp_path / "audit.json")
    monkeypatch.setattr(audit_log, "_LOG", [])

    headers_l = {"X-API-Key": "intellens-onestop-labeler"}
    headers_a = {"X-API-Key": "intellens-onestop"}
    created = client.post(
        "/api/labeling/drafts",
        json={
            "company_id": "infy",
            "period": "FY99",
            "metric": "revenue_growth_pct",
            "guided_low": 8,
            "guided_high": 12,
            "guided_value": 10,
            "actual_value": 10,
            "guided_text": "Test label accept trail",
            "quote_span": "we expect high single-digit revenue growth",
            "source_url": "https://www.infosys.com/investors/reports-filings/example.html",
            "source_ref": "INFY-TEST-PR",
            "as_of": "2026-09-01",
        },
        headers=headers_l,
    )
    assert created.status_code == 200
    did = created.json()["draft"]["id"]
    assert client.post(f"/api/labeling/drafts/{did}/submit", headers=headers_l).status_code == 200
    acc = client.post(f"/api/labeling/drafts/{did}/accept", headers=headers_a)
    assert acc.status_code == 200
    assert acc.json()["draft"]["status"] == "accepted"
    assert acc.json()["draft"]["reviewer_id"]
    matches = [
        r
        for r in audit_log.list_by_action("label_accept")
        if (r.get("detail") or {}).get("draft_id") == did
        or str((r.get("detail") or {}).get("draft_id") or "").startswith(did)
    ]
    assert matches
    detail = matches[-1]["detail"]
    assert detail["submitter_id"]
    assert detail["reviewer_id"]
    assert detail["submitter_id"] != detail["reviewer_id"]
    assert detail["company_id"] == "infy"


def test_heuristic_does_not_apply_flag_without_set_by():
    from app.data.seed import get_outcomes
    from app.services.gci_scoring import audit_deduction
    from app.services.guidance_flags import (
        applied_audit_flags,
        audited_company_gci,
        suggest_audit_flags,
    )
    from app.services.labeling_queue import enqueue_flag_suggestions, list_queue
    from app.services.repository import merge_matched

    assert applied_audit_flags("asianpaints") == []
    merge_matched(
        "asianpaints",
        [
            {
                "period": "FY99",
                "metric": "revenue_growth_pct",
                "guided_value": 10.0,
                "guided_low": 9.0,
                "guided_high": 11.0,
                "guided_text": "Withdrawn after restatement of FY99 results",
                "dropped": True,
                "actual_value": None,
                "as_of": "2025-01-01",
                "source_url": "https://www.bseindia.com/example.htm",
                "quote_span": "we withdraw guidance after restatement",
            }
        ],
    )
    outs = get_outcomes("asianpaints")
    suggested = suggest_audit_flags(outs)
    assert "guidance_withdrawal" in suggested
    assert "restatement" in suggested
    assert applied_audit_flags("asianpaints") == []
    assert audit_deduction(outs) == 0.0
    assert audited_company_gci(outs, company_id="asianpaints") is None
    queued = [
        i
        for i in list_queue()
        if i.get("kind") == "audit_flag_suggestion" and i.get("company_id") == "asianpaints"
    ]
    assert {i["flag"] for i in queued} == set(suggested)
    assert enqueue_flag_suggestions("asianpaints") == []

    before = client.get("/api/companies/infy/gci").json()["gci_score"]
    assert before == 76.5
    denied = client.post(
        "/api/companies/infy/audit-flags",
        json={"flag": "definition_shift", "source_url": "https://www.sec.gov/example.htm"},
    )
    assert denied.status_code in (401, 403)
    missing_source = client.post(
        "/api/companies/infy/audit-flags",
        json={"flag": "definition_shift"},
        headers={"X-API-Key": "intellens-onestop"},
    )
    assert missing_source.status_code == 400
    applied = client.post(
        "/api/companies/infy/audit-flags",
        json={
            "flag": "definition_shift",
            "source_url": "https://www.sec.gov/Archives/edgar/data/1067491/example.htm",
            "note": "W2.6 test",
        },
        headers={"X-API-Key": "intellens-onestop"},
    )
    assert applied.status_code == 200
    rec = applied.json()["flag"]
    assert rec["set_by"]
    assert rec["source_url"]
    after = client.get("/api/companies/infy/gci").json()
    assert after["gci_score"] == 66.5
    assert after["audit_flags"] == ["definition_shift"]
    assert after["audit_badges"][0]["set_by"]
    cleared = client.delete(
        "/api/companies/infy/audit-flags/definition_shift",
        headers={"X-API-Key": "intellens-onestop"},
    )
    assert cleared.status_code == 200
    restored = client.get("/api/companies/infy/gci").json()
    assert restored["gci_score"] == 76.5
    assert restored["audit_flags"] == []
