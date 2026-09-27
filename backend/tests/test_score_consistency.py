"""Every surface must show the same company GCI as the dossier (after audit deductions)."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.data.seed import get_outcomes, reset_data
from app.main import app
from app.services.guidance_flags import collect_audit_flags

client = TestClient(app)


def setup_function():
    reset_data()


def _dossier(cid: str) -> float:
    return client.get(f"/api/companies/{cid}/gci").json()["gci_score"]


def test_screener_list_matches_dossier_for_every_company():
    rows = client.get("/api/companies").json()
    assert rows
    for r in rows:
        assert r["gci_score"] == _dossier(r["id"]), r["id"]


def test_audit_flagged_company_matches_on_public_snapshot_and_pit():
    flagged = [
        c["id"]
        for c in client.get("/api/companies").json()
        if c["data_quality"] == "hand_labeled" and collect_audit_flags(get_outcomes(c["id"]))
    ]
    assert "infy" in flagged
    ranks = client.get("/api/public/gci-rankings?limit=100").json()
    by_id = {r["company_id"]: r for r in ranks["top"]}
    assert "infy" in by_id
    for cid in flagged:
        expected = _dossier(cid)
        if cid in by_id:
            assert by_id[cid]["gci_score"] == expected, cid
        pit = client.get(f"/api/companies/{cid}/gci/history").json()
        if pit:
            assert pit[-1]["gci_score"] == expected, cid
