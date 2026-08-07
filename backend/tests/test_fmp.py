"""FMP client + market history fallback (mocked network)."""

from unittest.mock import patch

from app.data.market_history import get_index_history, get_stock_history, history_meta
from app.services import fmp_client


def test_history_meta_without_key(monkeypatch):
    monkeypatch.delenv("INTELLENS_FMP_API_KEY", raising=False)
    monkeypatch.delenv("FMP_API_KEY", raising=False)
    fmp_client._DOTENV_LOADED = True  # skip reading local .env in CI
    monkeypatch.setattr(fmp_client, "api_key", lambda: None)
    meta = history_meta()
    assert meta["fmp_configured"] is False
    assert meta["history_kind"] == "demo_deterministic"


def test_us_index_uses_fmp_when_keyed(monkeypatch):
    monkeypatch.setattr(fmp_client, "api_key", lambda: "test-key")
    monkeypatch.setattr(fmp_client, "enabled", lambda: True)

    fake = [
        {"date": "2024-01-31", "price": 100.0, "volume": 1},
        {"date": "2024-02-29", "price": 110.0, "volume": 1},
        {"date": "2025-01-31", "price": 120.0, "volume": 1},
    ]
    with patch.object(fmp_client, "fetch_historical_eod", return_value=[
        {"date": r["date"], "close": r["price"], "volume": r["volume"]} for r in fake
    ]):
        # bypass cache path by patching history_bundle internals via fetch
        with patch.object(
            fmp_client,
            "history_bundle",
            return_value={
                "symbol": "^GSPC",
                "points": [
                    {"date": "2024-01-31", "close": 100.0},
                    {"date": "2025-01-31", "close": 120.0},
                ],
                "point_count": 2,
                "last": 120.0,
                "change_pct": 20.0,
                "kind": "fmp_eod",
                "provider": "financialmodelingprep",
                "note": "test",
                "data_quality": "vendor_eod",
            },
        ):
            row = get_index_history("SPX", years=5)
    assert row is not None
    assert row["kind"] == "fmp_eod"
    assert row["data_quality"] == "vendor_eod"
    assert row["last"] == 120.0


def test_india_stock_falls_back_to_demo_on_vendor_miss(monkeypatch):
    monkeypatch.setattr(fmp_client, "enabled", lambda: True)
    monkeypatch.setattr(fmp_client, "history_bundle_for_stock", lambda *a, **k: None)
    row = get_stock_history("infy", years=5)
    assert row is not None
    assert row["kind"] == "demo_deterministic"
    assert row["point_count"] >= 12


def test_symbol_candidates_india():
    assert fmp_client.fmp_symbol_candidates_for_stock("INFY", "IN")[0] == "INFY.NS"
