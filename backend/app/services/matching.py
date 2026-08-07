"""Match guidance statements to actual results (same company/period/metric)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional


def match_actuals(
    statements: List[Dict[str, Any]],
    actuals: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    actuals items: {company_id, period, metric, actual_value}
    Returns statements with actual_value filled when matched.
    """
    index = {
        (a["company_id"], a["period"], a["metric"]): a["actual_value"] for a in actuals
    }
    out: List[Dict[str, Any]] = []
    for s in statements:
        row = dict(s)
        key = (s["company_id"], s["period"], s["metric"])
        if key in index and not row.get("dropped"):
            row["actual_value"] = index[key]
            row["match_status"] = "matched"
        else:
            row["match_status"] = "unmatched" if row.get("actual_value") is None else "prefilled"
        out.append(row)
    return out


def alphahunter_facts_to_actuals(facts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Map AlphaHunter Facts_Extracted-like rows to actuals.
    Expected keys: company_id, fiscal_period|period, revenue growth fields optional,
    or metric + actual_value.
    """
    actuals: List[Dict[str, Any]] = []
    for f in facts:
        company_id = f.get("company_id") or f.get("company_name", "").lower().replace(" ", "")
        period = f.get("period") or f.get("fiscal_period") or f.get("quarter_label")
        if not company_id or not period:
            continue
        if "metric" in f and "actual_value" in f:
            actuals.append(
                {
                    "company_id": company_id,
                    "period": period,
                    "metric": f["metric"],
                    "actual_value": f["actual_value"],
                }
            )
            continue
        # Map common AlphaHunter columns
        mapping = [
            ("yoy_revenue_pct", "revenue_growth_pct"),
            ("ebitda_margin", "ebitda_margin_pct"),
            ("eps", "eps"),
        ]
        for src, metric in mapping:
            if f.get(src) is not None:
                actuals.append(
                    {
                        "company_id": company_id,
                        "period": period,
                        "metric": metric,
                        "actual_value": float(f[src]),
                    }
                )
    return actuals
