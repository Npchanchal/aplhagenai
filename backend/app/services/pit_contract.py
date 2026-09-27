"""Versioned PIT API contract for design-partner quant desks."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.services import repository

CONTRACT_VERSION = "pit.v1"


def series_meta_for(company_id: str) -> Dict[str, Any]:
    """Honest series_kind for EM factor / PIT exports (no false citeable_pit)."""
    detail = repository.get_company_gci(company_id)
    quality = (detail.data_quality or "").lower()
    pit = repository.pit_history(company_id)
    cite_n = sum(1 for o in detail.outcomes if getattr(o, "citeable", None) is True)

    from app.services.pit_warehouse import get_pit_series

    wh = get_pit_series(company_id) or {}
    wh_kind = (wh.get("series_kind") or "").strip()

    if quality == "hand_labeled" and cite_n > 0 and len(pit) >= 4:
        kind = "citeable_pit"
        citeable = True
    elif quality == "hand_labeled" and cite_n > 0:
        kind = "citeable_pit_short"
        citeable = True
    elif quality == "hand_labeled":
        kind = "hand_labeled_incomplete_citations"
        citeable = False
    elif wh_kind.startswith("demo") or wh_kind == "hybrid_pit":
        kind = wh_kind or "demo_pit_extension"
        citeable = False
    elif quality == "demo_structured":
        kind = "demo_structured"
        citeable = False
    else:
        kind = "provisional_or_scaffold"
        citeable = False

    return {
        "contract_version": CONTRACT_VERSION,
        "company_id": company_id,
        "ticker": detail.ticker,
        "data_quality": detail.data_quality,
        "series_kind": kind,
        "citeable": citeable,
        "citeable_outcomes": cite_n,
        "pit_points": len(pit),
        "asof_gci": detail.gci_score,
        "note": (
            "citeable_pit requires hand_labeled + ≥1 citeable outcome + ≥4 PIT points. "
            "Do not backtest demo_pit_extension as production alpha."
        ),
    }


def contract_schema() -> Dict[str, Any]:
    return {
        "contract_version": CONTRACT_VERSION,
        "description": (
            "Point-in-time GCI for institutional quant partners. "
            "Every history point is as_of stamped; do not leak current GCI into past dates."
        ),
        "endpoints": {
            "schema": "GET /api/v1/pit/contract",
            "history": "GET /api/v1/pit/companies/{company_id}/history",
            "bulk": "GET /api/v1/pit/bulk?ids=infy,tcs,rel",
            "em_factor": "GET /api/export/em-factor/{company_id}?format=json|csv",
            "legacy_history": "GET /api/companies/{company_id}/gci/history",
        },
        "fields": {
            "as_of": "ISO date or period label when the score was knowable",
            "gci_score": "0–100 guidance credibility index",
            "prior_gci": "Previous point score when available",
            "change_pct": "Percent change vs prior",
            "change_horizon": "Horizon label when inferred",
            "series_kind": "citeable_pit | citeable_pit_short | demo_* | provisional_*",
            "citeable": "Boolean — safe for external IC citation",
        },
        "series_kind_enum": [
            "citeable_pit",
            "citeable_pit_short",
            "hand_labeled_incomplete_citations",
            "demo_pit_extension",
            "hybrid_pit",
            "demo_structured",
            "provisional_or_scaffold",
        ],
        "sla_notes": (
            "Design-partner feed: JSON default; CSV/Parquet require API key. "
            "Contracted refresh windows belong in Enterprise API MSA."
        ),
        "legal": "Factual research data — not investment advice. © Ocotillo Innovation Private Limited.",
    }


def history_v1(company_id: str) -> Dict[str, Any]:
    meta = series_meta_for(company_id)
    hist = repository.pit_history(company_id)
    points = [
        {
            "as_of": p.as_of,
            "gci_score": p.gci_score,
            "prior_gci": p.prior_gci,
            "change_pct": p.change_pct,
            "change_horizon": p.change_horizon,
        }
        for p in hist
    ]
    return {**meta, "points": points}


def bulk_history(ids: List[str]) -> Dict[str, Any]:
    clean = [i.strip() for i in ids if i and i.strip()][:50]
    companies = []
    for cid in clean:
        try:
            companies.append(history_v1(cid))
        except Exception as exc:  # noqa: BLE001 — per-id soft fail for partners
            companies.append(
                {
                    "contract_version": CONTRACT_VERSION,
                    "company_id": cid,
                    "error": str(exc),
                    "points": [],
                }
            )
    return {
        "contract_version": CONTRACT_VERSION,
        "count": len(companies),
        "companies": companies,
    }
