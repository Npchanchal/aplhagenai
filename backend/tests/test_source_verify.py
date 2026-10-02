"""Source URL verification for citeable outcomes."""

import pytest
from fastapi.testclient import TestClient

from app.data.seed import reset_data
from app.data.verified_sensex_sources import VERIFIED_SENSEX_SOURCES
from app.main import app
from app.services.source_verify import (
    KNOWN_UNVERIFIED,
    quote_in_text,
    verify_source_binding,
)

client = TestClient(app)


def test_crawl_order_puts_numeric_guiders_first():
    from app.services.source_verify import CRAWL_FIRST, iter_source_bindings

    bindings = iter_source_bindings()
    ids = [b["company_id"] for b in bindings]
    assert ids, "expected hand-labeled bindings"
    first = ids[0]
    assert first == CRAWL_FIRST[0]
    if "reliance" in ids:
        assert ids.index("infy") < ids.index("reliance")


def test_quote_in_text_normalizes_dashes():
    assert quote_in_text("3.45% to 3.5%", "margins stable at 3.45% to 3.5% printed")


@pytest.mark.parametrize(
    "company_id",
    [
        "indusindbk",
        "axisbank",
        "techm",
        "sunpharma",
    ],
)
def test_verified_catalog_quote_on_url(company_id: str):
    rows = VERIFIED_SENSEX_SOURCES.get(company_id) or []
    assert rows, f"missing verified rows for {company_id}"
    row = rows[0]
    ok = verify_source_binding(row["source_url"], row["quote_span"])
    assert ok is not False, f"quote missing on {row['source_url']}: {row['quote_span']!r}"


def test_known_broken_html_press_pages_are_not_citeable():
    reset_data()
    assert len(KNOWN_UNVERIFIED) == 4
    for cid, period, metric in KNOWN_UNVERIFIED:
        body = client.get(f"/api/companies/{cid}/gci").json()
        row = next(
            o
            for o in body["outcomes"]
            if o["period"] == period and o["metric"] == metric
        )
        assert row["citeable"] is False, (cid, period, metric)
        assert row["cite_reason"] == "source_unverified"


def test_verify_job_marks_missing_quote_enqueues_and_trust_counts(tmp_path, monkeypatch):
    from app.services import source_verify as sv
    from app.services.labeling_queue import list_queue
    from app.services.repository import merge_matched

    reset_data()
    monkeypatch.setattr(sv, "REPORT_PATH", tmp_path / "report.json")

    def fake(url, quote):
        if "fail.example" in (url or ""):
            return False
        return True

    merge_matched(
        "asianpaints",
        [
            {
                "period": "FY00",
                "metric": "revenue_growth_pct",
                "guided_value": 10.0,
                "guided_text": "fixture",
                "actual_value": 10.0,
                "source_url": "https://fail.example/filing.htm",
                "quote_span": "this quote is not on the page",
                "as_of": "2020-01-01",
            }
        ],
    )
    report = sv.verify_all_bindings(write=True, verify_fn=fake)
    assert report["failed"] >= 1
    assert report["verified"] >= 1
    assert report["checked"] == report["verified"] + report["failed"] + report["fetch_failed"]

    dossier = client.get("/api/companies/asianpaints/gci").json()
    row = next(o for o in dossier["outcomes"] if o["period"] == "FY00")
    assert row["citeable"] is False
    assert row["cite_reason"] == "source_unverified"
    queued = [
        i
        for i in list_queue()
        if i.get("kind") == "source_verify_fail" and i.get("company_id") == "asianpaints"
    ]
    assert queued == []

    infy = client.get("/api/companies/infy/gci").json()
    assert infy["gci_score"] == 76.5
    infy_row = next(o for o in infy["outcomes"] if o.get("guidance_quote"))
    assert infy_row["reviewed_by"] == "verifier:source_check"
    fy22 = next(s for s in infy["revision_summaries"] if s["period"] == "FY22")
    assert fy22["count"] == 3
    assert fy22["direction"] == "raised"
    assert fy22["average_abs_move"] > 0

    trust = client.get("/api/trust").json()["source_verification"]
    assert trust["failed"] >= 1
    assert trust["verified"] >= 1
    assert trust["checked"] == trust["verified"] + trust["failed"] + trust["fetch_failed"]
