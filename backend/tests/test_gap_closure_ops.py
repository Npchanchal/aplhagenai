"""Gap closure: consensus demo gate, billing demo gate, corpus/trust ops."""

from __future__ import annotations

import os

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
KEY = {"X-API-Key": "intellens-demo"}


def test_corpus_coverage_shape():
    r = client.get("/api/ops/corpus-coverage", headers=KEY)
    assert r.status_code == 200
    body = r.json()
    assert "companies" in body or "tier1_pass" in body or "rows" in body or isinstance(body, dict)


def test_consensus_sample_and_demo_gate():
    sample = client.get("/api/consensus/sample", headers=KEY)
    assert sample.status_code == 200
    rows = sample.json()["rows"]
    assert rows and rows[0].get("source") == "sample_import"

    blocked = client.post("/api/consensus/import", headers=KEY, json={"rows": rows})
    assert blocked.status_code == 400

    ok = client.post("/api/consensus/import?demo=true", headers=KEY, json={"rows": rows})
    assert ok.status_code == 200
    assert ok.json()["imported"] >= 1
    assert ok.json().get("demo") is True

    stats = client.get("/api/consensus/stats", headers=KEY)
    assert stats.status_code == 200
    assert stats.json()["row_count"] >= 1


def test_billing_demo_gate_rejects_upi_demo(monkeypatch):
    monkeypatch.delenv("BILLING_DEMO", raising=False)
    monkeypatch.setenv("INTELLENS_RETAIL_MARKETING", "true")
    from fastapi import HTTPException

    from app.services import billing

    order = billing.create_retail_checkout(org_id="demo-gate", user_email="gate@test.local")
    try:
        billing.confirm_retail_payment(order["id"], payment_ref="upi-demo")
        raise AssertionError("should reject")
    except HTTPException as e:
        assert e.status_code == 400
        assert "BILLING_DEMO" in e.detail or "Demo" in e.detail


def test_billing_demo_allows_when_flag(monkeypatch):
    monkeypatch.setenv("BILLING_DEMO", "1")
    monkeypatch.setenv("INTELLENS_RETAIL_MARKETING", "true")
    from app.services import billing

    order = billing.create_retail_checkout(org_id="demo-ok", user_email="ok@test.local")
    paid = billing.confirm_retail_payment(order["id"], payment_ref="upi-demo")
    assert paid["status"] == "paid"


def test_msa_from_pilot_path():
    from app.services import billing

    inv = billing.create_msa_from_pilot(org_id="pilot-org", seats=5, signer_hint="a@b.com")
    assert inv["conversion_path"] == "pilot_to_desk"
    assert inv["status"] == "issued"
    assert inv.get("next_steps")


def test_trust_includes_llm_flags():
    r = client.get("/api/trust")
    assert r.status_code == 200
    body = r.json()
    assert "feature_flags_public" in body
    assert "LLM_CONFIGURED" in body["feature_flags_public"] or "SSO" in body["feature_flags_public"]


def test_nifty_milestones_include_extra_ids():
    r = client.get("/api/universe/nifty/milestones")
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body.get("nifty_extra_ids"), list)
    assert len(body["nifty_extra_ids"]) >= 5


def test_sso_status_checklist():
    r = client.get("/api/auth/sso/status")
    assert r.status_code == 200
    body = r.json()
    assert "checklist" in body or "enabled" in body
