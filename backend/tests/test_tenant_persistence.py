"""Tenant data (orgs, queue, keys) survives a container restart when SQL auth is on."""

from fastapi.testclient import TestClient

from app.data import seed
from app.data.seed import get_data, reset_data, save_data
from app.main import app
from app.services import orgs
from app.services.session_auth import reset_auth_store

client = TestClient(app)


def setup_function() -> None:
    reset_auth_store()
    reset_data()


def _simulate_redeploy() -> None:
    """Fresh container: no store.json, empty in-memory caches; SQL (EFS) is all that remains."""
    seed._DATA = None
    seed._TENANT_SAVED.clear()
    if seed._PATH.exists():
        seed._PATH.unlink()


def _register_owner(email: str, account_type: str = "b2b") -> dict:
    body = {
        "email": email,
        "password": "secret99",
        "name": "Persist",
        "accept_terms": True,
        "account_type": account_type,
    }
    if account_type == "b2b":
        body["org_name"] = "Persist Desk"
    r = client.post("/api/auth/register", json=body)
    assert r.status_code == 200, r.text
    return r.json()


def _entitlements(token: str) -> dict:
    return client.get("/api/entitlements/me", headers={"Authorization": f"Bearer {token}"}).json()


def test_org_and_entitlements_survive_redeploy():
    owner = _register_owner("persist-owner@desk.test")
    before = _entitlements(owner["token"])
    assert before["plan"] == "pilot" and "desk" in before["features"]

    _simulate_redeploy()

    after = _entitlements(owner["token"])
    assert after["role"] == "owner"
    assert after["org_id"] == owner["user"]["org_id"]
    assert after["features"] == before["features"]
    assert "demo" in get_data()["orgs"]


def test_labeling_queue_and_org_api_key_survive_redeploy():
    owner = _register_owner("persist-queue@desk.test")
    headers = {"Authorization": f"Bearer {owner['token']}"}
    item = client.post(
        "/api/labeling/queue", headers=headers, json={"company_id": "infy", "note": "keep me"}
    ).json()["item"]
    key = client.post(f"/api/orgs/{owner['user']['org_id']}/api-keys", headers=headers).json()["api_key"]

    _simulate_redeploy()

    listed = client.get("/api/labeling/queue", headers=headers).json()
    assert [r["id"] for r in listed["items"]] == [item["id"]]
    assert client.get("/api/labeling/queue", headers={"X-API-Key": key}).status_code == 200
    seeded = {r["key"] for r in get_data()["api_keys"]}
    assert {"intellens-demo", "intellens-admin"} <= seeded


def test_restore_missing_orgs_recovers_orphaned_users():
    b2b = _register_owner("orphan-b2b@desk.test")
    retail = _register_owner("orphan-retail@desk.test", account_type="retail")
    data = get_data()
    for u in (b2b, retail):
        del data["orgs"][u["user"]["org_id"]]
    save_data()
    assert _entitlements(b2b["token"])["plan"] == "guest"

    restored = orgs.restore_missing_orgs()

    assert sorted([b2b["user"]["org_id"], retail["user"]["org_id"]]) == restored
    ent_b2b = _entitlements(b2b["token"])
    assert ent_b2b["plan"] == "pilot" and ent_b2b["role"] == "owner" and "desk" in ent_b2b["features"]
    assert _entitlements(retail["token"])["plan"] == "retail"
    assert orgs.restore_missing_orgs() == []


def test_reset_demo_requires_platform_ops():
    assert client.post("/api/admin/reset-demo", headers={"X-API-Key": "intellens-demo"}).status_code == 403
    assert client.post("/api/admin/reset-demo").status_code == 401
    assert client.post("/api/admin/reset-demo", headers={"X-API-Key": "intellens-admin"}).status_code == 200
