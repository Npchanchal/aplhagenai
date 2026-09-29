"""Weekly email of published GCI moves (plan W9.6).

A move is a ledger row in the window whose level or tier differs from the prior
row for that company. Routine snapshots that change nothing are omitted.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.services import score_ledger


def _stamp_path() -> Path:
    override = os.environ.get("INTELLENS_DATA_DIR", "").strip()
    base = Path(override) if override else score_ledger.LEDGER_PATH.parent
    base.mkdir(parents=True, exist_ok=True)
    return base / "ledger_digest_stamp.json"


def recipients() -> List[str]:
    raw = os.environ.get("INTELLENS_LEDGER_DIGEST_TO", "")
    return [part.strip() for part in raw.split(",") if part.strip()]


def _numbers_differ(left: Any, right: Any) -> bool:
    if left is None and right is None:
        return False
    if left is None or right is None:
        return True
    try:
        return abs(float(left) - float(right)) >= 0.05
    except (TypeError, ValueError):
        return left != right


def _changed(row: Dict[str, Any], prev: Optional[Dict[str, Any]]) -> bool:
    """A move is a different level or tier. A restatement that changes neither is not a move."""
    gci = row.get("gci")
    prior = row.get("prior_gci")
    if prior is None and prev is not None:
        prior = prev.get("gci")
    level_moved = _numbers_differ(gci, prior)
    if prev is None:
        return level_moved
    tier_moved = row.get("confidence_tier") != prev.get("confidence_tier")
    return level_moved or tier_moved


def score_moves(rows: List[Dict[str, Any]], *, since: str) -> List[Dict[str, Any]]:
    """Rows with as_of >= since that publish a different level or tier."""
    latest: Dict[str, Dict[str, Any]] = {}
    out: List[Dict[str, Any]] = []
    for row in rows:
        cid = str(row.get("company_id") or "")
        if not cid:
            continue
        prev = latest.get(cid)
        latest[cid] = row
        as_of = str(row.get("as_of") or "")
        if as_of < since:
            continue
        if not _changed(row, prev):
            continue
        out.append(
            {
                "company_id": cid,
                "gci": row.get("gci"),
                "prior_gci": row.get("prior_gci") if row.get("prior_gci") is not None else (prev or {}).get("gci"),
                "confidence_tier": row.get("confidence_tier"),
                "as_of": as_of,
                "reason": row.get("reason"),
                "algorithm_id": row.get("algorithm_id"),
            }
        )
    return out


def _fmt(value: Any) -> str:
    if isinstance(value, float):
        return f"{value:.1f}"
    if value is None or value == "":
        return "—"
    return str(value)


def _fmt_level(value: Any) -> str:
    if value is None or value == "":
        return "withdrawn"
    return _fmt(value)


def render(moves: List[Dict[str, Any]], *, since: str, until: str) -> Dict[str, str]:
    lines = [
        "CiteAlpha GCI — weekly ledger moves",
        f"Window: {since} to {until}",
        "",
    ]
    if not moves:
        lines.append("No published level or tier changes in this window.")
    else:
        lines.append("Company  GCI  prior  tier  as of  reason")
        for row in moves:
            lines.append(
                "  ".join(
                    [
                        str(row["company_id"]),
                        _fmt_level(row.get("gci")),
                        _fmt_level(row.get("prior_gci")),
                        _fmt(row.get("confidence_tier")),
                        _fmt(row.get("as_of")),
                        _fmt(row.get("reason")),
                    ]
                )
            )
    lines.extend(
        [
            "",
            "Each line is a new ledger row. Earlier rows are not edited.",
            "https://citealpha.com/changelog",
            "Not investment advice.",
        ]
    )
    subject = f"CiteAlpha GCI ledger moves ({until})"
    if not moves:
        subject = f"CiteAlpha GCI ledger — no moves ({until})"
    return {"subject": subject, "body": "\n".join(lines)}


def preview(*, since: Optional[str] = None, rows: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    until = datetime.now(timezone.utc).date().isoformat()
    start = since or (datetime.now(timezone.utc).date() - timedelta(days=7)).isoformat()
    source = rows if rows is not None else score_ledger.read_all()
    moves = score_moves(source, since=start)
    text = render(moves, since=start, until=until)
    return {
        "since": start,
        "until": until,
        "move_count": len(moves),
        "moves": moves,
        "subject": text["subject"],
        "body": text["body"],
        "recipients": recipients(),
    }


def send_weekly(*, force: bool = False, rows: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """Email the last 7 days of ledger moves. Stubs when SMTP is unset."""
    from app.services import mailer

    week = datetime.now(timezone.utc).strftime("%G-W%V")
    stamp = _stamp_path()
    if stamp.exists() and not force:
        try:
            prev = json.loads(stamp.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            prev = {}
        if prev.get("week") == week:
            return {"status": "already_sent", "week": week}

    body = preview(rows=rows)
    to = recipients()
    if not to:
        return {
            "status": "no_recipients",
            "week": week,
            "move_count": body["move_count"],
            "subject": body["subject"],
        }
    results = [
        mailer.send_mail(to=addr, subject=body["subject"], body=body["body"]) for addr in to
    ]
    stamp.write_text(
        json.dumps({"week": week, "sent_at": datetime.now(timezone.utc).isoformat()}),
        encoding="utf-8",
    )
    return {
        "status": "sent",
        "week": week,
        "move_count": body["move_count"],
        "mail": results,
    }
