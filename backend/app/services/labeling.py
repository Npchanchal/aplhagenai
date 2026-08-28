"""In-product hand-label drafts — never invent actuals; two-person promote."""

from __future__ import annotations

import csv
import io
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import HTTPException

from app.data.metric_catalog import require_metric
from app.data.seed import get_data, save_data

STATUSES = ("draft", "submitted", "accepted", "rejected")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _use_sql() -> bool:
    from app.db.auth_db import use_db_auth

    return use_db_auth()


def _store() -> List[Dict[str, Any]]:
    return get_data().setdefault("label_drafts", [])


def _all_rows() -> List[Dict[str, Any]]:
    if not _use_sql():
        return list(_store())
    from app.db.auth_db import _exec, apply_schema, connect

    apply_schema()
    rows: List[Dict[str, Any]] = []
    with connect() as conn:
        cur = _exec(conn, "SELECT payload FROM intellens_label_drafts")
        for r in cur.fetchall():
            d = dict(r)
            payload = d.get("payload") or "{}"
            if isinstance(payload, str):
                payload = json.loads(payload)
            if isinstance(payload, dict):
                rows.append(payload)
    return rows


def _persist(row: Dict[str, Any]) -> None:
    row["updated_at"] = row.get("updated_at") or _now()
    if not _use_sql():
        store = _store()
        idx = next((i for i, r in enumerate(store) if r.get("id") == row.get("id")), None)
        if idx is None:
            store.append(row)
        else:
            store[idx] = row
        save_data()
        return
    from app.db.auth_db import _exec, apply_schema, connect

    apply_schema()
    with connect() as conn:
        _exec(
            conn,
            """
            INSERT INTO intellens_label_drafts (id, org_id, company_id, status, payload, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s)
            ON CONFLICT(id) DO UPDATE SET
              org_id=excluded.org_id, company_id=excluded.company_id,
              status=excluded.status, payload=excluded.payload, updated_at=excluded.updated_at
            """,
            (
                row["id"],
                row.get("org_id"),
                row.get("company_id"),
                row.get("status"),
                json.dumps(row),
                row.get("updated_at"),
            ),
        )


def clear_sql_store() -> None:
    if not _use_sql():
        return
    from app.db.auth_db import _exec, apply_schema, connect

    apply_schema()
    try:
        with connect() as conn:
            _exec(conn, "DELETE FROM intellens_label_drafts")
    except Exception:
        pass


def queue_companies(limit: int = 40) -> List[Dict[str, Any]]:
    """Names that still need hand labels (demo_structured / thin HL)."""
    from app.services import repository

    rows = []
    for c in repository.list_company_summaries()[:400]:
        q = (c.data_quality or "").lower()
        if q in ("demo_structured", "listing_provisional", "market_scaffold"):
            rows.append(
                {
                    "company_id": c.id,
                    "ticker": c.ticker,
                    "name": c.name,
                    "data_quality": c.data_quality,
                    "gci_score": c.gci_score,
                }
            )
        if len(rows) >= limit:
            break
    return rows


