"""Public OpenAPI hides ops routes; v1 aliases exist (W8.5)."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

_HIDDEN = ("/api/admin", "/api/ops", "/api/import", "/api/ingest", "/api/infra")


def test_public_openapi_hides_ops_and_admin():
    paths = client.get("/openapi.json").json()["paths"]
    leaked = [p for p in paths if any(p.startswith(h) for h in _HIDDEN)]
    assert not leaked, leaked
    assert "/api/billing/retail/checkout" not in paths
    assert "/api/v1/companies/{company_id}/gci" in paths
    assert "/api/v1/index/digest" in paths
    assert "/api/v1/index/files/{name}" in paths
    assert len(paths) <= 40, len(paths)


def test_changelog_rss_and_status():
    rss = client.get("/api/v1/index/changelog.rss")
    assert rss.status_code == 200
    assert "<rss" in rss.text
    st = client.get("/api/status")
    assert st.status_code == 200
    assert st.json()["ok"] is True


def test_v1_company_aliases():
    a = client.get("/api/companies/infy/gci")
    b = client.get("/api/v1/companies/infy/gci")
    assert a.status_code == 200
    assert b.status_code == 200
    assert a.json()["gci_score"] == b.json()["gci_score"]


def test_index_files_from_ledger():
    r = client.get("/api/v1/index/files")
    assert r.status_code == 200
    body = r.json()
    assert body["count"] >= 1
    assert body["files"][0]["name"].startswith("gci_levels_")
    assert body["files"][0]["sha256"]
