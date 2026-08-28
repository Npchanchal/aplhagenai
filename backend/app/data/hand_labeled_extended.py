"""Phase 1 — remaining Sensex names with verified official source bindings only.

Synthetic IR-curated placeholders are not citeable. Rows come from
``verified_sensex_sources.VERIFIED_SENSEX_SOURCES`` after analyst/URL checks.
"""

from __future__ import annotations

from typing import Any, Dict, List, Sequence, Tuple

from app.data.verified_sensex_sources import VERIFIED_SENSEX_SOURCES


def _finalize_row(row: Dict[str, Any], *, company_id: str, ticker: str) -> Dict[str, Any]:
    r = dict(row)
    if r.get("guided_value") is None:
        lo, hi = r.get("guided_low"), r.get("guided_high")
        if lo is not None and hi is not None:
            r["guided_value"] = round((float(lo) + float(hi)) / 2, 2)
        elif r.get("actual_value") is not None:
            r["guided_value"] = float(r["actual_value"])
        else:
            r["guided_value"] = 0.0
    if r.get("confidence") is None:
        r["confidence"] = 0.9
    if not r.get("thread_id"):
        r["thread_id"] = f"{company_id}-{r.get('metric', 'guidance')}"
    if r.get("dropped") is None:
        r["dropped"] = False
    _ = ticker
    return r


def build_remaining_hand_labeled(
    sensex: Sequence[Tuple[str, str, str, str]],
    existing_ids: set[str],
) -> Dict[str, List[Dict[str, Any]]]:
    out: Dict[str, List[Dict[str, Any]]] = {}
    for cid, _name, ticker, _sector in sensex:
        if cid in existing_ids:
            continue
        rows = VERIFIED_SENSEX_SOURCES.get(cid)
        if rows:
            out[cid] = [_finalize_row(r, company_id=cid, ticker=ticker) for r in rows]
    return out