def list_drafts(
    *,
    org_id: Optional[str] = None,
    company_id: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    rows = list(_all_rows())
    if org_id:
        rows = [r for r in rows if r.get("org_id") == org_id]
    if company_id:
        rows = [r for r in rows if r.get("company_id") == company_id]
    if status:
        rows = [r for r in rows if r.get("status") == status]
    return sorted(rows, key=lambda r: r.get("updated_at") or r.get("created_at") or "", reverse=True)


def audit_recent(*, org_id: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
    """Who labeled / reviewed — ids only, no emails or quotes."""
    rows = list_drafts(org_id=org_id)
    out = []
    for r in rows[: max(0, int(limit))]:
        out.append(
            {
                "id": r.get("id"),
                "company_id": r.get("company_id"),
                "period": r.get("period"),
                "metric": r.get("metric"),
                "status": r.get("status"),
                "submitter_id": r.get("submitter_id"),
                "reviewer_id": r.get("reviewer_id"),
                "updated_at": r.get("updated_at") or r.get("created_at"),
            }
        )
    return out


def audit_summary(*, org_id: Optional[str] = None) -> Dict[str, Any]:
    rows = list_drafts(org_id=org_id)
    accepted = [r for r in rows if r.get("status") == "accepted"]
    submitted = [r for r in rows if r.get("status") == "submitted"]
    return {
        "two_person_review": True,
        "drafts": len(rows),
        "submitted": len(submitted),
        "accepted": len(accepted),
        "note": (
            "Promotion to hand_labeled requires source_url + quote_span and a different reviewer "
            "(admin/owner may self-accept). Does not invent actuals."
        ),
        "recent": audit_recent(org_id=org_id, limit=12),
    }


def _validate_row(body: Dict[str, Any], *, require_cite: bool) -> Dict[str, Any]:
    company_id = str(body.get("company_id") or "").strip()
    if not company_id:
        raise HTTPException(status_code=400, detail="company_id required")
    try:
        metric = require_metric(str(body.get("metric") or "revenue_growth_pct"), allow_custom=False)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    quote = (body.get("quote_span") or "").strip()
    url = (body.get("source_url") or "").strip()
    if require_cite and (not quote or not url):
        raise HTTPException(
            status_code=400,
            detail="source_url and quote_span are required — never invent actuals or quotes",
        )
    low = body.get("guided_low")
    high = body.get("guided_high")
    gv = body.get("guided_value")
    if gv is None and low is not None and high is not None:
        try:
            gv = (float(low) + float(high)) / 2.0
        except (TypeError, ValueError):
            gv = None
    actual = body.get("actual_value")
    if actual is not None:
        try:
            actual = float(actual)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="actual_value must be numeric or empty")
    return {
        "company_id": company_id,
        "ticker": (body.get("ticker") or "").strip() or None,
        "period": str(body.get("period") or "").strip() or "FY",
        "metric": metric,
        "guided_low": None if low in (None, "") else float(low),
        "guided_high": None if high in (None, "") else float(high),
        "guided_value": None if gv in (None, "") else float(gv),
        "actual_value": actual,
        "dropped": bool(body.get("dropped")),
        "guided_text": (body.get("guided_text") or "").strip(),
        "quote_span": quote or None,
        "source_url": url or None,
        "source_ref": (body.get("source_ref") or "").strip() or None,
        "source_type": (body.get("source_type") or "ir_html").strip(),
        "as_of": (body.get("as_of") or "").strip() or None,
        "speaker": (body.get("speaker") or "").strip() or None,
        "thread_id": (body.get("thread_id") or "").strip() or None,
        "confidence": float(body.get("confidence") or 0.85),
        "notes": (body.get("notes") or "").strip() or None,
    }


def create_draft(*, body: Dict[str, Any], actor: Dict[str, Any]) -> Dict[str, Any]:
    fields = _validate_row(body, require_cite=False)
    row = {
        "id": f"ld_{uuid4().hex[:12]}",
        "status": "draft",
        "org_id": actor.get("org_id") or actor.get("org") or "demo",
        "submitter_id": actor.get("user_id") or actor.get("key") or "api",
        "reviewer_id": None,
        "created_at": _now(),
        "updated_at": _now(),
        **fields,
    }
    _persist(row)
    return row


def get_draft(draft_id: str) -> Dict[str, Any]:
    for r in _all_rows():
        if r.get("id") == draft_id:
            return r
    raise HTTPException(status_code=404, detail="Draft not found")


def submit_draft(draft_id: str, *, actor: Dict[str, Any]) -> Dict[str, Any]:
    row = get_draft(draft_id)
    _validate_row(row, require_cite=True)
    row["status"] = "submitted"
    row["submitter_id"] = actor.get("user_id") or row.get("submitter_id")
    row["updated_at"] = _now()
    _persist(row)
    return row


def reject_draft(draft_id: str, *, actor: Dict[str, Any], comment: Optional[str] = None) -> Dict[str, Any]:
    row = get_draft(draft_id)
    if row.get("status") not in ("submitted", "draft"):
        raise HTTPException(status_code=400, detail="Draft is not pending review")
    row["status"] = "rejected"
    row["reviewer_id"] = actor.get("user_id") or actor.get("key")
    row["review_comment"] = comment
    row["updated_at"] = _now()
    _persist(row)
    return row


def accept_draft(draft_id: str, *, actor: Dict[str, Any]) -> Dict[str, Any]:
    """Two-person rule: submitter ≠ accepter unless admin/owner."""
    from app.services.citation_corpus import ensure_company_citation_corpus
    from app.services import repository

    row = get_draft(draft_id)
    if row.get("status") != "submitted":
        raise HTTPException(status_code=400, detail="Submit the draft before accept")
    fields = _validate_row(row, require_cite=True)
    actor_id = str(actor.get("user_id") or actor.get("key") or "")
    submitter = str(row.get("submitter_id") or "")
    role = str(actor.get("role") or "")
    if actor_id and submitter and actor_id == submitter and role not in ("admin", "owner"):
        raise HTTPException(
            status_code=403,
            detail="Two-person rule: a different reviewer must accept this label",
        )
    outcome = {
        "period": fields["period"],
        "metric": fields["metric"],
        "guided_low": fields["guided_low"],
        "guided_high": fields["guided_high"],
        "guided_value": fields["guided_value"],
        "actual_value": fields["actual_value"],
        "dropped": fields["dropped"],
        "guided_text": fields["guided_text"],
        "quote_span": fields["quote_span"],
        "source_url": fields["source_url"],
        "source_ref": fields["source_ref"],
        "as_of": fields["as_of"],
        "speaker": fields["speaker"],
        "thread_id": fields["thread_id"] or f"{fields['company_id']}-{fields['metric']}",
        "confidence": fields["confidence"],
        "review_status": "accept",
    }
    repository.merge_matched(fields["company_id"], [outcome])
    _maybe_promote_quality(fields["company_id"])
    try:
        ensure_company_citation_corpus(fields["company_id"])
    except Exception:
        pass
    row["status"] = "accepted"
    row["reviewer_id"] = actor.get("user_id") or actor.get("key")
    row["updated_at"] = _now()
    _persist(row)
    return row


def _maybe_promote_quality(company_id: str) -> None:
    """Promote demo_structured → hand_labeled only when citeable rows exist."""
    data = get_data()
    company = next((c for c in data.get("companies") or [] if c.get("id") == company_id), None)
    if not company:
        return
    q = (company.get("data_quality") or "").lower()
    if q == "hand_labeled":
        return
    if q not in ("demo_structured", "listing_provisional"):
        return
    rows = data.get("outcomes", {}).get(company_id) or []
    citeable = [
        o
        for o in rows
        if (o.get("source_url") or "").strip() and (o.get("quote_span") or "").strip()
    ]
    if len(citeable) < 1:
        return
    # listing_provisional: only after real sourced outcomes, not a naked flag flip
    company["data_quality"] = "hand_labeled"
    save_data()


def import_csv(text: str, *, actor: Dict[str, Any]) -> Dict[str, Any]:
    reader = csv.DictReader(io.StringIO(text))
    created = []
    errors = []
    for i, raw in enumerate(reader, start=2):
        try:
            created.append(create_draft(body=raw, actor=actor))
        except HTTPException as e:
            errors.append({"line": i, "detail": e.detail})
    return {"ok": True, "created": len(created), "drafts": created, "errors": errors}
