"""Sensex IR crawl job + pending-doc alerts."""

from app.data import doc_store
from app.data.seed import reset_data
from app.services.crawl import run_sensex_ir_crawl
from app.services.repository import list_alerts


def setup_function():
    reset_data()
    doc_store.reset_docs()


def teardown_module():
    reset_data()
    doc_store.reset_docs()


def test_crawl_dry_run_no_writes():
    before = len(doc_store.list_documents())
    report = run_sensex_ir_crawl(limit=5, dry_run=True, live=False)
    assert report["dry_run"] is True
    assert report["targets"] == 5
    assert all(r["action"] == "dry_run" for r in report["results"])
    assert len(doc_store.list_documents()) == before


def test_crawl_catalog_creates_pending_and_alerts():
    report = run_sensex_ir_crawl(limit=3, dry_run=False, live=False)
    assert report["pending_new"] >= 1
    assert report["pending_total"] >= 1
    pending = [
        d
        for d in doc_store.list_documents()
        if d.get("review_status") == "pending" and d.get("source") == "ir_catalog"
    ]
    assert pending

    # Second run dedupes — no additional pending_new for same digests
    report2 = run_sensex_ir_crawl(limit=3, dry_run=False, live=False)
    assert report2["pending_new"] == 0
    assert report2["skipped_dedupe"] >= 1

    alerts = list_alerts()
    pending_alerts = [a for a in alerts if a.kind == "docs_pending_review"]
    assert pending_alerts
    assert "awaiting review" in pending_alerts[0].message


def test_crawl_api(client=None):
    from fastapi.testclient import TestClient
    from app.main import app

    c = client or TestClient(app)
    r = c.post(
        "/api/ingest/crawl",
        headers={"X-API-Key": "intellens-demo"},
        json={"limit": 2, "dry_run": False, "live": False},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ok"] is True
    assert body["targets"] == 2

    st = c.get("/api/ingest/crawl/status", headers={"X-API-Key": "intellens-demo"})
    assert st.status_code == 200
    assert "pending_total" in st.json()
