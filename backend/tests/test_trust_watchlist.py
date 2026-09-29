"""Trust Center + editable watchlist prefs."""

import json

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_trust_center_payload():
    r = client.get("/api/trust")
    assert r.status_code == 200
    body = r.json()
    assert body["product"] == "CiteAlpha"
    assert "Ocotillo" in body["legal_entity"]
    assert body["data"]["invent_actuals"] is False
    assert body["citations"]["endpoints"]
    assert "posture" in body["compliance"]
    assert "sso" in body
    assert "security" in body
    assert body["residency"]["region"] == "ap-south-1"
    assert "counsel_status" not in body["compliance"]
    assert "counsel_status" not in (body.get("copyright") or {})
    assert body["compliance"]["contact_email"] == "sales@citealpha.com"
    assert any(p["name"] == "Amazon Web Services" for p in body["subprocessors"])
    assert "DPA" in body["incident"]["note"] or "dpa" in body["incident"]["note"].lower()
    assert "llm" in body
    assert body["labeling_governance"]["two_person_review"] is True
    assert "googletagmanager" in (body["security"].get("csp") or "")
    assert "googletagmanager.com" in (r.headers.get("content-security-policy") or "")


def test_public_trust_strips_internal_keys():
    """W8.2: public Trust JSON must not leak counsel, env flags, or SSO readiness."""
    blob = json.dumps(client.get("/api/trust").json())
    assert "counsel_" not in blob
    assert "INTELLENS_" not in blob
    assert "production_ready" not in blob
    assert "ops-dependent" not in blob


def test_watchlist_ids_query():
    r = client.get("/api/research/watchlist", params={"ids": "infy,tcs"})
    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "preferences"
    assert [x["company_id"] for x in body["items"]] == ["infy", "tcs"]


def test_watchlist_from_preferences():
    guest = client.post("/api/auth/guest", json={"accept_terms": True}).json()
    token = guest["token"]
    prefs = client.put(
        "/api/auth/preferences",
        headers={"Authorization": f"Bearer {token}"},
        json={"watchlist": ["infy"]},
    ).json()["preferences"]
    assert prefs["watchlist"] == ["infy"]
    r = client.get(
        "/api/research/watchlist",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "preferences"
    assert [x["company_id"] for x in body["items"]] == ["infy"]
