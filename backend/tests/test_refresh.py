"""GCI scheduled refresh job."""

from app.data import doc_store
from app.data.seed import reset_data
from app.services.refresh import run_gci_refresh
from fastapi.testclient import TestClient

from app.main import app


def setup_function():
    reset_data()
    doc_store.reset_docs()


def teardown_module():
    reset_data()
    doc_store.reset_docs()


def test_refresh_catalog_creates_pending_and_extract_queue():
    report = run_gci_refresh(limit=2, live=False, auto_extract=True, warm_fmp=False)
    assert report["ok"] is True
    assert report["live"] is False
    assert report["crawl"]["pending_total"] >= 1
    assert report["extract"]["batches"] >= 0


def test_refresh_api():
    client = TestClient(app)
    r = client.post(
        "/api/ingest/refresh",
        headers={"X-API-Key": "intellens-demo"},
        json={"limit": 2, "live": False, "auto_extract": True, "warm_fmp": False},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert "crawl" in body
    assert "interval_hours" in body
