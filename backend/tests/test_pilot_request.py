"""Public pilot request intake + admin review."""

import os
import re

from fastapi.testclient import TestClient

from app.data.seed import reset_data
from app.main import app

client = TestClient(app)
ADMIN = {"X-API-Key": "intellens-admin"}


def setup_function() -> None:
    reset_data()


def _challenge_answer(ch: dict) -> str:
    m = re.search(r"What is (\d+) \+ (\d+)\?", ch["prompt"])
    assert m
    return str(int(m.group(1)) + int(m.group(2)))


def _submit_pilot_request(**overrides):
    ch = client.get("/api/auth/abuse-challenge").json()
    payload = {
        "name": "Analyst One",
        "email": "analyst@desk.test",
        "firm": "Example Capital",
        "role": "Head of Research",
        "team_size": "6–15",
        "message": "Sensex coverage pilot",
        "challenge_id": ch["challenge_id"],
        "challenge_answer": _challenge_answer(ch),
        **overrides,
    }
    return client.post("/api/pilot-request", json=payload)


def test_pilot_request_stored_as_pending():
    res = _submit_pilot_request()
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["ok"] is True
    assert body["status"] == "pending"
    assert body["request_id"].startswith("pr_")


def test_admin_lists_and_approves_pilot_request():
    created = _submit_pilot_request().json()
    request_id = created["request_id"]

    listed = client.get("/api/admin/portal/pilot-requests", headers=ADMIN)
    assert listed.status_code == 200
    items = listed.json()["items"]
    assert any(i["id"] == request_id and i["status"] == "pending" for i in items)

    approved = client.patch(
        f"/api/admin/portal/pilot-requests/{request_id}",
        headers=ADMIN,
        json={"action": "approve"},
    )
    assert approved.status_code == 200, approved.text
    row = approved.json()["request"]
    assert row["status"] == "approved"
    assert row["org_id"]
    assert approved.json()["provisioned"]["org"]["id"] == row["org_id"]


def test_admin_rejects_pilot_request():
    created = _submit_pilot_request(email="reject@desk.test").json()
    request_id = created["request_id"]

    rejected = client.patch(
        f"/api/admin/portal/pilot-requests/{request_id}",
        headers=ADMIN,
        json={"action": "reject", "note": "Out of scope"},
    )
    assert rejected.status_code == 200
    row = rejected.json()["request"]
    assert row["status"] == "rejected"
    assert row["admin_note"] == "Out of scope"
    assert not row.get("org_id")


def test_pilot_request_requires_abuse_challenge_when_on():
    os.environ["INTELLENS_ABUSE_OFF"] = "0"
    try:
        bad = client.post(
            "/api/pilot-request",
            json={
                "name": "A",
                "email": "a@b.com",
                "firm": "Firm",
            },
        )
        assert bad.status_code == 400
    finally:
        os.environ["INTELLENS_ABUSE_OFF"] = "1"
