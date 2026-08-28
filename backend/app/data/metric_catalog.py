"""GCI guided-metric catalog — only quantified guidance metrics belong in GCI."""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Sequence

# Canonical catalog. Seed aliases must normalize into these ids.
METRICS: List[Dict[str, Any]] = [
    {
        "id": "revenue_growth_pct",
        "display_name": "Revenue growth %",
        "unit": "pct",
        "family": "growth",
        "sectors": [],
        "aliases": ["revenue_growth", "rev_growth_pct", "yoy_revenue_pct", "top_line_growth"],
        "tier": "core",
        "bands_preferred": True,
    },
    {
        "id": "revenue_growth_cc_pct",
        "display_name": "Revenue growth (constant currency) %",
        "unit": "pct",
        "family": "growth",
        "sectors": [],
        "aliases": ["cc_revenue_growth", "constant_currency_growth"],
        "tier": "core",
        "bands_preferred": True,
    },
    {
        "id": "operating_margin_pct",
        "display_name": "Operating margin %",
        "unit": "pct",
        "family": "margin",
        "sectors": [],
        "aliases": ["op_margin_pct", "operating_margin", "ebit_margin_pct"],
        "tier": "core",
        "bands_preferred": True,
    },
    {
        "id": "ebitda_margin_pct",
        "display_name": "EBITDA margin %",
        "unit": "pct",
        "family": "margin",
        "sectors": [],
        "aliases": ["ebitda_margin", "margin_ebitda"],
        "tier": "core",
        "bands_preferred": True,
    },
    {
        "id": "ebitda_growth_pct",
        "display_name": "EBITDA growth %",
        "unit": "pct",
        "family": "growth",
        "sectors": [],
        "aliases": ["ebitda_growth"],
        "tier": "core",
        "bands_preferred": True,
    },
    {
        "id": "net_margin_pct",
        "display_name": "Net / PAT margin %",
        "unit": "pct",
        "family": "margin",
        "sectors": [],
        "aliases": ["pat_margin_pct", "pat_margin", "npm_pct", "net_profit_margin"],
        "tier": "core",
        "bands_preferred": True,
    },
    {
        "id": "capex_guidance",
        "display_name": "Capex guidance",
        "unit": "inr_cr",
        "family": "capital",
        "sectors": [],
        "aliases": ["capex", "capex_inr_cr", "capital_expenditure"],
        "tier": "core",
        "bands_preferred": True,
    },
    {
        "id": "fcf_guidance",
        "display_name": "Free cash flow guidance",
        "unit": "inr_cr",
        "family": "capital",
        "sectors": [],
        "aliases": ["fcf", "free_cash_flow"],
        "tier": "core",
        "bands_preferred": False,
    },
    {
        "id": "wc_days",
        "display_name": "Working-capital days",
        "unit": "days",
        "family": "capital",
        "sectors": [],
        "aliases": ["working_capital_days", "nwc_days", "cash_conversion_days"],
        "tier": "core",
        "bands_preferred": True,
    },
    {
        "id": "utilization_pct",
        "display_name": "Capacity / utilization %",
        "unit": "pct",
        "family": "volume",
        "sectors": ["Industrials", "Metals", "Auto", "Manufacturing"],
        "aliases": ["capacity_utilization_pct", "plant_utilization_pct"],
        "tier": "sector",
        "bands_preferred": True,
    },
    {
        "id": "nim_pct",
        "display_name": "Net interest margin %",
        "unit": "pct",
        "family": "sector",
        "sectors": ["Financials", "Banks", "NBFC"],
        "aliases": ["nim", "net_interest_margin"],
        "tier": "sector",
        "bands_preferred": True,
    },
    {
        "id": "loan_growth_pct",
        "display_name": "Loan / advances growth %",
        "unit": "pct",
        "family": "sector",
        "sectors": ["Financials", "Banks", "NBFC"],
        "aliases": ["advances_growth_pct", "credit_growth_pct"],
        "tier": "sector",
        "bands_preferred": True,
    },
    {
        "id": "underlying_volume_growth_pct",
        "display_name": "Underlying volume growth %",
        "unit": "pct",
        "family": "volume",
        "sectors": ["FMCG", "Consumer", "Staples"],
        "aliases": ["volume_growth_pct", "uvg_pct"],
        "tier": "sector",
        "bands_preferred": True,
    },
    {
        "id": "cigarette_volume_growth_pct",
        "display_name": "Cigarette volume growth %",
        "unit": "pct",
        "family": "volume",
        "sectors": ["FMCG", "Staples"],
        "aliases": ["cig_volume_growth"],
        "tier": "sector",
        "bands_preferred": True,
    },
    {
        "id": "wholesale_volume_growth_pct",
        "display_name": "Wholesale volume growth %",
        "unit": "pct",
        "family": "volume",
        "sectors": ["Auto", "Automobiles"],
        "aliases": ["wholesale_volume"],
        "tier": "sector",
        "bands_preferred": True,
    },
    {
        "id": "same_store_sales_pct",
        "display_name": "Same-store sales growth %",
        "unit": "pct",
        "family": "volume",
        "sectors": ["Retail", "Consumer"],
        "aliases": ["sss_pct", "sssg", "like_for_like_sales"],
        "tier": "sector",
        "bands_preferred": True,
    },
    {
        "id": "arpu_growth_pct",
        "display_name": "ARPU growth %",
        "unit": "pct",
        "family": "sector",
        "sectors": ["Telecom", "Communication"],
        "aliases": ["arpu_growth", "arpu"],
        "tier": "sector",
        "bands_preferred": True,
    },
    {
        "id": "jewelry_ebitda_margin_pct",
        "display_name": "Jewellery EBITDA margin %",
        "unit": "pct",
        "family": "margin",
        "sectors": ["Consumer", "Retail"],
        "aliases": ["jewellery_ebitda_margin_pct"],
        "tier": "sector",
        "bands_preferred": True,
    },
    {
        "id": "rd_spend_pct_of_revenue",
        "display_name": "R&D spend % of revenue",
        "unit": "pct",
        "family": "capital",
        "sectors": ["Pharma", "Healthcare", "IT Services"],
        "aliases": ["rd_pct", "r_and_d_pct", "research_spend_pct"],
        "tier": "sector",
        "bands_preferred": True,
    },
    {
        "id": "cost_savings_pct_of_revenue",
        "display_name": "Cost savings % of revenue",
        "unit": "pct",
        "family": "margin",
        "sectors": ["FMCG", "Consumer", "Staples"],
        "aliases": ["cost_efficiency_pct", "savings_pct_sales"],
        "tier": "sector",
        "bands_preferred": True,
    },
    {
        "id": "ape_growth_pct",
        "display_name": "APE / new business growth %",
        "unit": "pct",
        "family": "growth",
        "sectors": ["Insurance", "Financials"],
        "aliases": ["individual_ape_growth", "nb_ape_growth", "wrp_growth_pct"],
        "tier": "sector",
        "bands_preferred": True,
    },
    {
        "id": "vnb_growth_pct",
        "display_name": "VNB growth %",
        "unit": "pct",
        "family": "growth",
        "sectors": ["Insurance", "Financials"],
        "aliases": ["value_of_new_business_growth", "vonb_growth"],
        "tier": "sector",
        "bands_preferred": True,
    },
    {
        "id": "vnb_margin_pct",
        "display_name": "VNB / new business margin %",
        "unit": "pct",
        "family": "margin",
        "sectors": ["Insurance", "Financials"],
        "aliases": ["new_business_margin_pct", "nbm_pct", "vonb_margin"],
        "tier": "sector",
        "bands_preferred": True,
    },
    {
        "id": "roev_pct",
        "display_name": "Operating return on embedded value %",
        "unit": "pct",
        "family": "margin",
        "sectors": ["Insurance", "Financials"],
        "aliases": ["operating_roev", "return_on_embedded_value"],
        "tier": "sector",
        "bands_preferred": True,
    },
    {
        "id": "occupancy_pct",
        "display_name": "Hospital bed occupancy %",
        "unit": "pct",
        "family": "volume",
        "sectors": ["Healthcare", "Hospitals"],
        "aliases": ["bed_occupancy_pct", "occupancy_rate"],
        "tier": "sector",
        "bands_preferred": True,
    },
    {
        "id": "arpo_growth_pct",
        "display_name": "ARPOB growth %",
        "unit": "pct",
        "family": "growth",
        "sectors": ["Healthcare", "Hospitals"],
        "aliases": ["arpob_growth_pct", "arpo_b_growth"],
        "tier": "sector",
        "bands_preferred": True,
    },
]

