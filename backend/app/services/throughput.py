"""Desk extract→review→cite throughput metrics (ops / pilot conversion)."""

from __future__ import annotations

from typing import Any, Dict, List

from app.data.seed import get_data
from app.services import repository


def desk_throughput() -> Dict[str, Any]:
    """Snapshot of Sensex citeable depth and extract/review backlog."""
    companies = repository.list_companies()
    sensex = [c for c in companies if (c.get("index") or "").upper() in ("SENSEX", "BSE30", "")]
    # Prefer market IN + known sensex ids when index field sparse
    if len(sensex) < 10:
        sensex = [
            c
            for c in companies
            if (c.get("market") or "IN") == "IN"
            and c.get("data_quality") in ("hand_labeled", "demo_structured")
        ][:30]

    hand = [c for c in companies if c.get("data_quality") == "hand_labeled"]
    citeable_companies = 0
    citeable_outcomes = 0
    outcomes_total = 0
    missing_source = 0

    for c in hand:
        outs = repository.get_outcomes(c["id"])
        outcomes_total += len(outs)
        co = [o for o in outs if getattr(o, "citeable", None) is True]
        if co:
            citeable_companies += 1
        citeable_outcomes += len(co)
        for o in outs:
            if not (getattr(o, "source_url", None) and getattr(o, "quote_span", None)):
                missing_source += 1

    pending_extracts = repository.list_pending_extracts()
    pending_statements = sum(len(b.get("statements") or []) for b in pending_extracts)

    pending_docs = 0
    try:
        from app.data import doc_store

        pending_docs = sum(
            1
            for d in doc_store.list_documents(include_rejected=False)
            if d.get("review_status") == "pending"
        )
    except Exception:
        pending_docs = 0

    reviews = get_data().get("reviews", []) or []
    labeling = get_data().get("labeling_queue", []) or []
    labeling_open = [
        x for x in labeling if (x.get("status") or "open") in ("open", "queued", "in_progress")
    ]

    cite_pct = (
        round(100.0 * citeable_outcomes / outcomes_total, 1) if outcomes_total else 0.0
    )

    bottlenecks: List[str] = []
    if pending_docs > 0:
        bottlenecks.append(f"{pending_docs} docs awaiting Accept/Reject")
    if pending_extracts:
        bottlenecks.append(f"{len(pending_extracts)} extract batches pending commit")
    if missing_source:
        bottlenecks.append(f"{missing_source} outcomes missing source_url or quote_span")
    if labeling_open:
        bottlenecks.append(f"{len(labeling_open)} labeling queue items open")

    return {
        "universe": {
            "hand_labeled_companies": len(hand),
            "sensex_deep_proxy": len(sensex),
            "citeable_companies": citeable_companies,
            "citeable_outcomes": citeable_outcomes,
            "outcomes_total_hand_labeled": outcomes_total,
            "citeable_pct": cite_pct,
            "missing_source_fields": missing_source,
        },
        "backlog": {
            "pending_extract_batches": len(pending_extracts),
            "pending_extract_statements": pending_statements,
            "pending_docs_review": pending_docs,
            "reviews_logged": len(reviews),
            "labeling_queue_open": len(labeling_open),
        },
        "throughput_hints": {
            "next_actions": [
                "Desk → Review: Accept pending IR/transcript docs",
                "Desk → Corpus: Ensure citations for Sensex hand_labeled",
                "Desk → Labeling: Clear open queue items",
                "Extract → Commit accepted guidance bands",
            ],
            "bottlenecks": bottlenecks or ["No major backlog — deepen quote coverage"],
        },
        "note": (
            "Citeable = hand_labeled + source_url + quote_span. "
            "Throughput is operational; not a sales KPI invented for pilots."
        ),
    }
