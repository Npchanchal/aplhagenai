"""Platform admin portal — role-based access."""

from fastapi.testclient import TestClient

from app.data.seed import reset_data
from app.main import app
from app.services import session_auth

client = TestClient(app)
ADMIN = {"X-API-Key": "intellens-admin"}


def setup_function() -> None:
    reset_data()
    session_auth.reset_auth_store()


def _register(email: str, *, org_name: str = "Ops Desk") -> dict:
    return client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": "secret99",
            "name": "Admin User",
            "accept_terms": True,
            "account_type": "b2b",
            "org_name": org_name,
        },
    ).json()


def _grant_platform_role(actor_headers: dict, user_id: str, role: str) -> None:
    r = client.patch(
        f"/api/admin/portal/users/{user_id}/platform-role",
        headers=actor_headers,
        json={"platform_admin_role": role},
    )
    assert r.status_code == 200, r.text


def test_admin_portal_requires_platform_role():
    user = _register("noadmin@desk.test")
    token = user["token"]
    r = client.get("/api/admin/portal/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


def test_super_admin_api_key_has_full_portal():
    r = client.get("/api/admin/portal/me", headers=ADMIN)
    assert r.status_code == 200
    body = r.json()
    assert body["platform_admin_role"] == "super"
    assert "users.write" in body["permissions"]
    assert any(s["id"] == "system" for s in body["sections"])


def test_compliance_role_cannot_list_users():
    super_user = _register("super@ocotillo.test")
    _grant_platform_role(ADMIN, super_user["user"]["id"], "super")
    super_token = super_user["token"]

    compliance = _register("compliance@ocotillo.test")
    _grant_platform_role({"Authorization": f"Bearer {super_token}"}, compliance["user"]["id"], "compliance")
    ctoken = compliance["token"]

    me = client.get("/api/admin/portal/me", headers={"Authorization": f"Bearer {ctoken}"})
    assert me.status_code == 200
    assert me.json()["platform_admin_role"] == "compliance"
    assert "legal.read" in me.json()["permissions"]
    assert "users.read" not in me.json()["permissions"]

    users = client.get("/api/admin/portal/users", headers={"Authorization": f"Bearer {ctoken}"})
    assert users.status_code == 403


def test_ops_role_can_list_orgs_not_legal_write():
    super_user = _register("super2@ocotillo.test")
    _grant_platform_role(ADMIN, super_user["user"]["id"], "super")

    ops = _register("ops@ocotillo.test")
    _grant_platform_role(ADMIN, ops["user"]["id"], "ops")
    otoken = ops["token"]

    orgs = client.get("/api/admin/portal/orgs", headers={"Authorization": f"Bearer {otoken}"})
    assert orgs.status_code == 200
    assert len(orgs.json()["orgs"]) >= 1

    attest = client.post(
        "/api/admin/portal/legal/attest",
        headers={"Authorization": f"Bearer {otoken}"},
        json={"kind": "terms_privacy", "attested_by": "ops@ocotillo.test"},
    )
    assert attest.status_code == 403


def test_super_assigns_support_role():
    super_user = _register("super3@ocotillo.test")
    _grant_platform_role(ADMIN, super_user["user"]["id"], "super")
    super_token = super_user["token"]

    support = _register("support@ocotillo.test")
    assign = client.patch(
        f"/api/admin/portal/users/{support['user']['id']}/platform-role",
        headers={"Authorization": f"Bearer {super_token}"},
        json={"platform_admin_role": "support"},
    )
    assert assign.status_code == 200
    assert assign.json()["platform_admin_role"] == "support"

    stoken = support["token"]
    audit = client.get("/api/admin/portal/audit", headers={"Authorization": f"Bearer {stoken}"})
    assert audit.status_code == 200

    pilot = client.post(
        "/api/admin/portal/pilot",
        headers={"Authorization": f"Bearer {stoken}"},
        json={"name": "Should Fail"},
    )
    assert pilot.status_code == 403