CORE_METRICS = [m for m in METRICS if m["tier"] == "core"]

_BY_ID: Dict[str, Dict[str, Any]] = {m["id"]: m for m in METRICS}
_ALIAS: Dict[str, str] = {}
for m in METRICS:
    _ALIAS[m["id"].lower()] = m["id"]
    for a in m.get("aliases", []):
        _ALIAS[str(a).lower()] = m["id"]


def get_metric(metric_id: str) -> Optional[Dict[str, Any]]:
    if metric_id in _BY_ID:
        return _BY_ID[metric_id]
    nid = normalize_metric(metric_id)
    return _BY_ID.get(nid) if nid else None


def list_metrics(sector: Optional[str] = None) -> List[Dict[str, Any]]:
    if not sector:
        return list(METRICS)
    s = sector.lower()
    out = []
    for m in METRICS:
        sectors = m.get("sectors") or []
        if not sectors or any(s in x.lower() or x.lower() in s for x in sectors):
            out.append(m)
    return out


def normalize_metric(raw: Optional[str]) -> Optional[str]:
    """Map raw / alias string → catalog id, or None if unknown."""
    if raw is None:
        return None
    key = str(raw).strip().lower().replace(" ", "_").replace("-", "_")
    if not key:
        return None
    if key in _ALIAS:
        return _ALIAS[key]
    # soft: strip trailing _pct duplicates etc.
    if key.endswith("_percent"):
        return _ALIAS.get(key.replace("_percent", "_pct"))
    return None


