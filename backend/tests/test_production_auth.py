"""Production auth: verify email, reset password, invites, revoke."""

import os

from fastapi.testclient import TestClient

from app.data.seed import reset_data
from app.main import app
from app.services.session_auth import reset_auth_store

client = TestClient(app)


def setup_function() -> None:
    reset_auth_store()
    reset_data()
    os.environ["INTELLENS_AUTH_DEV_TOKENS"] = "1"


def test_email_verify_and_password_reset():
    reg = client.post(
        "/api/auth/register",
        json={
            "email": "verify@ocotillo.test",
            "password": "secret99pass!",
            "name": "V",
            "accept_terms": True,
            "account_type": "b2b",
            "org_name": "Verify Desk",
        },
    ).json()
    assert reg["user"]["email_verified"] is False
    token = reg.get("verify_dev_token")
    assert token

    conf = client.post("/api/auth/verify-email/confirm", json={"token": token}).json()
    assert conf["user"]["email_verified"] is True

    req = client.post(
        "/api/auth/password-reset/request", json={"email": "verify@ocotillo.test"}
    ).json()
    assert req.get("dev_token")
    reset = client.post(
        "/api/auth/password-reset/confirm",
        json={"token": req["dev_token"], "password": "newsecret12!"},
    )
    assert reset.status_code == 200

    bad = client.post(
        "/api/auth/login",
        json={"email": "verify@ocotillo.test", "password": "secret99pass!"},
    )
    assert bad.status_code == 401
    ok = client.post(
        "/api/auth/login",
        json={"email": "verify@ocotillo.test", "password": "newsecret12!"},
    )
    assert ok.status_code == 200


def test_invite_revoke_and_api_key():
    owner = client.post(
        "/api/auth/register",
        json={
            "email": "owner@desk.test",
            "password": "secret99pass!",
            "name": "Owner",
            "accept_terms": True,
            "account_type": "b2b",
            "org_name": "Desk Alpha",
        },
    ).json()
    otoken = owner["token"]
    org_id = owner["user"]["org_id"]

    invite = client.post(
        f"/api/orgs/{org_id}/invites",
        headers={"Authorization": f"Bearer {otoken}"},
        json={"email": "analyst@desk.test"},
    ).json()
    assert invite.get("dev_token")

    joined = client.post(
        "/api/auth/accept-invite",
        json={
            "token": invite["dev_token"],
            "password": "secret99pass!",
            "name": "Analyst",
            "accept_terms": True,
        },
    ).json()
    assert joined["user"]["org_id"] == org_id
    member_id = joined["user"]["id"]

    members = client.get(
        f"/api/orgs/{org_id}/members",
        headers={"Authorization": f"Bearer {otoken}"},
    ).json()
    assert len(members["members"]) >= 2

    key = client.post(
        f"/api/orgs/{org_id}/api-keys",
        headers={"Authorization": f"Bearer {otoken}"},
    ).json()
    assert key["api_key"].startswith("il-")

    rev = client.post(
        f"/api/orgs/{org_id}/revoke",
        headers={"Authorization": f"Bearer {otoken}"},
        json={"user_id": member_id},
    )
    assert rev.status_code == 200

    blocked = client.post(
        "/api/auth/login",
        json={"email": "analyst@desk.test", "password": "secret99pass!"},
    )
    assert blocked.status_code == 403


def _register_owner(email: str, org_name: str) -> dict:
    return client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "secret99pass!",
            "name": org_name,
            "accept_terms": True,
            "account_type": "b2b",
            "org_name": org_name,
        },
    ).json()


def test_public_register_cannot_join_existing_org():
    owner = _register_owner("owner-join@desk.test", "Desk Join")
    r = client.post(
        "/api/auth/register",
        json={
            "email": "intruder@desk.test",
            "password": "secret99pass!",
            "name": "Intruder",
            "accept_terms": True,
            "account_type": "b2b",
            "org_id": owner["user"]["org_id"],
        },
    )
    assert r.status_code == 403
    for org in (owner["user"]["org_id"], "demo"):
        r = client.post(
            "/api/auth/register",
            json={
                "email": f"intruder-{org}@desk.test",
                "password": "secret99pass!",
                "name": "Intruder",
                "accept_terms": True,
                "org_id": org,
            },
        )
        assert r.status_code == 403


