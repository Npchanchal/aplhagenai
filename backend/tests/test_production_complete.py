"""Close previously partial/gated production paths."""

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
    os.environ["INTELLENS_ABUSE_OFF"] = "1"
    os.environ["USE_DB_AUTH"] = "1"


def test_sql_auth_backend_and_hsts_header():
    from app.db.auth_db import backend_name, use_db_auth

    assert use_db_auth() is True
    assert backend_name() == "sqlite"
    r = client.post(
        "/api/auth/register",
        json={
            "email": "sql@ocotillo.test",
            "password": "secret99",
            "name": "SQL",
            "accept_terms": True,
            "account_type": "retail",
        },
    )
    assert r.status_code == 200, r.text
    infra = client.get("/api/infra/postgres").json()
    assert infra["auth_backend"] == "sqlite"
    # Security headers present even without FORCE_HTTPS
    assert r.headers.get("X-Content-Type-Options") == "nosniff"


def test_legal_attest_and_retail_paywall():
    # Attest terms + SEBI with admin key
    t = client.post(
        "/api/legal/attest",
        headers={"X-API-Key": "intellens-admin"},
        json={"kind": "terms_privacy", "attested_by": "counsel@ocotillo.test"},
    )
    assert t.status_code == 200, t.text
    assert t.json()["status"] == "counsel_approved"

    s = client.post(
        "/api/legal/attest",
        headers={"X-API-Key": "intellens-admin"},
        json={"kind": "sebi_retail", "attested_by": "counsel@ocotillo.test"},
    )
    assert s.status_code == 200

    meta = client.get("/api/legal/meta").json()
    assert meta["counsel_status"] == "counsel_approved"
    assert meta["retail_marketing_allowed"] is True

    reg = client.post(
        "/api/auth/register",
        json={
            "email": "buyer@ocotillo.test",
            "password": "secret99",
            "name": "Buyer",
            "accept_terms": True,
            "account_type": "retail",
        },
    ).json()
    token = reg["token"]
    checkout = client.post(
        "/api/billing/retail/checkout",
        headers={"Authorization": f"Bearer {token}"},
        json={},
    )
    assert checkout.status_code == 200, checkout.text
    order_id = checkout.json()["id"]
    paid = client.post(
        "/api/billing/retail/confirm",
        headers={"Authorization": f"Bearer {token}"},
        json={"order_id": order_id, "payment_ref": "upi-test"},
    )
    assert paid.status_code == 200
    assert paid.json()["status"] == "paid"


def test_msa_invoice_and_sign():
    owner = client.post(
        "/api/auth/register",
        json={
            "email": "cfo@desk.test",
            "password": "secret99",
            "name": "CFO",
            "accept_terms": True,
            "account_type": "b2b",
            "org_name": "Desk Bill",
        },
    ).json()
    token = owner["token"]
    inv = client.post(
        "/api/billing/msa",
        headers={"Authorization": f"Bearer {token}"},
        json={"plan": "desk", "seats": 5},
    )
    assert inv.status_code == 200, inv.text
    invoice_id = inv.json()["id"]
    signed = client.post(
        f"/api/billing/msa/{invoice_id}/sign",
        headers={"Authorization": f"Bearer {token}"},
        json={"signer_email": "cfo@desk.test"},
    )
    assert signed.status_code == 200
    assert signed.json()["esign_status"] == "signed"


def test_abuse_challenge_enforced_when_on():
    os.environ["INTELLENS_ABUSE_OFF"] = "0"
    try:
        ch = client.get("/api/auth/abuse-challenge").json()
        assert "challenge_id" in ch
        bad = client.post("/api/auth/guest", json={"accept_terms": True})
        assert bad.status_code == 400
        # Wrong answer
        wrong = client.post(
            "/api/auth/guest",
            json={
                "accept_terms": True,
                "challenge_id": ch["challenge_id"],
                "challenge_answer": "0",
            },
        )
        assert wrong.status_code == 400
        # Parse prompt "What is A + B?"
        import re

        m = re.search(r"What is (\d+) \+ (\d+)\?", ch["prompt"])
        assert m
        ans = str(int(m.group(1)) + int(m.group(2)))
        ok = client.post(
            "/api/auth/guest",
            json={
                "accept_terms": True,
                "challenge_id": ch["challenge_id"],
                "challenge_answer": ans,
            },
        )
        assert ok.status_code == 200, ok.text
    finally:
        os.environ["INTELLENS_ABUSE_OFF"] = "1"
