"""Phase 0 — product analytics (log-only stub)."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

logger = logging.getLogger("intellens.analytics")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

_EVENTS: list[Dict[str, Any]] = []


def track(event: str, props: Optional[Dict[str, Any]] = None) -> None:
    row = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "event": event,
        "props": props or {},
    }
    _EVENTS.append(row)
    if len(_EVENTS) > 500:
        del _EVENTS[:250]
    logger.info("ANALYTICS %s", json.dumps(row, default=str))


def recent_events(limit: int = 50) -> list[Dict[str, Any]]:
    return list(_EVENTS[-limit:])