def suggest_metrics(raw: str, limit: int = 5) -> List[str]:
    key = str(raw).strip().lower()
    scored = []
    for m in METRICS:
        blob = f"{m['id']} {m['display_name']} {' '.join(m.get('aliases', []))}".lower()
        score = sum(1 for tok in key.replace("_", " ").split() if tok and tok in blob)
        if score:
            scored.append((score, m["id"]))
    scored.sort(reverse=True)
    return [i for _, i in scored[:limit]] or [m["id"] for m in CORE_METRICS[:limit]]


def require_metric(raw: Optional[str], *, allow_custom: bool = False) -> str:
    """Return catalog id or raise ValueError with suggestions."""
    nid = normalize_metric(raw)
    if nid:
        return nid
    if allow_custom and raw:
        # experimental passthrough — caller should tag tier
        return str(raw).strip()
    suggestions = suggest_metrics(str(raw or ""))
    raise ValueError(
        f"Unknown GCI metric {raw!r}. Use catalog id. Suggestions: {', '.join(suggestions)}"
    )


def normalize_statement_metrics(
    rows: Sequence[Dict[str, Any]],
    *,
    allow_custom: bool = False,
) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for row in rows:
        r = dict(row)
        r["metric"] = require_metric(r.get("metric"), allow_custom=allow_custom)
        out.append(r)
    return out


def catalog_summary() -> Dict[str, Any]:
    return {
        "count": len(METRICS),
        "core_count": len(CORE_METRICS),
        "sector_count": sum(1 for m in METRICS if m["tier"] == "sector"),
        "metrics": METRICS,
    }
