"""Production OIDC, live AlphaHunter, Nifty milestones, CSM/SLA/VPC."""

from __future__ import annotations

import os
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.data.seed import reset_data
from app.main import app
from app.services.session_auth import reset_auth_store

client = TestClient(app)


def setup_function():
    reset_data()
    reset_auth_store()
    for k in (
        "SSO",
        "OIDC_CLIENT_ID",
        "OIDC_CLIENT_SECRET",
        "OIDC_ISSUER",
        "OIDC_REDIRECT_URI",
        "OIDC_DEMO_ASSERT",
        "ALPHAHUNTER_API_URL",
        "ALPHAHUNTER_API_KEY",
    ):
        os.environ.pop(k, None)


def test_sso_disabled_by_default():
    r = client.get("/api/auth/sso/status")
    assert r.status_code == 200
    assert r.json()["enabled"] is False


def test_sso_config_required_when_enabled_without_oidc():
    os.environ["SSO"] = "true"
    r = client.get("/api/auth/sso/login")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "config_required"
    assert body["authorize_url"] is None


def test_sso_demo_assert_session():
    os.environ["SSO"] = "true"
    os.environ["OIDC_DEMO_ASSERT"] = "true"
    r = client.get(
        "/api/auth/sso/callback",
        params={"email": "oidc.user@example.com", "name": "OIDC", "format": "json"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body.get("token")
    assert body["user"]["email"] == "oidc.user@example.com"
    assert body.get("via") == "oidc_demo"


def test_alphahunter_status_unconfigured():
    r = client.get("/api/import/alphahunter/status")
    assert r.status_code == 200
    assert r.json()["configured"] is False


def test_alphahunter_live_pull_and_merge():
    os.environ["ALPHAHUNTER_API_URL"] = "https://vendor.example/facts"

    def _fake_pull(*, company_id=None):
        return {
            "ok": True,
            "source": "live_connector",
            "url_host": "vendor.example",
            "fact_count": 1,
            "facts": [
                {
                    "period": "FY24",
                    "metric": "revenue_growth_pct",
                    "guided_value": 9,
                    "actual_value": 9.5,
                    "guidance_change": "live pull",
                }
            ],
        }

    with patch("app.services.alphahunter_live.pull_facts", side_effect=_fake_pull):
        r = client.post(
            "/api/import/alphahunter/live?company_id=infy&merge=true",
            headers={"X-API-Key": "intellens-demo"},
        )
    assert r.status_code == 200
    body = r.json()
    assert body.get("merged", 0) >= 1
    assert body.get("source") == "live_connector"


def test_nifty_milestones_honest():
    r = client.get("/api/universe/nifty/milestones")
    assert r.status_code == 200
    body = r.json()
    assert body["day1_claim"] is False
    assert len(body["milestones"]) >= 4
    assert body["counts"]["nifty_hand_labeled"] == 0 or isinstance(
        body["counts"]["nifty_hand_labeled"], int
    )


def test_nifty_enqueue_labeling():
    r = client.post(
        "/api/universe/nifty/enqueue-labeling",
        headers={"X-API-Key": "intellens-demo"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert body["enqueued"] >= 0
    m2 = next(m for m in body["milestones"]["milestones"] if m["id"] == "M2")
    assert m2["status"] == "done"


def test_csm_sla_vpc():
    headers = {"X-API-Key": "intellens-demo"}
    csm = client.get("/api/csm/demo", headers=headers)
    assert csm.status_code == 200
    body = csm.json()
    assert "sla" in body and "vpc" in body
    assert body["vpc"]["private_subnet_example"].endswith("vpc-private.example.tf")

    sla = client.get("/api/sla/demo", headers=headers)
    assert sla.status_code == 200
    assert "targets" in sla.json()

    ticket = client.post(
        "/api/csm/demo/tickets",
        headers=headers,
        json={"subject": "Labeling help", "severity": "3", "body": "Need QBR slot"},
    )
    assert ticket.status_code == 200
    assert ticket.json()["ticket"]["id"].startswith("csm_")

    vpc = client.get("/api/vpc/posture")
    assert vpc.status_code == 200
    assert vpc.json()["status"] == "msa_scoped"


def test_health_records_sla_meter():
    assert client.get("/health").status_code == 200
    sla = client.get("/api/sla/demo", headers={"X-API-Key": "intellens-demo"})
    assert sla.json()["observed"]["checks"] >= 1
