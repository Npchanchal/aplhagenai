"""Private analyst notes — scoped by actor (API key / session user)."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

_PATH = Path(__file__).resolve().parent.parent / "data" / "analyst_notes.json"


def _load() -> Dict[str, Any]:
    if not _PATH.exists():
        return {"notes": []}
    return json.loads(_PATH.read_text(encoding="utf-8"))


def _save(data: Dict[str, Any]) -> None:
    _PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")


def list_notes(*, actor: str, company_id: Optional[str] = None) -> List[Dict[str, Any]]:
    rows = [n for n in _load().get("notes", []) if n.get("actor") == actor]
    if company_id:
        rows = [n for n in rows if n.get("company_id") == company_id]
    rows.sort(key=lambda n: n.get("updated_at") or "", reverse=True)
    return rows


def upsert_note(
    *,
    actor: str,
    company_id: str,
    body: str,
    note_id: Optional[str] = None,
    title: str = "",
) -> Dict[str, Any]:
    data = _load()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if note_id:
        for n in data["notes"]:
            if n["id"] == note_id and n.get("actor") == actor:
                n["body"] = body
                n["title"] = title or n.get("title") or ""
                n["updated_at"] = now
                _save(data)
                return n
        raise KeyError("note_not_found")
    note = {
        "id": str(uuid.uuid4()),
        "actor": actor,
        "company_id": company_id,
        "title": title or "Insight",
        "body": body,
        "created_at": now,
        "updated_at": now,
        "visibility": "private",
    }
    data.setdefault("notes", []).append(note)
    _save(data)
    return note


def delete_note(*, actor: str, note_id: str) -> bool:
    data = _load()
    before = len(data.get("notes", []))
    data["notes"] = [
        n for n in data.get("notes", []) if not (n.get("id") == note_id and n.get("actor") == actor)
    ]
    if len(data["notes"]) == before:
        return False
    _save(data)
    return True
