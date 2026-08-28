"""Pending depth bootstrap + status report (S0–S9)."""

from __future__ import annotations

import os
from typing import Any, Dict, List


def _https_redirect_ok() -> bool:
    redirect = (os.environ.get("OIDC_REDIRECT_URI") or "").strip().lower()
    if not redirect:
        return False
    return redirect.startswith("https://")


def sensex_corpus_coverage() -> Dict[str, Any]:
    """Rollup period completeness for Sensex hand_labeled names."""
    from app.data.seed import list_companies
    from app.data.universe import SENSEX_30
    from app.services.repository import period_completeness

    sensex_ids = {r[0] for r in SENSEX_30}
    rows: List[Dict[str, Any]] = []
    gates_ok = 0
    for c in list_companies():
        if c["id"] not in sensex_ids:
            continue
        if c.get("data_quality") != "hand_labeled":
            continue
        pc = period_completeness(c["id"])
        gate = bool((pc.get("summary") or {}).get("tier1_gate"))
        if gate:
            gates_ok += 1
        rows.append(
            {
                "company_id": c["id"],
                "ticker": c.get("ticker"),
                "tier1_gate": gate,
                "types_complete_periods": (pc.get("summary") or {}).get("types_complete_periods"),
                "citeable_pct": (pc.get("summary") or {}).get("citeable_pct"),
            }
        )
    n = len(rows) or 1
    return {
        "hand_labeled_sensex": len(rows),
        "tier1_gate_pass": gates_ok,
        "tier1_gate_rate": round(100.0 * gates_ok / n, 1),
        "companies": rows[:30],
        "sla_note": (
            "Institutional bar: ≥95% citeable + expected doc types per recent FY. "
            "Paste remains exception path."
        ),
    }


def pit_honesty_summary() -> Dict[str, Any]:
    from app.data.seed import list_companies
    from app.services.pit_warehouse import analytics_series_for

    kinds: Dict[str, int] = {}
    sample = []
    for c in list_companies()[:12]:
        _vals, pts = analytics_series_for(c["id"])
        kind = "empty"
        if pts:
            kind = str(pts[-1].get("series_kind") or "unknown")
        kinds[kind] = kinds.get(kind, 0) + 1
        sample.append({"company_id": c["id"], "series_kind": kind, "n": len(pts)})
    return {"kind_counts": kinds, "sample": sample}


def conversion_readiness() -> Dict[str, Any]:
    """Commercial checklist — human items stay open."""
    from app.services.legal import copyright_meta

    legal = copyright_meta()
    counsel = os.environ.get("INTELLENS_LEGAL_COUNSEL_STATUS", "scaffold_pending_counsel_signoff")
    try:
        from app.services.legal_attest import counsel_status

        counsel = counsel_status()
    except Exception:
        pass
    return {
        "pilot_checklist_endpoint": "/api/orgs/{id}/pilot-checklist",
        "billing_msa_endpoint": "POST /api/billing/msa",
        "counsel_status": counsel,
        "retail_marketing": os.environ.get("INTELLENS_RETAIL_MARKETING", "").lower()
        in ("1", "true", "yes"),
        "open_human": [
            "Hostinger NS → Route53 cutover",
            "Production OIDC client secrets in IdP",
            "Counsel wet-ink MSA / SEBI RA if retail claims",
            "First paid Desk or API conversion (sales)",
            "Nifty M3/M4 hand_labeled promotions (analyst labor — no invented actuals)",
        ],
        "legal_entity": (legal or {}).get("entity") or "Ocotillo Innovation Private Limited",
    }


def ensure_bootstrap(*, org_id: str = "demo") -> Dict[str, Any]:
    """Idempotent depth bootstrap: Nifty M2 queue + Sensex PIT warehouse."""
    from app.services.nifty_milestones import ensure_nifty_labeling_queue, milestones_payload
    from app.services.pit_warehouse import ensure_sensex_pit_warehouse

    nifty = ensure_nifty_labeling_queue(org_id=org_id)
    pit = ensure_sensex_pit_warehouse()
    return {
        "nifty_enqueue": {"enqueued": nifty.get("enqueued"), "ok": nifty.get("ok")},
        "milestones": milestones_payload(),
        "pit_warehouse": {
            "ok": True,
            "series_kind_policy": "prefer citeable_pit ≥12; else hybrid_pit; else demo_pit_extension",
            "built": pit.get("built") if isinstance(pit, dict) else pit,
        },
    }


def pending_depth_report(*, bootstrap: bool = False) -> Dict[str, Any]:
    from app.services.feature_flags import flags_dict
    from app.services.llm_client import llm_configured
    from app.services.nifty_milestones import milestones_payload
    from app.services.sso import sso_status

    boot = ensure_bootstrap() if bootstrap else None
    ms = milestones_payload()
    sso = sso_status()
    https_ok = _https_redirect_ok()
    force_https = os.environ.get("FORCE_HTTPS", "").lower() in ("1", "true", "yes")

    steps = [
        {
            "id": "S1",
            "title": "LLM extract",
            "status": "done" if llm_configured() else "ready_fallback",
            "detail": "llm_v1 when keyed; heuristic fallback always needs_review",
        },
        {
            "id": "S2",
            "title": "Embeddings research retrieve",
            "status": "done",
            "detail": "API embeddings when keyed; local TF-IDF otherwise",
        },
        {
            "id": "S3",
            "title": "HTTPS domain cutover",
            "status": "ops_pending" if not (https_ok and force_https) else "ready",
            "detail": "scripts/check-domain-cutover.sh + docs/DOMAIN_HTTPS.md",
        },
        {
            "id": "S4",
            "title": "OIDC SSO",
            "status": "ready"
            if sso.get("enabled") and sso.get("configured") and https_ok
            else ("configured" if sso.get("configured") else "ops_pending"),
            "detail": sso.get("note"),
        },
        {
            "id": "S5",
            "title": "Nifty M2 labeling queue",
            "status": next(
                (m["status"] for m in ms["milestones"] if m["id"] == "M2"), "open"
            ),
            "detail": f"queued={ms['counts'].get('nifty_queued')}/{ms['counts'].get('nifty_extra_count')}",
        },
        {
            "id": "S6",
            "title": "Sensex corpus depth",
            "status": "shipped_v1",
            "detail": "GET /api/ops/corpus-coverage",
        },
        {
            "id": "S7",
            "title": "Citeable PIT preference",
            "status": "done",
            "detail": "analytics_series_for prefers citeable_pit",
        },
        {
            "id": "S8",
            "title": "Consensus + FMP deploy checks",
            "status": "done",
            "detail": "upsert import + secrets script FMP warn",
        },
        {
            "id": "S9",
            "title": "Counsel / conversion readiness",
            "status": "checklist",
            "detail": "Human MSA/sales remain open",
        },
    ]
    return {
        "plan": "docs/PENDING_DEPTH_PLAN.md",
        "report": "docs/PENDING_DEPTH_REPORT.md",
        "flags": flags_dict(),
        "llm_configured": llm_configured(),
        "sso": {
            **sso,
            "https_redirect": https_ok,
            "force_https": force_https,
            "production_ready": bool(
                sso.get("enabled") and sso.get("configured") and https_ok
            ),
        },
        "nifty_milestones": ms,
        "corpus": sensex_corpus_coverage(),
        "pit": pit_honesty_summary(),
        "conversion": conversion_readiness(),
        "steps": steps,
        "bootstrap": boot,
    }
