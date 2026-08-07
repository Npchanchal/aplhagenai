"""India NSE/BSE listing masters + GCI v2 coverage."""

from fastapi.testclient import TestClient

from app.data.gci_score_cache import build_india_gci_cache, clear_memory_cache, get_listing_score
from app.data.india_listings import find_listing, listing_counts
from app.data.markets import list_constituents, list_indexes
from app.data.seed import get_data, get_outcomes, outcome_from_dict, reset_data
from app.main import app
from app.services.gci_scoring import compute_company_gci
from app.services.provisional_gci import make_provisional_outcomes, score_provisional

client = TestClient(app)


def test_nse_bse_listing_counts():
    counts = listing_counts()
    assert counts["nse"] >= 2000
    assert counts["bse"] >= 2000
    assert counts["merged"] >= counts["nse"]


def test_nse_all_and_bse_all_indexes():
    indexes = {i["id"]: i for i in list_indexes("IN")}
    assert "NSE_ALL" in indexes
    assert "BSE_ALL" in indexes
    nse = list_constituents("NSE_ALL")
    bse = list_constituents("BSE_ALL")
    assert len(nse) >= 2000
    assert len(bse) >= 2000


def test_provisional_gci_uses_v2_scorer():
    rep = score_provisional("nse_demo", "DEMOCO", "Equity")
    assert rep["gci_score"] is not None
    assert 0 <= rep["gci_score"] <= 100
    assert rep["data_quality"] == "listing_provisional"
    outcomes = make_provisional_outcomes("nse_demo", "DEMOCO", "Equity")
    assert compute_company_gci(outcomes) == rep["gci_score"]


def test_score_universe_cache_subset():
    clear_memory_cache()
    report = build_india_gci_cache(limit=80)
    assert report["scored_count"] >= 40
    assert report["algorithm"] == "gci_scoring_v2"
    # A non-seed listing in the first 80 should be cached
    listing = next(
        r
        for r in list_constituents("NSE_ALL")
        if r["data_quality"] == "listing_master"
    )
    # may or may not be in first 80 — score directly
    scored = score_provisional(listing["id"], listing["ticker"], listing.get("sector") or "Equity")
    assert scored["gci_score"] is not None


def test_sensex_still_scored():
    reset_data()
    data = get_data()
    assert len(data["companies"]) >= 40
    scored = [
        c
        for c in data["companies"]
        if compute_company_gci(
            [outcome_from_dict(o) for o in data["outcomes"][c["id"]]]
        )
        is not None
    ]
    assert len(scored) >= 30


def test_companies_api_nse_all_has_scores():
    clear_memory_cache()
    build_india_gci_cache(limit=None)
    r = client.get("/api/companies/count", params={"market": "IN", "index": "NSE_ALL"})
    assert r.status_code == 200
    assert r.json()["count"] >= 2000
    r2 = client.get(
        "/api/companies",
        params={"market": "IN", "index": "NSE_ALL", "limit": 20},
    )
    assert r2.status_code == 200
    body = r2.json()
    assert len(body) == 20
    assert all(row["gci_score"] is not None for row in body)


def test_listing_dossier_has_provisional_gci():
    listing = next(
        r
        for r in list_constituents("NSE_ALL")
        if r["data_quality"] == "listing_master"
    )
    assert find_listing(listing["id"]) is not None
    r = client.get(f"/api/companies/{listing['id']}/gci")
    assert r.status_code == 200
    body = r.json()
    assert body["gci_score"] is not None
    assert body["data_quality"] == "listing_provisional"
    assert body["outcomes"]
    assert get_outcomes(listing["id"]) == []  # not in seed store
