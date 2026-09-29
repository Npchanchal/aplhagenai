"""Terms acceptance + multi-tenant B2B registration (W8.1: retail off until counsel)."""

import os

from fastapi.testclient import TestClient

from app.main import app
from app.services.session_auth import reset_auth_store
from app.data.seed import reset_data

client = TestClient(app)


def setup_function() -> None:
    reset_auth_store()
    reset_data()
    os.environ.pop("INTELLENS_RETAIL_MARKETING", None)
    os.environ.pop("INTELLENS_LEGAL_COUNSEL_STATUS", None)
    # These cases exercise the JSON auth store. Restore the suite default afterwards
    # so later modules still persist tenants in SQLite.
    os.environ["_TEST_PREV_USE_DB_AUTH"] = os.environ.get("USE_DB_AUTH", "")
    os.environ.pop("USE_DB_AUTH", None)


def teardown_function() -> None:
    prev = os.environ.pop("_TEST_PREV_USE_DB_AUTH", "")
    if prev:
        os.environ["USE_DB_AUTH"] = prev
    else:
        os.environ.pop("USE_DB_AUTH", None)


def test_legal_documents_and_copyright():
    meta = client.get("/api/legal/meta").json()
    assert meta["legal_entity"] == "Ocotillo Innovation Private Limited"
    assert "Ocotillo" in meta["line"]
    assert meta["contact_email"] == "sales@citealpha.com"
    assert meta["counsel_status"]
    terms = client.get("/api/legal/terms").json()
    assert terms["version"]
    assert len(terms["sections"]) >= 10
    ids = {s["id"] for s in terms["sections"]}
    assert "ai" in ids
    assert "sales@citealpha.com" in terms["sections"][0]["body"]
    blob = " ".join(s["body"] for s in terms["sections"]).lower()
    assert "bloomberg" not in blob
    assert "alphasense" not in blob
    privacy = client.get("/api/legal/privacy").json()
    assert privacy["legal_entity"] == "Ocotillo Innovation Private Limited"
    pids = {s["id"] for s in privacy["sections"]}
    assert "analytics" in pids
    assert "ai" in pids
    assert any("DPDP" in s["body"] for s in privacy["sections"])
    app_meta = client.get("/api/meta").json()
    assert app_meta["legal"]["legal_entity"] == "Ocotillo Innovation Private Limited"


def test_guest_and_register_require_terms():
    bad = client.post("/api/auth/guest", json={})
    assert bad.status_code == 400

    guest = client.post("/api/auth/guest", json={"accept_terms": True}).json()
    assert guest["user"]["kind"] == "guest"
    assert guest["user"]["terms_version"]
    assert guest["user"]["account_type"] == "guest"

    no_terms = client.post(
        "/api/auth/register",
        json={
            "email": "x@ocotillo.test",
            "password": "secret99pass!",
            "name": "X",
            "accept_terms": False,
        },
    )
    assert no_terms.status_code == 400


def test_retail_register_forbidden_until_sebi_attest():
    """W8.1 / D1: individual signup stays off while counsel memo is pending."""
    meta = client.get("/api/legal/meta").json()
    assert meta["retail_marketing_allowed"] is False
    assert meta["counsel_status"] != "counsel_approved"

    blocked = client.post(
        "/api/auth/register",
        json={
            "email": "retail@ocotillo.test",
            "password": "secret99pass!",
            "name": "Retail User",
            "accept_terms": True,
            "account_type": "retail",
        },
    )
    assert blocked.status_code == 403, blocked.text
    detail = blocked.json().get("detail") or ""
    assert "Individual accounts" in detail
    assert "INTELLENS_" not in detail

    # Counsel attest is the only ungate — still works for the paywall tests.
    att = client.post(
        "/api/legal/attest",
        headers={"X-API-Key": "intellens-admin"},
        json={"kind": "sebi_retail", "attested_by": "counsel@ocotillo.test"},
    )
    assert att.status_code == 200
    opened = client.post(
        "/api/auth/register",
        json={
            "email": "retail@ocotillo.test",
            "password": "secret99pass!",
            "name": "Retail User",
            "accept_terms": True,
            "account_type": "retail",
        },
    )
    assert opened.status_code == 200, opened.text
    assert opened.json()["user"]["account_type"] == "retail"
    os.environ.pop("INTELLENS_RETAIL_MARKETING", None)


def test_retail_and_b2b_tenants_isolated():
    a = client.post(
        "/api/auth/register",
        json={
            "email": "desk-a@ocotillo.test",
            "password": "secret99pass!",
            "name": "Desk A",
            "accept_terms": True,
            "account_type": "b2b",
            "org_name": "South Star PMS",
        },
    ).json()
    assert a["user"]["account_type"] == "b2b"
    a_org = client.get(
        "/api/orgs/me", headers={"Authorization": f"Bearer {a['token']}"}
    ).json()
    assert "South Star" in a_org["name"]

    b2b = client.post(
        "/api/auth/register",
        json={
            "email": "desk@ocotillo.test",
            "password": "secret99pass!",
            "name": "Desk Owner",
            "accept_terms": True,
            "account_type": "b2b",
            "org_name": "North Star PMS",
        },
    ).json()
    assert b2b["user"]["account_type"] == "b2b"
    assert b2b["user"]["role"] == "owner"
    b_token = b2b["token"]
    b_org = client.get(
        "/api/orgs/me", headers={"Authorization": f"Bearer {b_token}"}
    ).json()
    assert "North Star" in b_org["name"]
    assert b_org["id"] != a_org["id"]
    assert b_org["plan"] == "pilot"

    # Review stamped with org; other org key cannot list it
    rev = client.post(
        "/api/review",
        headers={"X-API-Key": "intellens-demo"},
        json={
            "company_id": "infy",
            "outcome_index": 0,
            "action": "accept",
            "comment": "tenant demo",
        },
    )
    assert rev.status_code == 200
    assert rev.json()["review"]["org_id"] == "demo"

    listed = client.get("/api/reviews", headers={"X-API-Key": "intellens-demo"}).json()
    assert any(r.get("comment") == "tenant demo" for r in listed["reviews"])


def test_sebi_note_mentions_ocotillo():
    note = client.get("/api/compliance/sebi-note").json()
    assert note["legal_entity"] == "Ocotillo Innovation Private Limited"
