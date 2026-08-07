"""Metric catalog + source policy tests."""

import pytest
from fastapi.testclient import TestClient

from app.data.metric_catalog import (
    METRICS,
    normalize_metric,
    require_metric,
    suggest_metrics,
)
from app.data.source_policy import is_allowed_for_gci, require_gci_source
from app.main import app
from app.services.extraction import extract_guidance


client = TestClient(app)


def test_catalog_size():
    assert len(METRICS) >= 12


def test_normalize_aliases():
    assert normalize_metric("capex_inr_cr") == "capex_guidance"
    assert normalize_metric("yoy_revenue_pct") == "revenue_growth_pct"
    assert normalize_metric("pat_margin_pct") == "net_margin_pct"
    assert normalize_metric("wc_days") == "wc_days"
    assert normalize_metric("working_capital_days") == "wc_days"
    assert normalize_metric("totally_fake_metric_xyz") is None


def test_seed_and_provisional_metrics_in_catalog():
    from app.data.metric_catalog import get_metric
    from app.data.seed import get_data
    from app.services.provisional_gci import make_provisional_outcomes

    data = get_data()
    for rows in data["outcomes"].values():
        for r in rows:
            assert get_metric(r["metric"]) is not None, r["metric"]
    for o in make_provisional_outcomes("nse_abdl", "ABDL"):
        assert get_metric(o.metric) is not None, o.metric


def test_listing_pit_history_not_404():
    res = client.get("/api/companies/nse_abdl/gci/history")
    assert res.status_code == 200
    body = res.json()
    assert isinstance(body, list)
    assert len(body) >= 1
    assert body[0]["gci_score"] is not None


def test_require_metric_rejects():
    with pytest.raises(ValueError):
        require_metric("not_a_real_metric")
    assert "revenue" in ",".join(suggest_metrics("revenue growth"))


def test_extract_normalizes_capex():
    text = "Management guided capex 2000 – 2500 for the year"
    rows = extract_guidance(text, company_id="infy", period="FY26")
    assert rows
    assert all(r["metric"] in {m["id"] for m in METRICS} for r in rows)


def test_source_policy():
    assert is_allowed_for_gci("transcript")
    assert not is_allowed_for_gci("technical")
    assert not is_allowed_for_gci("audio_raw")
    with pytest.raises(ValueError):
        require_gci_source("shenanigan")


def test_api_metrics():
    res = client.get("/api/metrics")
    assert res.status_code == 200
    body = res.json()
    assert body["count"] >= 12
    assert any(m["id"] == "revenue_growth_pct" for m in body["metrics"])


def test_api_metric_detail():
    res = client.get("/api/metrics/revenue_growth_pct")
    assert res.status_code == 200
    assert res.json()["unit"] == "pct"


def test_alphahunter_rejects_unknown_metric():
    res = client.post(
        "/api/import/alphahunter",
        headers={"X-API-Key": "intellens-demo"},
        json={
            "merge_into_company": "infy",
            "facts": [
                {
                    "period": "FY25",
                    "metric": "made_up_kpi_zzz",
                    "guided_value": 5,
                    "actual_value": 4,
                    "guidance_change": "bad metric",
                }
            ],
        },
    )
    assert res.status_code == 400


def test_media_stub():
    res = client.post(
        "/api/ingest/media",
        headers={"X-API-Key": "intellens-demo"},
        json={"company_id": "infy", "media_type": "audio", "note": "Q2 concall"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "accepted_stub"
    assert body["scored_from"] == "transcript_only"


def test_meta_has_policy():
    res = client.get("/api/meta")
    assert res.status_code == 200
    body = res.json()
    assert body["gci_metric_count"] >= 12
    assert "transcript" in body["gci_source_policy"].lower()
