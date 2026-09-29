"""Filing-to-score SLA (plan W2.8)."""

from __future__ import annotations

from datetime import date
from pathlib import Path

from fastapi.testclient import TestClient

from app.data.seed import get_outcomes, reset_data
from app.main import app
from app.services.score_sla import (
    TARGET_BUSINESS_DAYS,
    business_days_between,
    iter_scored_latencies,
    record_filings_from_crawl,
    record_review_publish,
    sla_summary,
)

client = TestClient(app)
COVERAGE = Path(__file__).resolve().parents[2] / "docs" / "customer" / "COVERAGE_AND_SLA.md"


def test_business_days_skips_weekend():
    assert business_days_between(date(2026, 9, 25), date(2026, 9, 25)) == 0  # Fri→Fri
    assert business_days_between(date(2026, 9, 25), date(2026, 9, 28)) == 1  # Fri→Mon
    assert business_days_between(date(2026, 4, 23), date(2026, 4, 30)) == 5  # Thu+5 BD


def test_scored_rows_carry_filing_review_publish_dates():
    reset_data()
    infy = iter_scored_latencies(get_outcomes("infy"), company_id="infy")
    assert infy, "Infosys should have dual-cited scored rows"
    for row in infy:
        assert row["filing_date"]
        assert row["reviewed_at"]
        assert row["published_at"]
        assert row["business_days"] >= 0
        assert row["sample"] == "historical_backfill"


def test_sla_summary_median_matches_scored_rows():
    reset_data()
    body = sla_summary()
    assert body["target_business_days"] == TARGET_BUSINESS_DAYS
    infy = iter_scored_latencies(get_outcomes("infy"), company_id="infy")
    cipla = iter_scored_latencies(get_outcomes("cipla"), company_id="cipla")
    rows = infy + cipla
    days = sorted(int(r["business_days"]) for r in rows)
    assert body["scored_rows"] == len(rows)
    assert body["backfill"]["n"] == len(rows)
    assert body["live"]["n"] == 0
    assert body["live"]["median_business_days"] is None
    assert body["observed_median_business_days"] == body["backfill"]["median_business_days"]
    mid = days[len(days) // 2] if len(days) % 2 else (days[len(days) // 2 - 1] + days[len(days) // 2]) / 2
    assert body["backfill"]["median_business_days"] == float(mid)
    assert "5 business days" in body["policy"]


def test_meta_and_trust_expose_filing_to_score():
    reset_data()
    meta = client.get("/api/meta").json()["filing_to_score"]
    trust = client.get("/api/trust").json()["filing_to_score"]
    assert meta["target_business_days"] == 5
    assert meta["scored_rows"] >= 6
    assert meta["observed_median_business_days"] is not None
    assert trust["target_business_days"] == meta["target_business_days"]
    assert trust["observed_median_business_days"] == meta["observed_median_business_days"]


def test_refresh_records_filing_seen(tmp_path, monkeypatch):
    from app.services import score_sla as sla

    monkeypatch.setattr(sla, "PIPELINE_PATH", tmp_path / "score_pipeline.jsonl")
    n = record_filings_from_crawl(
        {
            "as_of": "2026-09-29T12:00:00Z",
            "results": [
                {
                    "company_id": "infy",
                    "doc_id": "doc_new",
                    "url": "https://example.com/ir",
                    "action": "live_fetch",
                    "deduped": False,
                },
                {
                    "company_id": "tcs",
                    "doc_id": "doc_old",
                    "action": "catalog",
                    "deduped": True,
                },
            ],
        }
    )
    assert n == 1
    events = sla.pipeline_events(kind="filing_seen")
    assert events[0]["company_id"] == "infy"
    assert events[0]["filing_date"] == "2026-09-29"


def test_accept_records_review_publish(tmp_path, monkeypatch):
    from app.services import score_sla as sla

    monkeypatch.setattr(sla, "PIPELINE_PATH", tmp_path / "score_pipeline.jsonl")
    record_review_publish(
        company_id="infy",
        period="FY27",
        metric="revenue_growth_cc_pct",
        filing_date="2026-10-01",
        reviewed_at="2026-10-06",
    )
    events = sla.pipeline_events(kind="review_publish")
    assert events[0]["sample"] == "live"
    assert events[0]["business_days"] == 3  # Thu 1 Oct → Tue 6 Oct = 3 BD


def test_coverage_doc_has_no_illustrative_uptime():
    text = COVERAGE.read_text(encoding="utf-8")
    assert "99.0" not in text
    assert "99.5" not in text
    assert "illustrative" not in text.lower()
    assert "5 business days" in text
