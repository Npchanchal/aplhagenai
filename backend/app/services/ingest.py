"""Phase 2 — ingest adapters: paste, plain text (PDF-extracted), allowlisted HTML."""

from __future__ import annotations

import re
from html.parser import HTMLParser
from typing import Any, Dict, Optional, Set
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from app.data import doc_store

# IR / exchange hosts only
ALLOWLIST_HOSTS: Set[str] = {
    "www.infosys.com",
    "www.tcs.com",
    "www.bseindia.com",
    "www.nseindia.com",
    "www.hul.co.in",
    "www.marutisuzuki.com",
    "www.itcportal.com",
    "itcportal.com",
    "www.ril.com",
    "www.wipro.com",
    "www.hcltech.com",
    "www.hdfcbank.com",
    "www.hdfc.bank.in",
    "hdfc.bank.in",
    "www.icicibank.com",
    "www.icici.bank.in",
    "icici.bank.in",
    "www.sbi.co.in",
    "sbi.co.in",
    "www.tatamotors.com",
    "www.tatasteel.com",
    "www.techmahindra.com",
    "insights.techmahindra.com",
    "www.drreddys.com",
    "www.sunpharma.com",
    "sunpharma.com",
    "www.airtel.in",
    "assets.airtel.in",
    "www.asianpaints.com",
    "www.bajajfinserv.in",
    "cms-assets.bajajfinserv.in",
    "www.nestle.in",
    "www.ntpc.co.in",
    "ntpc.co.in",
    "www.powergrid.in",
    "www.larsentoubro.com",
    "www.mahindra.com",
    "www.kotak.com",
    "www.jsw.in",
    "www.axisbank.com",
    "www.axis.bank.in",
    "axis.bank.in",
    "www.indusind.com",
    "www.titancompany.in",
    "www.kotak.com",
}


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._chunks: list[str] = []
        self._skip = False

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag in ("script", "style", "noscript"):
            self._skip = True

    def handle_endtag(self, tag: str) -> None:
        if tag in ("script", "style", "noscript"):
            self._skip = False

    def handle_data(self, data: str) -> None:
        if not self._skip:
            t = data.strip()
            if t:
                self._chunks.append(t)

    def text(self) -> str:
        return "\n".join(self._chunks)


def ingest_paste(
    company_id: str,
    text: str,
    *,
    title: str = "Pasted transcript",
    doc_type: str = "transcript",
) -> Dict[str, Any]:
    return doc_store.upsert_document(
        company_id=company_id,
        doc_type=doc_type,
        title=title,
        text=text,
        source="paste",
        review_status="pending",
    )


def ingest_plain_text(
    company_id: str,
    text: str,
    *,
    title: str = "Uploaded text",
    doc_type: str = "filing",
) -> Dict[str, Any]:
    """Adapter for PDF-extracted or plain text uploads (no binary PDF parser required)."""
    cleaned = re.sub(r"\s+", " ", text).strip()
    return doc_store.upsert_document(
        company_id=company_id,
        doc_type=doc_type,
        title=title,
        text=cleaned,
        source="plain_text",
        review_status="pending",
    )


def ingest_html_url(company_id: str, url: str, *, title: Optional[str] = None) -> Dict[str, Any]:
    host = urlparse(url).hostname or ""
    if host not in ALLOWLIST_HOSTS and not any(host.endswith("." + h) for h in ALLOWLIST_HOSTS):
        # allow exact allowlist or subdomain of allowlisted apex — keep strict: hostname must match
        if host not in ALLOWLIST_HOSTS:
            raise ValueError(f"Host not allowlisted: {host}")
    req = Request(url, headers={"User-Agent": "CiteAlphaBot/1.0"})
    with urlopen(req, timeout=15) as resp:  # noqa: S310 — allowlist gated
        raw = resp.read().decode("utf-8", errors="ignore")
    parser = _TextExtractor()
    parser.feed(raw)
    text = parser.text()[:50000]
    if len(text) < 40:
        raise ValueError("Fetched page had insufficient text")
    return doc_store.upsert_document(
        company_id=company_id,
        doc_type="filing",
        title=title or f"IR fetch {host}",
        text=text,
        url=url,
        source="html_fetch",
        review_status="pending",
    )


def bootstrap_top_companies(limit: int = 10) -> int:
    """On-demand job: ensure ≥1 accepted doc for first N Sensex companies."""
    from app.data.seed import SENSEX_30, get_data

    data = get_data()
    transcripts = data.get("sample_transcripts", {})
    count = 0
    for cid, name, ticker, _sector in SENSEX_30[:limit]:
        existing = doc_store.list_documents(company_id=cid)
        if existing:
            count += 1
            continue
        body = transcripts.get(cid) or (
            f"{name} ({ticker}) investor relations summary. "
            f"Management discussed growth outlook, margins, and capital allocation. "
            f"Guidance bands remain the primary accountability signal for CiteAlpha GCI."
        )
        doc_store.upsert_document(
            company_id=cid,
            doc_type="filing",
            title=f"{ticker} IR bootstrap note",
            text=body,
            source="bootstrap",
            review_status="accepted",
        )
        count += 1
    return count
