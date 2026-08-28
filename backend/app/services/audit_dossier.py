"""IC-ready audit dossier — structured JSON + Markdown + PDF packs."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.services.pdf_minimal import text_to_pdf
from app.services.reports import render_report


SCHEMA_VERSION = "ic_audit_dossier.v1"
LEGAL_NOTE = (
    "Factual Guidance Credibility Index research only — not investment advice. "
    "© Ocotillo Innovation Private Limited."
)


def build_ic_audit_json(
    *,
    company: Dict[str, Any],
    gci: Dict[str, Any],
    notes: Optional[List[Dict[str, Any]]] = None,
    docs: Optional[List[Dict[str, Any]]] = None,
    generated_by: Optional[str] = None,
) -> Dict[str, Any]:
    """Structured IC pack: citeable guidance vs delivery only."""
    outcomes = list(gci.get("outcomes") or [])
    citeable = [o for o in outcomes if o.get("citeable") is True]
    excluded_n = len(outcomes) - len(citeable)

    matrix = []
    for o in citeable:
        matrix.append(
            {
                "period": o.get("period"),
                "metric": o.get("metric"),
                "label": o.get("label"),
                "guided_low": o.get("guided_low"),
                "guided_high": o.get("guided_high"),
                "guided_text": o.get("guided_text"),
                "actual_value": o.get("actual_value"),
                "actual_text": o.get("actual_text"),
                "as_of": o.get("as_of"),
                "citation_id": o.get("citation_id"),
                "source_url": o.get("source_url"),
                "source_ref": o.get("source_ref"),
                "quote_span": o.get("quote_span"),
                "score_contribution": o.get("score_contribution"),
            }
        )

    appendix = [
        {
            "citation_id": o.get("citation_id"),
            "period": o.get("period"),
            "metric": o.get("metric"),
            "source_url": o.get("source_url"),
            "quote_span": (o.get("quote_span") or "")[:240],
        }
        for o in citeable
    ]

    return {
        "schema": SCHEMA_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generated_by": generated_by or "intellens",
        "purpose": "investment_committee_audit_dossier",
        "legal": LEGAL_NOTE,
        "company": {
            "id": company.get("id"),
            "ticker": company.get("ticker"),
            "name": company.get("name"),
            "sector": company.get("sector") or gci.get("sector"),
        },
        "gci": {
            "score": gci.get("gci_score"),
            "status": gci.get("status"),
            "data_quality": gci.get("data_quality"),
            "label_counts": gci.get("label_counts"),
            "change_bundle": gci.get("change_bundle"),
        },
        "guidance_vs_delivery": {
            "citeable_count": len(citeable),
            "excluded_non_citeable": excluded_n,
            "rows": matrix,
        },
        "citation_appendix": appendix,
        "documents": {
            "period_docs_count": len(docs or []),
            "note": "Period docs are corpus context; only citeable outcomes enter the matrix.",
        },
        "analyst_notes": [
            {"title": n.get("title"), "body": n.get("body")} for n in (notes or [])
        ],
        "refusals": (
            []
            if citeable
            else [
                {
                    "code": "no_citeable_outcomes",
                    "message": "No citeable outcomes — provisional/demo rows excluded from IC pack.",
                }
            ]
        ),
    }


def render_ic_audit(
    *,
    company: Dict[str, Any],
    gci: Dict[str, Any],
    notes: Optional[List[Dict[str, Any]]] = None,
    docs: Optional[List[Dict[str, Any]]] = None,
    analytics: Optional[Dict[str, Any]] = None,
    fmt: str = "json",
    generated_by: Optional[str] = None,
) -> Dict[str, Any]:
    """Return IC audit dossier in json | markdown | pdf (pdf_base64)."""
    fmt_n = (fmt or "json").strip().lower()
    if fmt_n not in ("json", "markdown", "md", "pdf"):
        fmt_n = "json"
    if fmt_n == "md":
        fmt_n = "markdown"

    pack = build_ic_audit_json(
        company=company,
        gci=gci,
        notes=notes,
        docs=docs,
        generated_by=generated_by,
    )

    # Markdown via dedicated IC template (always citeable-only)
    md_report = render_report(
        template_id="ic_audit",
        company=company,
        gci=gci,
        notes=notes,
        analytics=analytics,
        docs=docs,
    )
    markdown = md_report.get("markdown") or ""

    out: Dict[str, Any] = {
        "template_id": "ic_audit",
        "template_name": "IC — Audit dossier (cite-only)",
        "format": fmt_n,
        "company_id": company.get("id"),
        "schema": SCHEMA_VERSION,
        "citeable_count": pack["guidance_vs_delivery"]["citeable_count"],
        "legal": LEGAL_NOTE,
    }

    if fmt_n == "json":
        out["dossier"] = pack
        out["markdown"] = markdown  # convenience dual payload
        return out

    if fmt_n == "markdown":
        out["markdown"] = markdown
        out["dossier"] = pack
        return out

    # PDF from markdown lines
    lines = markdown.splitlines() or ["(empty dossier)"]
    pdf_bytes = text_to_pdf(
        lines,
        title=f"IC Audit · {company.get('ticker') or company.get('id')}",
    )
    import base64

    out["pdf_base64"] = base64.b64encode(pdf_bytes).decode("ascii")
    out["pdf_bytes"] = pdf_bytes  # stripped by route before JSON if needed
    out["markdown"] = markdown
    out["dossier"] = pack
    return out
