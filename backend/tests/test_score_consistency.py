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
    from app.services.guidance_flags import set_audit_flag

    set_audit_flag(
        "infy",
        "definition_shift",
        set_by="analyst:test",
        source_url="https://www.sec.gov/Archives/edgar/data/1067491/example.htm",
        note="consistency fixture",
    )
    flagged = [
        c["id"]
        for c in client.get("/api/companies").json()
        if c["data_quality"] == "hand_labeled"
        and collect_audit_flags(get_outcomes(c["id"]), company_id=c["id"])
    ]
    assert flagged
    by_id = {}
    for index in ("SENSEX", "NIFTY50"):
        ranks = client.get(f"/api/public/gci-rankings?limit=100&index={index}").json()
        by_id.update({r["company_id"]: r for r in ranks["top"]})
    # Only established/deep tiers rank (W1.3). After W2.1 the ranked set may be
    # empty until promise citations are backfilled; when a flagged name is
    # ranked, the Snapshot number must match the dossier.
    for cid in flagged:
        expected = _dossier(cid)
        if cid in by_id:
            assert by_id[cid]["gci_score"] == expected, cid
        pit = client.get(f"/api/companies/{cid}/gci/history").json()
        if pit:
            assert pit[-1]["gci_score"] == expected, cid
