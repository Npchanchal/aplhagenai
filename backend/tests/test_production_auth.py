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
            "password": "secret99",
            "name": "V",
            "accept_terms": True,
            "account_type": "retail",
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
        json={"token": req["dev_token"], "password": "newsecret1"},
    )
    assert reset.status_code == 200

    bad = client.post(
        "/api/auth/login",
        json={"email": "verify@ocotillo.test", "password": "secret99"},
    )
    assert bad.status_code == 401
    ok = client.post(
        "/api/auth/login",
        json={"email": "verify@ocotillo.test", "password": "newsecret1"},
    )
    assert ok.status_code == 200


def test_invite_revoke_and_api_key():
    owner = client.post(
        "/api/auth/register",
        json={
            "email": "owner@desk.test",
            "password": "secret99",
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
            "password": "secret99",
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
        json={"email": "analyst@desk.test", "password": "secret99"},
    )
    assert blocked.status_code == 403


def test_legal_counsel_and_infra_meta():
    legal = client.get("/api/legal/meta").json()
    assert legal["counsel_status"]
    assert "retail_marketing_allowed" in legal
    meta = client.get("/api/meta").json()
    assert "postgres" in meta["infra"]
    assert client.get("/api/infra/postgres").status_code == 200


def test_auth_rate_limit_header_bucket():
    r = client.post("/api/auth/guest", json={"accept_terms": True})
    assert r.status_code == 200
    assert r.headers.get("X-RateLimit-Bucket") == "auth"
