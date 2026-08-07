"""Phase 5 — audit log for review / ingest / admin actions."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

_PATH = Path(__file__).with_name("audit.json")
_LOG: Optional[List[Dict[str, Any]]] = None


def _load() -> List[Dict[str, Any]]:
    global _LOG
    if _LOG is None:
        if _PATH.exists():
            _LOG = json.loads(_PATH.read_text())
        else:
            _LOG = []
    return _LOG


def save() -> None:
    _PATH.write_text(json.dumps(_load(), indent=2))


def record(
    action: str,
    *,
    org: str = "demo",
    actor: str = "system",
    role: str = "analyst",
    detail: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    row = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "org": org,
        "actor": actor,
        "role": role,
        "detail": detail or {},
    }
    log = _load()
    log.append(row)
    if len(log) > 2000:
        del log[:1000]
    save()
    return row


def list_audit(org: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
    rows = _load()
    if org:
        rows = [r for r in rows if r.get("org") == org]
    return rows[-limit:]
