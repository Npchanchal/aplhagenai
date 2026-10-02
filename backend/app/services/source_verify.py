"""Verify that citeable quote_span text appears on an official source URL."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from app.services.ingest import _TextExtractor

_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def normalize_text(text: str) -> str:
    t = (text or "").lower()
    t = t.replace("\u2013", "-").replace("\u2014", "-").replace("\u2019", "'")
    t = re.sub(r"[\s\u00a0]+", " ", t)
    return t.strip()


def _loose_pdf_text(data: bytes) -> str:
    """Extract text from PDF bytes (pypdf when available, else heuristic)."""
    try:
        from io import BytesIO

        from pypdf import PdfReader

        reader = PdfReader(BytesIO(data))
        parts: list[str] = []
        for page in reader.pages:
            parts.append(page.extract_text() or "")
        joined = "\n".join(parts).strip()
        if joined:
            return joined
    except Exception:
        pass
    chunks: list[str] = []
    for m in re.finditer(rb"\(([^()\\]{4,200})\)", data):
        try:
            chunks.append(m.group(1).decode("latin-1", errors="ignore"))
        except Exception:
            continue
    return " ".join(chunks)


def fetch_source_text(url: str, *, timeout: int = 20) -> str:
    href = (url or "").strip()
    if not href:
        return ""
    req = Request(
        href,
        headers={"User-Agent": _UA, "Accept": "text/html,application/pdf,*/*"},
    )
    with urlopen(req, timeout=timeout) as resp:  # noqa: S310 — allowlist + verify only
        raw = resp.read()
        ctype = (resp.headers.get("Content-Type") or "").lower()
    path = urlparse(href).path.lower()
    q = urlparse(href).query.lower()
    is_pdf = (
        path.endswith(".pdf")
        or ".pdf?" in href.lower()
        or "fmt=pdf" in q
        or "application/pdf" in ctype
    )
    if is_pdf:
        return _loose_pdf_text(raw)
    html = raw.decode("utf-8", errors="ignore")
    parser = _TextExtractor()
    parser.feed(html)
    return parser.text()


def quote_in_text(quote: Optional[str], text: str) -> bool:
    q = normalize_text(quote or "")
    body = normalize_text(text)
    if not q or not body:
        return False
    if q in body:
        return True
    short = q[:40]
    if len(short) >= 12 and short in body:
        return True
    # tolerate minor punctuation / percent spacing drift
    q2 = re.sub(r"[^a-z0-9%.,$-]+", "", q)
    b2 = re.sub(r"[^a-z0-9%.,$-]+", "", body)
    return bool(q2 and len(q2) >= 12 and q2 in b2)


def verify_source_binding(source_url: Optional[str], quote_span: Optional[str]) -> Optional[bool]:
    """Return True/False when quote presence is known; None if fetch/extract failed."""
    url = (source_url or "").strip()
    quote = (quote_span or "").strip()
    if not url or not quote:
        return False
    try:
        text = fetch_source_text(url)
    except Exception:
        return None
    if not normalize_text(text):
        return None
    return quote_in_text(quote, text)


# HTML press pages whose body does not contain the recorded quote on fetch (W2.7).
# Excluded from citeable until a later fetch finds the quote on the filing.
KNOWN_UNVERIFIED: tuple[tuple[str, str, str], ...] = (
    ("hcltech", "FY26", "revenue_growth_cc_pct"),
    ("maruti", "FY25", "wholesale_volume_growth_pct"),
    ("jswsteel", "FY25", "revenue_growth_pct"),
    ("grasim", "FY25", "underlying_volume_growth_pct"),
)

REPORT_PATH = Path(__file__).resolve().parent.parent / "data" / "source_verify_report.json"

#: Crawl these numeric guiders before the rest of the universe. Nobody types the rows.
CRAWL_FIRST: tuple[str, ...] = (
    "infy",
    "wipro",
    "hcltech",
    "sbin",
    "bajajfinance",
    "tatamotors",
    "lt",
    "titan",
)
VERIFIER_ID = "verifier:source_check"


def iter_source_bindings() -> List[Dict[str, Any]]:
    """Every actual + guidance URL/quote pair on hand-labeled outcomes."""
    from app.data.seed import get_data, list_companies

    quality = {c["id"]: c.get("data_quality") for c in list_companies()}
    out: List[Dict[str, Any]] = []
    for cid, rows in (get_data().get("outcomes") or {}).items():
        if quality.get(cid) != "hand_labeled":
            continue
        for row in rows or []:
            period = str(row.get("period") or "")
            metric = str(row.get("metric") or "")
            url = (row.get("source_url") or "").strip()
            quote = (row.get("quote_span") or "").strip()
            if url and quote:
                out.append(
                    {
                        "company_id": cid,
                        "period": period,
                        "metric": metric,
                        "kind": "actual",
                        "url": url,
                        "quote": quote,
                    }
                )
            gurl = (row.get("guidance_source_url") or "").strip()
            gquote = (row.get("guidance_quote") or "").strip()
            if gurl and gquote:
                out.append(
                    {
                        "company_id": cid,
                        "period": period,
                        "metric": metric,
                        "kind": "guidance",
                        "url": gurl,
                        "quote": gquote,
                    }
                )
    order = {cid: i for i, cid in enumerate(CRAWL_FIRST)}
    tail = len(CRAWL_FIRST)
    out.sort(
        key=lambda b: (
            order.get(b["company_id"], tail),
            b["company_id"],
            b["period"],
            b["metric"],
            0 if b["kind"] == "guidance" else 1,
        )
    )
    return out


def load_report() -> Dict[str, Any]:
    if not REPORT_PATH.exists():
        return {
            "as_of": None,
            "checked": 0,
            "verified": 0,
            "failed": 0,
            "fetch_failed": 0,
            "failures": [],
            "note": "Verification job has not run yet. python -m app.jobs.verify_sources",
        }
    try:
        return json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {
            "as_of": None,
            "checked": 0,
            "verified": 0,
            "failed": 0,
            "fetch_failed": 0,
            "failures": [],
            "note": "Verification report unreadable.",
        }


def save_report(report: Dict[str, Any]) -> None:
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


def _mark_unverified(company_id: str, period: str, metric: str, kind: str) -> None:
    from app.data.seed import get_data, save_data

    data = get_data()
    changed = False
    for row in data.get("outcomes", {}).get(company_id) or []:
        if str(row.get("period") or "") == period and str(row.get("metric") or "") == metric:
            row["citeable"] = False
            row["source_verified"] = False
            row["source_verify_fail"] = kind
            changed = True
    if changed:
        save_data()


def _stamp_verified(passed: set[tuple[str, str, str]], failed: set[tuple[str, str, str]]) -> None:
    """Stamp rows whose quotes all matched. A failed quote drops the row; nothing is queued."""
    from datetime import datetime, timezone

    from app.data.seed import get_data, save_data

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    data = get_data()
    changed = False
    for cid, rows in (data.get("outcomes") or {}).items():
        for row in rows or []:
            key = (cid, str(row.get("period") or ""), str(row.get("metric") or ""))
            if key in failed or key not in passed:
                continue
            row["reviewed_by"] = VERIFIER_ID
            row["reviewed_at"] = today
            row["source_verified"] = True
            row.pop("source_verify_fail", None)
            changed = True
    if changed:
        save_data()


def verify_all_bindings(
    *,
    write: bool = False,
    limit: Optional[int] = None,
    verify_fn=None,
) -> Dict[str, Any]:
    """Check every hand-labeled source URL for quote presence.

    ``verify_fn(url, quote) -> True | False | None`` (None = fetch failed).
    """
    from datetime import datetime, timezone

    fn = verify_fn or verify_source_binding
    bindings = iter_source_bindings()
    if limit is not None and limit > 0:
        bindings = bindings[:limit]
    verified = 0
    failed = 0
    fetch_failed = 0
    failures: List[Dict[str, Any]] = []
    row_state: Dict[tuple, Dict[str, int]] = {}
    for b in bindings:
        key = (b["company_id"], b["period"], b["metric"])
        state = row_state.setdefault(key, {"pass": 0, "fail": 0, "unknown": 0})
        result = fn(b["url"], b["quote"])
        if result is True:
            verified += 1
            state["pass"] += 1
            continue
        if result is None:
            fetch_failed += 1
            state["unknown"] += 1
            continue
        failed += 1
        state["fail"] += 1
        failures.append(
            {
                "company_id": b["company_id"],
                "period": b["period"],
                "metric": b["metric"],
                "kind": b["kind"],
                "url": b["url"],
            }
        )
        if write:
            _mark_unverified(b["company_id"], b["period"], b["metric"], b["kind"])
    if write:
        passed = {
            key
            for key, state in row_state.items()
            if state["pass"] and not state["fail"] and not state["unknown"]
        }
        failed_keys = {key for key, state in row_state.items() if state["fail"]}
        _stamp_verified(passed, failed_keys)
    report = {
        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "checked": len(bindings),
        "verified": verified,
        "failed": failed,
        "fetch_failed": fetch_failed,
        "failures": failures[:50],
        "note": (
            "A link is verified when the recorded quote appears on the filing. "
            "A missing quote drops the row from the score. Nothing is queued for a person. "
            "Fetch failures are retried on the next run."
        ),
    }
    save_report(report)
    return report


def report_stale(*, max_age_hours: float = 24.0) -> bool:
    from datetime import datetime, timezone

    raw = load_report().get("as_of")
    if not raw:
        return True
    try:
        as_of = datetime.strptime(str(raw).replace("Z", ""), "%Y-%m-%dT%H:%M:%S")
        as_of = as_of.replace(tzinfo=timezone.utc)
    except ValueError:
        return True
    age = (datetime.now(timezone.utc) - as_of).total_seconds() / 3600.0
    return age >= max_age_hours


def maybe_run_nightly_verify(*, write: bool = True, live: bool = False) -> Optional[Dict[str, Any]]:
    """Used by the 6h refresh loop: run at most once per 24h when enabled and live."""
    import os

    if not live:
        return None
    raw = (os.environ.get("INTELLENS_VERIFY_SOURCES") or "").strip().lower()
    if raw not in ("1", "true", "yes", "on"):
        return None
    if not report_stale():
        return None
    return verify_all_bindings(write=write)
