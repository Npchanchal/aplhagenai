"""Sensex IR crawl job — on-demand / scheduled ingest into the document store.

Modes:
- dry_run: plan only (no writes)
- live=False: upsert curated catalog digests (CI-safe; hash-deduped)
- live=True: fetch allowlisted IR URLs; fall back to catalog digest on failure

New documents always land as review_status=pending so analysts must accept
before extract→GCI. Pending docs surface via list_alerts (docs_pending_review).
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.data import doc_store
from app.data.ir_sources import sensex_ir_targets

_STATE_PATH = Path(__file__).resolve().parent.parent / "data" / "crawl_state.json"


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_state() -> Dict[str, Any]:
    if _STATE_PATH.exists():
        return json.loads(_STATE_PATH.read_text())
    return {"runs": []}


def save_state(state: Dict[str, Any]) -> None:
    _STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    _STATE_PATH.write_text(json.dumps(state, indent=2))


def pending_document_counts() -> Dict[str, int]:
    counts: Dict[str, int] = {}
    for d in doc_store.list_documents(include_rejected=False):
        if d.get("review_status") != "pending":
            continue
        cid = d["company_id"]
        counts[cid] = counts.get(cid, 0) + 1
    return counts


def run_sensex_ir_crawl(
    *,
    limit: int = 30,
    dry_run: bool = False,
    live: bool = False,
    company_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    from app.services import ingest

    targets = sensex_ir_targets()
    if company_ids:
        wanted = set(company_ids)
        targets = [t for t in targets if t["company_id"] in wanted]
    targets = targets[: max(1, min(limit, 30))]

    results: List[Dict[str, Any]] = []
    fetched = 0
    catalog = 0
    skipped = 0
    failed = 0
    pending_new = 0

    for t in targets:
        row: Dict[str, Any] = {
            "company_id": t["company_id"],
            "ticker": t["ticker"],
            "url": t["url"],
            "action": "planned",
        }
        if dry_run:
            row["action"] = "dry_run"
            results.append(row)
            continue

        before_ids = {
            d["doc_id"]
            for d in doc_store.list_documents(company_id=t["company_id"], include_rejected=True)
        }

        try:
            if live:
                try:
                    doc = ingest.ingest_html_url(
                        t["company_id"], t["url"], title=f"{t['ticker']} IR crawl"
                    )
                    # Force pending for analyst review even if upsert returned existing
                    if doc.get("review_status") != "pending" and doc["doc_id"] not in before_ids:
                        doc_store.set_review_status(doc["doc_id"], "pending")
                        doc["review_status"] = "pending"
                    row["action"] = "live_fetch"
                    row["doc_id"] = doc["doc_id"]
                    row["review_status"] = doc.get("review_status")
                    fetched += 1
                except Exception as exc:  # network / allowlist / empty page
                    doc = doc_store.upsert_document(
                        company_id=t["company_id"],
                        doc_type="filing",
                        title=f"{t['ticker']} IR catalog fallback",
                        text=t["digest"],
                        url=t["url"],
                        date=_now()[:10],
                        source="ir_catalog",
                        review_status="pending",
                    )
                    row["action"] = "catalog_fallback"
                    row["error"] = str(exc)[:200]
                    row["doc_id"] = doc["doc_id"]
                    catalog += 1
            else:
                doc = doc_store.upsert_document(
                    company_id=t["company_id"],
                    doc_type="filing",
                    title=f"{t['ticker']} IR catalog digest",
                    text=t["digest"],
                    url=t["url"],
                    date=_now()[:10],
                    source="ir_catalog",
                    review_status="pending",
                )
                row["action"] = "catalog"
                row["doc_id"] = doc["doc_id"]
                catalog += 1

            if doc["doc_id"] in before_ids:
                row["deduped"] = True
                skipped += 1
            else:
                pending_new += 1
                row["deduped"] = False
        except Exception as exc:
            failed += 1
            row["action"] = "failed"
            row["error"] = str(exc)[:200]

        results.append(row)

    pending_counts = pending_document_counts()
    report: Dict[str, Any] = {
        "ok": True,
        "as_of": _now(),
        "dry_run": dry_run,
        "live": live,
        "targets": len(targets),
        "fetched": fetched,
        "catalog": catalog,
        "skipped_dedupe": skipped,
        "failed": failed,
        "pending_new": pending_new,
        "pending_total": sum(pending_counts.values()),
        "pending_by_company": pending_counts,
        "results": results,
        "note": (
            "New IR docs stay pending until Desk review. "
            "Catalog mode is CI-safe; use live=true for allowlisted HTTP fetch."
        ),
    }

    if not dry_run:
        state = load_state()
        runs = state.get("runs") or []
        runs.append(
            {
                "as_of": report["as_of"],
                "live": live,
                "targets": report["targets"],
                "pending_new": pending_new,
                "pending_total": report["pending_total"],
                "failed": failed,
            }
        )
        state["runs"] = runs[-50:]
        state["last"] = state["runs"][-1]
        save_state(state)

    return report
