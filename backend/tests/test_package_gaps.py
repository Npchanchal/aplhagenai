"""Package claim gap closures P1–P3."""

from __future__ import annotations

import os

from fastapi.testclient import TestClient

from app.data.seed import reset_data
from app.main import app
from app.services.session_auth import reset_auth_store

client = TestClient(app)


def setup_function():
    reset_data()
    reset_auth_store()


def test_p11_wordmap_has_source():
    r = client.get("/api/companies/infy/wordmap")
    assert r.status_code == 200
    body = r.json()
    assert "entity" in body and "industry" in body
    assert body.get("source") in ("corpus", "seed_fallback")
    assert "citeable" in body


def test_p13_em_csv_export():
    r = client.get(
        "/api/export/em-factor/infy?format=csv",
        headers={"X-API-Key": "intellens-demo"},
    )
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")
    assert "india_gci" in r.text
    assert "gci_score" in r.text


def test_p14_facts_import_alias():
    r = client.post(
        "/api/import/facts",
        json={
            "merge_into_company": "infy",
            "facts": [
                {
                    "period": "FY24",
                    "metric": "revenue_growth_pct",
                    "guided_value": 10,
                    "actual_value": 11,
                    "guidance_change": "facts import",
                }
            ],
        },
        headers={"X-API-Key": "intellens-demo"},
    )
    assert r.status_code == 200
    assert r.json().get("merged", 0) >= 1
    assert r.json().get("import_kind") == "facts_json"


def test_p21_org_seats_and_entitlements():
    org = client.get("/api/orgs/demo", headers={"X-API-Key": "intellens-demo"})
    assert org.status_code == 200
    body = org.json()
    assert body["plan"] == "pilot"
    assert body["seats"] == 5
    assert "features" in body
    assert "seats_used" in body


def test_p21_seat_limit_on_register():
    # Fill pilot seats (5)
    for i in range(5):
        r = client.post(
            "/api/auth/register",
            json={
                "email": f"seat{i}@example.com",
                "password": "secret1",
                "name": f"Seat {i}",
            },
        )
        assert r.status_code == 200, r.text
    over = client.post(
        "/api/auth/register",
        json={"email": "overflow@example.com", "password": "secret1", "name": "Over"},
    )
    assert over.status_code == 403


def test_p22_rate_limit_header():
    r = client.get("/api/companies/infy/gci")
    assert r.status_code == 200
    assert "X-RateLimit-Limit" in r.headers


def test_p23_sso_status_and_config_required():
    os.environ["SSO"] = "true"
    try:
        # clear OIDC env
        for k in ("OIDC_CLIENT_ID", "OIDC_ISSUER", "OIDC_REDIRECT_URI"):
            os.environ.pop(k, None)
        st = client.get("/api/auth/sso/status").json()
        assert st["enabled"] is True
        assert st["configured"] is False
        login = client.get("/api/auth/sso/login").json()
        assert login["status"] == "config_required"
    finally:
        os.environ.pop("SSO", None)


def test_p24_labeling_queue():
    r = client.post(
        "/api/labeling/queue",
        json={"company_id": "infy", "priority": "high", "note": "test"},
        headers={"X-API-Key": "intellens-demo"},
    )
    assert r.status_code == 200
    assert r.json()["item"]["status"] == "queued"
    listed = client.get("/api/labeling/queue", headers={"X-API-Key": "intellens-demo"})
    assert listed.json()["count"] >= 1


def test_p32_estimates_no_silent_demo_street():
    os.environ.pop("ALLOW_DEMO_STREET", None)
    est = client.get("/api/research/estimates/infy").json()
    for row in est["estimates"]:
        if row.get("street_source") == "demo":
            # only allowed if flag on
            assert False, "silent demo street should be off by default"
        if row.get("street_source") == "unavailable":
            assert row.get("street_consensus") is None


def test_p12_changes_series_kind():
    ch = client.get("/api/companies/infy/changes").json()
    assert "series_kind" in ch
    assert "citeable" in ch


def test_hybrid_or_citeable_analytics_series():
    from app.services.pit_warehouse import analytics_series_for, _citeable_points

    cite = _citeable_points("infy")
    vals, pts = analytics_series_for("infy")
    assert len(vals) >= 12
    assert len(pts) == len(vals)
    kinds = {p.get("series_kind") for p in pts}
    if len(cite) >= 12:
        assert "citeable_pit" in kinds
    elif len(cite) >= 4:
        assert "hybrid_pit" in kinds or any(p.get("citeable") for p in pts)
    else:
        assert "demo_pit_extension" in kinds or pts[0].get("series_kind") == "demo_pit_extension"
