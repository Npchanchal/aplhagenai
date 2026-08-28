"""Nifty deep-GCI labeling milestones (honest roadmap — no invented actuals)."""

from __future__ import annotations

from typing import Any, Dict, List

from app.data.seed import get_data, list_companies
from app.data.universe import NIFTY_EXTRA, SENSEX_30


# Product milestones for Sensex → Nifty depth (SOW-aligned).
MILESTONES: List[Dict[str, Any]] = [
    {
        "id": "M0",
        "title": "Sensex pilot live",
        "target": "Sensex-30 in product with GCI + evidence UI",
        "gate": "sensex_live",
    },
    {
        "id": "M1",
        "title": "Sensex hand_labeled depth",
        "target": "≥20 Sensex names hand_labeled with citeable quotes",
        "gate": "sensex_hl_20",
    },
    {
        "id": "M2",
        "title": "Nifty-50 scaffold labeled queue",
        "target": "All NIFTY_EXTRA names enqueued for hand-label priority",
        "gate": "nifty_queued",
    },
    {
        "id": "M3",
        "title": "Nifty-50 first hand_labeled cohort",
        "target": "≥5 Nifty-extra names promoted to hand_labeled",
        "gate": "nifty_hl_5",
    },
    {
        "id": "M4",
        "title": "Nifty-50 deep GCI",
        "target": "All NIFTY_EXTRA hand_labeled (day-N SOW — not day-1)",
        "gate": "nifty_hl_all",
    },
]


def _nifty_ids() -> List[str]:
    return [r[0] for r in NIFTY_EXTRA]


def _counts() -> Dict[str, Any]:
    cos = list_companies()
    by_id = {c["id"]: c for c in cos}
    sensex_ids = {r[0] for r in SENSEX_30}
    nifty_ids = set(_nifty_ids())
    sensex_hl = sum(
        1
        for cid in sensex_ids
        if by_id.get(cid, {}).get("data_quality") == "hand_labeled"
    )
    nifty_hl = sum(
        1
        for cid in nifty_ids
        if by_id.get(cid, {}).get("data_quality") == "hand_labeled"
    )
    queue = get_data().get("labeling_queue") or []
    nifty_queued = {
        r.get("company_id")
        for r in queue
        if r.get("company_id") in nifty_ids and r.get("status") in ("queued", "in_progress", "done")
    }
    # M2 coverage = in queue OR already promoted to hand_labeled
    nifty_m2_covered = nifty_queued | {
        cid for cid in nifty_ids if by_id.get(cid, {}).get("data_quality") == "hand_labeled"
    }
    return {
        "sensex_count": len(sensex_ids),
        "sensex_hand_labeled": sensex_hl,
        "nifty_extra_count": len(nifty_ids),
        "nifty_hand_labeled": nifty_hl,
        "nifty_queued": len(nifty_queued),
        "nifty_queued_ids": sorted(nifty_queued),
        "nifty_m2_covered": len(nifty_m2_covered),
        "nifty_m2_covered_ids": sorted(nifty_m2_covered),
    }


def _gate_status(gate: str, counts: Dict[str, Any]) -> str:
    if gate == "sensex_live":
        return "done" if counts["sensex_count"] >= 30 else "open"
    if gate == "sensex_hl_20":
        return "done" if counts["sensex_hand_labeled"] >= 20 else "in_progress"
    if gate == "nifty_queued":
        covered = counts.get("nifty_m2_covered", counts["nifty_queued"])
        return "done" if covered >= counts["nifty_extra_count"] else "open"
    if gate == "nifty_hl_5":
        return "done" if counts["nifty_hand_labeled"] >= 5 else "open"
    if gate == "nifty_hl_all":
        return (
            "done"
            if counts["nifty_hand_labeled"] >= counts["nifty_extra_count"]
            and counts["nifty_extra_count"] > 0
            else "open"
        )
    return "open"


def milestones_payload() -> Dict[str, Any]:
    counts = _counts()
    rows = []
    for m in MILESTONES:
        status = _gate_status(m["gate"], counts)
        rows.append({**m, "status": status})
    done = sum(1 for r in rows if r["status"] == "done")
    return {
        "milestones": rows,
        "counts": counts,
        "nifty_extra_ids": _nifty_ids(),
        "progress": {"done": done, "total": len(rows)},
        "note": (
            "Nifty deep GCI is milestone-gated. Do not claim day-1 Nifty hand labels. "
            "Promote names only after human labeling with real IR sources."
        ),
        "day1_claim": False,
    }


def ensure_nifty_labeling_queue(*, org_id: str = "demo") -> Dict[str, Any]:
    """Enqueue all NIFTY_EXTRA names that are not yet hand_labeled (idempotent)."""
    from app.services import labeling_queue as lq

    counts_before = _counts()
    existing = {
        r.get("company_id")
        for r in (get_data().get("labeling_queue") or [])
        if r.get("status") != "cancelled"
    }
    by_id = {c["id"]: c for c in list_companies()}
    created = []
    for cid, name, ticker, sector in NIFTY_EXTRA:
        if cid in existing:
            continue
        if by_id.get(cid, {}).get("data_quality") == "hand_labeled":
            continue
        item = lq.enqueue(
            company_id=cid,
            org_id=org_id,
            priority="high",
            note=f"Nifty milestone M2 — {ticker} ({sector})",
            requested_by="nifty_milestones",
        )
        created.append(item["id"])
    return {
        "ok": True,
        "enqueued": len(created),
        "item_ids": created,
        "milestones": milestones_payload(),
        "before": counts_before,
    }
