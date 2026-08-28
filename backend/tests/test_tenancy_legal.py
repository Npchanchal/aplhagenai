"""Terms acceptance + multi-tenant B2B/retail registration."""

from fastapi.testclient import TestClient

from app.main import app
from app.services.session_auth import reset_auth_store
from app.data.seed import reset_data

client = TestClient(app)


def setup_function() -> None:
    reset_auth_store()
    reset_data()


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
            "password": "secret99",
            "name": "X",
            "accept_terms": False,
        },
    )
    assert no_terms.status_code == 400


def test_retail_and_b2b_tenants_isolated():
    retail = client.post(
        "/api/auth/register",
        json={
            "email": "retail@ocotillo.test",
            "password": "secret99",
            "name": "Retail User",
            "accept_terms": True,
            "account_type": "retail",
        },
    ).json()
    assert retail["user"]["account_type"] == "retail"
    assert retail["user"]["org_id"]
    r_token = retail["token"]
    r_org = client.get(
        "/api/orgs/me", headers={"Authorization": f"Bearer {r_token}"}
    ).json()
    assert r_org["plan"] == "retail"
    assert r_org["account_type"] == "retail"

    b2b = client.post(
        "/api/auth/register",
        json={
            "email": "desk@ocotillo.test",
            "password": "secret99",
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
    assert b_org["id"] != r_org["id"]
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
