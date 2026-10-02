"""Find guidance documents by walking an issuer's own website, AI choosing the links.

The model sees only numbered links taken from pages we fetched on hosts allowed
for that issuer, and answers with numbers. It cannot add a URL, and nothing it
writes becomes a quote: each document it picks is fetched, extracted and bound
like any filing. Sites that refuse our bot user agent are left alone.
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from typing import Any, Callable, Dict, List, Optional, Set, Tuple
from urllib.parse import urldefrag, urljoin, urlparse

from app.services.exchange_filings import (
    ISSUER_HOSTS,
    classify_announcement,
    discovery_months,
    fetch_bytes,
    host_allowed,
)

MAX_PAGES = 8
MAX_DEPTH = 3
MAX_LINKS_IN_PROMPT = 250
MAX_PAGES_PER_STEP = 3
GUIDANCE_KINDS = ("concall", "presentation", "annual_report", "agm")

_LINK_CUES = (
    "investor", "result", "transcript", "call", "presentation", "annual", "report",
    "agm", "general meeting", "financial", "quarter", "earnings", "shareholder",
    "disclosure", "fy2", "q1", "q2", "q3", "q4", ".pdf",
)

_LEDGER: Optional[Dict[str, Any]] = None


def ir_crawl_enabled() -> bool:
    return os.environ.get("INTELLENS_IR_CRAWL_DISCOVERY", "").strip().lower() in ("1", "true", "yes")


def ir_crawl_daily_cap() -> int:
    return int(os.environ.get("INTELLENS_IR_CRAWL_DAILY_CAP", "60"))


def ir_crawl_refresh_days() -> int:
    return int(os.environ.get("INTELLENS_IR_CRAWL_REFRESH_DAYS", "30"))


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _ledger_path() -> Optional[str]:
    root = os.environ.get("INTELLENS_DATA_DIR", "").strip()
    return os.path.join(root, "ir_crawl_ledger.json") if root else None


def _ledger() -> Dict[str, Any]:
    global _LEDGER
    if _LEDGER is None:
        _LEDGER = {"day": _today(), "used": 0, "last": {}}
        path = _ledger_path()
        if path and os.path.exists(path):
            try:
                with open(path, encoding="utf-8") as fh:
                    _LEDGER.update(json.load(fh))
            except (OSError, json.JSONDecodeError):
                pass
    if _LEDGER.get("day") != _today():
        _LEDGER["day"] = _today()
        _LEDGER["used"] = 0
    return _LEDGER


def _save_ledger() -> None:
    path = _ledger_path()
    if not path or _LEDGER is None:
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(_LEDGER, fh)
    os.replace(tmp, path)


def reset_ir_crawl() -> None:
    global _LEDGER
    _LEDGER = None


def _due(company_id: str) -> bool:
    ledger = _ledger()
    if int(ledger["used"]) >= ir_crawl_daily_cap():
        return False
    last = (ledger.get("last") or {}).get(company_id)
    if not last:
        return True
    try:
        age = datetime.now(timezone.utc) - datetime.strptime(last, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return True
    return age.days >= ir_crawl_refresh_days()


class _Links(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: List[Tuple[str, str]] = []
        self._href: Optional[str] = None
        self._label = ""
        self._text: List[str] = []

    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]) -> None:
        if tag != "a":
            return
        a = dict(attrs)
        self._href = a.get("href")
        self._label = a.get("title") or a.get("aria-label") or ""
        self._text = []

    def handle_data(self, data: str) -> None:
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "a" and self._href is not None:
            text = " ".join(" ".join(self._text).split()) or self._label
            self.links.append((self._href, text[:160]))
            self._href = None


def page_links(html: str, base_url: str, company_id: str) -> List[Dict[str, str]]:
    """Links on a page that stay on hosts allowed for this issuer."""
    parser = _Links()
    try:
        parser.feed(html)
    except Exception:  # noqa: BLE001 — a malformed page yields what parsed
        pass
    out: List[Dict[str, str]] = []
    seen: Set[str] = set()
    for href, text in parser.links:
        href = (href or "").strip()
        if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
            continue
        url = urldefrag(urljoin(base_url, href))[0]
        if url in seen or not url.startswith(("http://", "https://")) or not host_allowed(url, company_id):
            continue
        seen.add(url)
        out.append({"url": url, "text": text})
    return out


def _shortlist(links: List[Dict[str, str]]) -> List[Dict[str, str]]:
    if len(links) <= MAX_LINKS_IN_PROMPT:
        return links

    def score(link: Dict[str, str]) -> int:
        blob = f"{link['text']} {link['url']}".lower()
        return sum(1 for c in _LINK_CUES if c in blob)

    ranked = sorted(range(len(links)), key=lambda i: -score(links[i]))[:MAX_LINKS_IN_PROMPT]
    return [links[i] for i in sorted(ranked)]


_CHOOSER_PROMPT = """You are navigating a listed Indian company's own website to find documents in which management gives forward guidance.
You are given numbered links from one page. Choose only from these numbers; never write a URL.
Return ONLY JSON: {"documents": [{"n": <number>, "kind": "concall|presentation|annual_report|agm"}], "pages": [<number>, ...]}
documents: links that are themselves such a document (earnings call transcript, investor presentation, annual report, AGM transcript or chairman's speech), from the last {months} months.
pages: up to 3 links to pages likely to list such documents (investor relations, financial results, transcripts, annual reports, shareholder meetings). Prefer pages not yet visited.
Use empty lists when nothing fits. No markdown fences."""


def _llm_choose(company: str, page_url: str, links: List[Dict[str, str]]) -> Dict[str, Any]:
    from app.services import llm_client

    lines = "\n".join(f"{i}. {l['text'] or '-'} | {l['url']}" for i, l in enumerate(links))
    raw = llm_client.chat_completion(
        [
            {"role": "system", "content": _CHOOSER_PROMPT.replace("{months}", str(discovery_months()))},
            {"role": "user", "content": f"Company: {company}. Today: {_today()}. Page: {page_url}\nLinks:\n{lines}"},
        ],
        max_tokens=800,
    )
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip())
    parsed = json.loads(cleaned)
    return parsed if isinstance(parsed, dict) else {}


_IR_PAGE_CUES = ("investor relation", "investors", "financial result", "financial performance",
                 "annual report", "shareholder", "earnings")
_NOT_IR_PAGE = ("charter", "grievance", "contact", "complaint", "unclaimed", "kyc", "dividend")


def _looks_like_ir_page(words: str) -> bool:
    low = words.lower()
    return any(c in low for c in _IR_PAGE_CUES) and not any(c in low for c in _NOT_IR_PAGE)


def _keyword_choose(company: str, page_url: str, links: List[Dict[str, str]]) -> Dict[str, Any]:
    docs, pages = [], []
    for i, link in enumerate(links):
        path = urlparse(link["url"]).path
        words = re.sub(r"[-_/.%]+", " ", f"{link['text']} {path}")
        kind = classify_announcement(words)
        if kind in GUIDANCE_KINDS and path.lower().endswith(".pdf"):
            docs.append({"n": i, "kind": kind})
        elif _looks_like_ir_page(words) and len(pages) < MAX_PAGES_PER_STEP:
            pages.append(i)
    return {"documents": docs, "pages": pages}


def _default_chooser() -> Callable[[str, str, List[Dict[str, str]]], Dict[str, Any]]:
    from app.services import llm_client
    from app.services.extract_pipeline import _llm_budget_ok, note_llm_use

    def choose(company: str, page_url: str, links: List[Dict[str, str]]) -> Dict[str, Any]:
        if llm_client.llm_configured() and _llm_budget_ok():
            note_llm_use()
            try:
                return _llm_choose(company, page_url, links)
            except Exception:  # noqa: BLE001 — fall back to keywords for this page
                pass
        return _keyword_choose(company, page_url, links)

    return choose


def start_urls(company_id: str) -> List[str]:
    """Curated investor page first; homepages often refuse bots that the IR page serves."""
    from app.data.ir_sources import target_for

    homes = [f"https://www.{d}/" for d, cid in ISSUER_HOSTS.items() if cid == company_id]
    if not homes:
        return []
    target = target_for(company_id)
    curated = [target["url"]] if target and host_allowed(target["url"], company_id) else []
    guessed = [] if curated else [homes[0] + "investors/"]
    return curated + homes + guessed


# Transcripts carry the most guidance; presentations restate it in tables.
_CRAWL_RANK = {"concall": 0, "presentation": 1, "agm": 2, "annual_report": 3}
PER_KIND_CAP = 3
_YEAR_RE = re.compile(r"(?:fy\s?|20)(\d{2})(?!\d)", re.I)
_SPAN_RE = re.compile(r"(?<!\d)(?:20)?(\d{2})\s*[-–/_]\s*(\d{2})(?!\d)")


def latest_year(text: str) -> Optional[int]:
    """Latest year a title or URL names (FY26, 2025-26, 07-08, 4qfy26), as a four-digit year."""
    text = text or ""
    found = [int(m) for m in _YEAR_RE.findall(text)]
    found += [int(b) for a, b in _SPAN_RE.findall(text) if (int(a) + 1) % 100 == int(b)]
    years = [2000 + y for y in found if y <= 60]
    return max(years) if years else None


# Regional-language copies of the same investor page waste the page budget.
_LANG_SEGMENTS = {"hindi", "marathi", "gujarati", "tamil", "telugu", "kannada", "malayalam",
                  "bengali", "punjabi", "odia", "hi", "mr", "gu", "ta", "te", "kn", "ml", "bn"}


def _is_language_copy(url: str) -> bool:
    return any(seg.lower() in _LANG_SEGMENTS for seg in urlparse(url).path.split("/") if seg)


def discover_from_issuer_site(
    company_id: str,
    *,
    max_docs: int = 8,
    fetch: Optional[Callable[[str], bytes]] = None,
    choose: Optional[Callable[[str, str, List[Dict[str, str]]], Dict[str, Any]]] = None,
    company_name: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Guidance documents linked from the issuer's site, best first, undated."""
    starts = start_urls(company_id)
    if not starts:
        return []
    if fetch is None:
        if not ir_crawl_enabled() or not _due(company_id):
            return []
        fetch = lambda url: fetch_bytes(url, company_id)  # noqa: E731
        ledger = _ledger()
        ledger["used"] = int(ledger["used"]) + 1
        _save_ledger()
    if choose is None:
        choose = _default_chooser()
    if company_name is None:
        from app.services.exchange_filings import _listing_row

        company_name = (_listing_row(company_id) or {}).get("name") or company_id
    queue: List[Tuple[str, int]] = [(u, 0) for u in starts]
    visited: Set[str] = set()
    docs: Dict[str, Dict[str, Any]] = {}
    fetched_any = False
    while queue and len(visited) < MAX_PAGES:
        url, depth = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)
        try:
            payload = fetch(url)
        except Exception:  # noqa: BLE001 — a refused or broken page ends this branch
            continue
        if payload.lstrip()[:5] == b"%PDF-":
            continue
        fetched_any = True
        links = _shortlist(page_links(payload.decode("utf-8", errors="ignore"), url, company_id))
        if not links:
            continue
        try:
            picked = choose(company_name, url, links)
        except Exception:  # noqa: BLE001
            continue
        for doc in picked.get("documents") or []:
            n, kind = doc.get("n"), doc.get("kind")
            if not isinstance(n, int) or not 0 <= n < len(links) or kind not in GUIDANCE_KINDS:
                continue
            link = links[n]
            docs.setdefault(
                link["url"],
                {
                    "url": link["url"],
                    "category": kind,
                    "title": (link["text"] or urlparse(link["url"]).path.rsplit("/", 1)[-1])[:200],
                    "date": None,
                    "rank": _CRAWL_RANK.get(kind, 9),
                    "year": latest_year(f"{link['text']} {link['url']}"),
                    "found_by": "ir_crawl",
                },
            )
        if depth + 1 >= MAX_DEPTH:
            continue
        for n in (picked.get("pages") or [])[:MAX_PAGES_PER_STEP]:
            if (
                isinstance(n, int)
                and 0 <= n < len(links)
                and links[n]["url"] not in visited
                and not _is_language_copy(links[n]["url"])
            ):
                queue.append((links[n]["url"], depth + 1))
    if fetched_any and _LEDGER is not None:
        _ledger().setdefault("last", {})[company_id] = _today()
        _save_ledger()
    return rank_documents(list(docs.values()), max_docs=max_docs)


def rank_documents(docs: List[Dict[str, Any]], *, max_docs: int = 8) -> List[Dict[str, Any]]:
    """Transcripts first, newest first, at most PER_KIND_CAP of a kind; drop named-stale years."""
    oldest = datetime.now(timezone.utc).year - (discovery_months() + 11) // 12
    fresh = [d for d in docs if d.get("year") is None or d["year"] >= oldest]
    fresh.sort(key=lambda d: (d["rank"], -(d.get("year") or 0)))
    out: List[Dict[str, Any]] = []
    per_kind: Dict[str, int] = {}
    for d in fresh:
        if per_kind.get(d["category"], 0) >= PER_KIND_CAP:
            continue
        per_kind[d["category"]] = per_kind.get(d["category"], 0) + 1
        out.append(d)
    return out[:max_docs]