def test_labeling_queue_is_scoped_to_caller_org():
    a = _register_owner("owner-a@desk.test", "Desk A")
    b = _register_owner("owner-b@desk.test", "Desk B")
    ha = {"Authorization": f"Bearer {a['token']}"}
    hb = {"Authorization": f"Bearer {b['token']}"}

    item = client.post(
        "/api/labeling/queue", headers=ha, json={"company_id": "infy", "note": "A only"}
    ).json()["item"]
    assert item["org_id"] == a["user"]["org_id"]

    assert client.get("/api/labeling/queue", headers=hb).json()["count"] == 0
    peek = client.get(
        "/api/labeling/queue", headers=hb, params={"org_id": a["user"]["org_id"]}
    )
    assert peek.status_code == 403
    spoof = client.post(
        "/api/labeling/queue",
        headers=hb,
        json={"company_id": "infy", "org_id": a["user"]["org_id"]},
    )
    assert spoof.status_code == 403
    patch = client.patch(
        f"/api/labeling/queue/{item['id']}", headers=hb, json={"status": "cancelled"}
    )
    assert patch.status_code == 404

    own = client.get("/api/labeling/queue", headers=ha).json()
    assert [r["id"] for r in own["items"]] == [item["id"]]

    admin = client.get("/api/labeling/queue", headers={"X-API-Key": "intellens-admin"}).json()
    assert item["id"] in [r["id"] for r in admin["items"]]


def test_legal_counsel_and_infra_meta():
    os.environ.pop("INTELLENS_RETAIL_MARKETING", None)
    os.environ.pop("INTELLENS_LEGAL_COUNSEL_STATUS", None)
    legal = client.get("/api/legal/meta").json()
    assert legal["counsel_status"]
    assert legal["counsel_status"] != "counsel_approved"
    assert legal["retail_marketing_allowed"] is False
    meta = client.get("/api/meta").json()
    assert "postgres" in meta["infra"]
    assert client.get("/api/infra/postgres").status_code == 200


def test_password_min_twelve_and_session_ttl():
    short = client.post(
        "/api/auth/register",
        json={
            "email": "short@desk.test",
            "password": "secret99",
            "name": "S",
            "accept_terms": True,
            "account_type": "b2b",
            "org_name": "Short Desk",
        },
    )
    assert short.status_code == 400

    reg = client.post(
        "/api/auth/register",
        json={
            "email": "ttl@desk.test",
            "password": "secret99pass!",
            "name": "T",
            "accept_terms": True,
            "account_type": "b2b",
            "org_name": "TTL Desk",
        },
    )
    assert reg.status_code == 200
    token = reg.json()["token"]
    from app.services import session_auth as sa

    store = sa._load_sessions()
    store["sessions"][token]["last_seen_at"] = "2000-01-01T00:00:00+00:00"
    sa._save_sessions()
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 401

    login = client.post(
        "/api/auth/login",
        json={"email": "ttl@desk.test", "password": "secret99pass!"},
    )
    assert login.status_code == 200
    from app.data.audit_log import list_by_action

    assert list_by_action("auth_login")
    r = client.post("/api/auth/guest", json={"accept_terms": True})
    assert r.status_code == 200
    assert r.headers.get("X-RateLimit-Bucket") == "auth"


def test_owner_mfa_enroll_and_login():
    from app.services import totp as totp_svc

    reg = client.post(
        "/api/auth/register",
        json={
            "email": "mfa@desk.test",
            "password": "secret99pass!",
            "name": "Mfa Owner",
            "accept_terms": True,
            "account_type": "b2b",
            "org_name": "MFA Desk",
        },
    )
    assert reg.status_code == 200
    token = reg.json()["token"]
    assert reg.json()["user"]["role"] == "owner"
    start = client.post("/api/auth/mfa/enroll", headers={"Authorization": f"Bearer {token}"})
    assert start.status_code == 200
    secret = start.json()["secret"]
    code = totp_svc.totp_at(secret)
    conf = client.post(
        "/api/auth/mfa/confirm",
        headers={"Authorization": f"Bearer {token}"},
        json={"code": code},
    )
    assert conf.status_code == 200
    assert conf.json()["mfa_enabled"] is True

    blocked = client.post(
        "/api/auth/login",
        json={"email": "mfa@desk.test", "password": "secret99pass!"},
    )
    assert blocked.status_code == 403
    assert blocked.json()["detail"] == "mfa_required"

    ok = client.post(
        "/api/auth/login",
        json={
            "email": "mfa@desk.test",
            "password": "secret99pass!",
            "totp_code": totp_svc.totp_at(secret),
        },
    )
    assert ok.status_code == 200
    assert ok.json()["user"]["mfa_enabled"] is True
