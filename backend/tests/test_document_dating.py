"""Reviewer dating of undated documents, and no re-fetch of stored documents."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.data import doc_store
from app.data.seed import get_data, reset_data
from app.main import app
from app.services import exchange_filings as ef
from app.services.document_dating import date_document, undated_documents

client = TestClient(app)
HEADERS = {"X-API-Key": "intellens-onestop"}
URL = "https://www.wipro.com/content/dam/nexus/en/investor/q1fy27-earnings-transcript.pdf"
TEXT = "Wipro Limited Q1 FY '27 Earnings Conference Call July 16, 2026. We expect revenue growth of 1% to 3%."


@pytest.fixture(autouse=True)
def _isolate(tmp_path, monkeypatch):
    monkeypatch.setenv("INTELLENS_DATA_DIR", str(tmp_path))
    doc_store._DOCS = None
    reset_data()
    ef.reset_rate_limit()
    ef.reset_web_search()
    yield
    doc_store._DOCS = None
    reset_data()


def _undated_doc():
    out = ef.ingest_url("wipro", URL, category="concall", text=TEXT, undated=True)
    return out["doc_id"]


def test_dating_needs_verbatim_evidence_and_a_past_date():
    doc_id = _undated_doc()
    with pytest.raises(ValueError, match="verbatim"):
        date_document(doc_id, as_of="2026-07-16", evidence="Call held 16 July", basis="call_or_meeting_date", reviewer="r")
    with pytest.raises(ValueError, match="today"):
        date_document(doc_id, as_of="2999-01-01", evidence="July 16, 2026", basis="call_or_meeting_date", reviewer="r")
    with pytest.raises(ValueError, match="basis"):
        date_document(doc_id, as_of="2026-07-16", evidence="July 16, 2026", basis="guess", reviewer="r")
    assert doc_store.get_document(doc_id)["date"] == ""


def test_dating_stamps_document_and_backfills_extracted_rows():
    doc_id = _undated_doc()
    rows = get_data().setdefault("outcomes", {}).setdefault("wipro", [])
    rows.append({"company_id": "wipro", "period": "FY27", "metric": "revenue_growth_pct",
                 "guidance_source_url": URL.replace("https://www.", "http://"), "guidance_as_of": None})
    rows.append({"company_id": "wipro", "period": "FY26", "metric": "revenue_growth_pct",
                 "guidance_source_url": "https://www.wipro.com/other.pdf", "guidance_as_of": None})
    assert [d["doc_id"] for d in undated_documents("wipro")] == [doc_id]
    out = date_document(doc_id, as_of="2026-07-16", evidence="Earnings Conference Call July 16, 2026",
                        basis="call_or_meeting_date", reviewer="navin")
    assert out["rows_dated"] == 1
    doc = doc_store.get_document(doc_id)
    assert doc["date"] == "2026-07-16" and doc["dated_by"] == "navin" and doc["date_evidence"]
    rows = get_data()["outcomes"]["wipro"]
    assert rows[-2]["guidance_as_of"] == "2026-07-16" and rows[-1]["guidance_as_of"] is None
    assert undated_documents("wipro") == []


def test_date_endpoint_requires_write_access_and_rejects_bad_evidence():
    doc_id = _undated_doc()
    body = {"as_of": "2026-07-16", "evidence": "July 16, 2026", "basis": "call_or_meeting_date", "reviewer": "navin"}
    assert client.post(f"/api/documents/{doc_id}/date", json=body).status_code in (401, 403)
    bad = client.post(f"/api/documents/{doc_id}/date", json={**body, "evidence": "not in text"}, headers=HEADERS)
    assert bad.status_code == 422
    ok = client.post(f"/api/documents/{doc_id}/date", json=body, headers=HEADERS)
    assert ok.status_code == 200 and ok.json()["date"] == "2026-07-16"
    assert client.get("/api/documents/undated?company_id=wipro").json()["count"] == 0


@pytest.mark.parametrize(
    "variant",
    [
        URL.replace("https://www.", "http://"),
        URL + "#page=2",
        URL + "?utm_source=x",
        URL.replace("https://www.wipro.com", "https://WWW.WIPRO.COM"),
    ],
)
def test_stored_document_is_never_fetched_again(monkeypatch, variant):
    _undated_doc()
    monkeypatch.setattr(ef, "fetch_bytes", lambda *a, **k: pytest.fail("re-fetched a stored document"))
    monkeypatch.setattr(ef, "_outcome_urls", lambda cid: [])
    monkeypatch.setattr(ef, "discover_nse_filings", lambda cid, payload=None: [{"url": variant, "category": "concall"}])
    out = ef.ingest_company_urls("tcs", live=True, discovery_payload=[])
    assert [r.get("action") for r in out["results"]] == ["already_stored"]


def test_nse_archive_hosts_share_one_key():
    a = "https://nsearchives.nseindia.com/corporate/X_1.pdf"
    b = "https://archives.nseindia.com/corporate/X_1.pdf"
    assert doc_store.url_key(a) == doc_store.url_key(b)
    assert doc_store.url_key("https://www.bseindia.com/a.pdf") == doc_store.url_key("https://beta.bseindia.com/a.pdf")


def test_quote_check_uses_stored_text_without_fetching(monkeypatch):
    from app.services import source_verify

    _undated_doc()
    monkeypatch.setattr(source_verify, "fetch_source_text", lambda *a, **k: pytest.fail("fetched a stored document"))
    assert source_verify.verify_source_binding(URL, "We expect revenue growth of 1% to 3%") is True
    assert source_verify.verify_source_binding(URL, "a sentence that is not in the stored copy") is None
