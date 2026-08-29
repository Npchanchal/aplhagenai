"""Pending depth work — LLM extract path, bootstrap, consensus upsert, SSO readiness."""

from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.data import consensus_store
from app.main import app
from app.services.extraction import extract_auto, extract_with_llm_prompt
from app.services.nifty_milestones import milestones_payload
from app.services.pending_depth import ensure_bootstrap, pending_depth_report
from app.services.sso import sso_status


client = TestClient(app)
HDR = {"X-API-Key": "intellens-demo"}


def test_llm_extract_fallback_without_key(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("INTELLENS_LLM_API_KEY", raising=False)
    monkeypatch.setenv("INTELLENS_LLM_EXTRACT", "1")
    text = "Revenue growth guidance of 8% to 10%. Operating margin around 21%."
    rows = extract_with_llm_prompt(text, company_id="infy", period="FY26")
    assert rows
    assert all(r.get("needs_review") for r in rows)
    assert any("heuristic" in str(r.get("extract_engine")) for r in rows)


def test_llm_extract_via_mock(monkeypatch):
    payload = [
        {
            "metric": "revenue_growth_pct",
            "guided_value": 9.0,
            "guided_low": 8.0,
            "guided_high": 10.0,
            "guided_text": "8-10%",
            "quote_span": "8% to 10%",
            "speaker": "CFO",
            "confidence": 0.8,
        }
    ]

    def fake_chat(messages, **kwargs):
        return json.dumps(payload)

    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    monkeypatch.setenv("INTELLENS_LLM_EXTRACT", "1")
    monkeypatch.setattr("app.services.llm_client.chat_completion", fake_chat)
    rows = extract_with_llm_prompt("ignored", company_id="infy", period="FY26")
    assert len(rows) == 1
    assert rows[0]["extract_engine"] == "llm_v1"
    assert rows[0]["needs_review"] is True


def test_extract_api_uses_auto():
    r = client.post(
        "/api/extract",
        headers=HDR,
        json={"company_id": "infy", "period": "FY26", "text": "Revenue growth of 5% to 7%."},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["needs_review"] is True
    assert "extract_engines" in body


def test_nifty_m2_bootstrap_enqueues():
    before = milestones_payload()
    assert before["counts"]["nifty_extra_count"] >= 1
    out = ensure_bootstrap(org_id="demo")
    assert out["nifty_enqueue"]["ok"] is True
    after = milestones_payload()
    m2 = next(m for m in after["milestones"] if m["id"] == "M2")
    assert m2["status"] == "done"
    assert after["counts"]["nifty_m2_covered"] >= after["counts"]["nifty_extra_count"]
    # P0 promotions may close M3/M4 when NIFTY_EXTRA cohort is fully hand_labeled
    m3 = next(m for m in after["milestones"] if m["id"] == "M3")
    assert m3["status"] in ("open", "done")


def test_ops_pending_depth_endpoints():
    r = client.post("/api/ops/pending-depth/bootstrap", headers=HDR)
    assert r.status_code == 200
    r2 = client.get("/api/ops/pending-depth", headers=HDR)
    assert r2.status_code == 200
    assert "steps" in r2.json()
    r3 = client.get("/api/ops/corpus-coverage", headers=HDR)
    assert r3.status_code == 200
    assert "hand_labeled_sensex" in r3.json()


def test_meta_includes_pending_depth():
    r = client.get("/api/meta")
    assert r.status_code == 200
    assert "pending_depth" in r.json()
    assert "feature_flags" in r.json()


def test_consensus_upsert():
    consensus_store.import_rows(
        [
            {
                "company_id": "infy",
                "period": "FY26",
                "metric": "revenue_growth_pct",
                "street_consensus": 9.5,
                "source": "test",
            }
        ]
    )
    n = consensus_store.import_rows(
        [
            {
                "company_id": "infy",
                "period": "FY26",
                "metric": "revenue_growth_pct",
                "street_consensus": 10.0,
                "source": "test",
            }
        ]
    )
    assert n == 1
    assert consensus_store.lookup("infy", "FY26", "revenue_growth_pct") == 10.0


def test_sso_status_checklist():
    st = sso_status()
    assert "checklist" in st
    assert "production_ready" in st


def test_extract_auto_heuristic_default(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("INTELLENS_LLM_API_KEY", raising=False)
    monkeypatch.delenv("INTELLENS_LLM_EXTRACT", raising=False)
    monkeypatch.delenv("RESEARCH_LLM", raising=False)
    rows = extract_auto("Revenue growth of 3% to 4%.", company_id="infy")
    assert rows
    assert rows[0]["extract_engine"] == "heuristic_v1"


def test_pending_depth_report_shape():
    rep = pending_depth_report(bootstrap=False)
    ids = {s["id"] for s in rep["steps"]}
    assert {"S1", "S2", "S3", "S4", "S5", "S9"} <= ids
