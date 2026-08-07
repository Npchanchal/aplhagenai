"""Analyst report templates — Markdown packs by role / industry."""

from __future__ import annotations

from typing import Any, Dict, List, Optional


TEMPLATES: List[Dict[str, Any]] = [
    {
        "id": "pm_credibility",
        "name": "PM — Guidance credibility brief",
        "role": "portfolio_manager",
        "industry": "general",
        "sections": ["summary", "gci", "evidence", "deltas", "risks", "notes"],
    },
    {
        "id": "ra_delivery",
        "name": "Research analyst — Delivery vs guidance",
        "role": "research_analyst",
        "industry": "general",
        "sections": ["summary", "gci", "evidence", "threads", "citability", "notes"],
    },
    {
        "id": "sector_banks",
        "name": "Sector — Banks / NBFC",
        "role": "sector_analyst",
        "industry": "Banks",
        "sections": ["summary", "gci", "metrics", "peers", "analytics", "notes"],
    },
    {
        "id": "sector_it",
        "name": "Sector — IT Services",
        "role": "sector_analyst",
        "industry": "IT Services",
        "sections": ["summary", "gci", "metrics", "peers", "analytics", "notes"],
    },
    {
        "id": "hitl_review",
        "name": "HITL review pack",
        "role": "desk_analyst",
        "industry": "general",
        "sections": ["summary", "pending_docs", "evidence", "citability", "notes"],
    },
]


def list_templates(role: Optional[str] = None, industry: Optional[str] = None) -> List[Dict[str, Any]]:
    rows = TEMPLATES
    if role:
        rows = [t for t in rows if t["role"] == role or t["role"] == "general"]
    if industry:
        rows = [t for t in rows if t["industry"] in (industry, "general")]
    return rows


def render_report(
    *,
    template_id: str,
    company: Dict[str, Any],
    gci: Dict[str, Any],
    notes: Optional[List[Dict[str, Any]]] = None,
    analytics: Optional[Dict[str, Any]] = None,
    docs: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    tpl = next((t for t in TEMPLATES if t["id"] == template_id), TEMPLATES[0])
    lines: List[str] = [
        f"# {tpl['name']}",
        "",
        f"**Company:** {company.get('name')} (`{company.get('ticker')}`)",
        f"**GCI:** {gci.get('gci_score')} · quality `{gci.get('data_quality')}`",
        f"**Status:** {gci.get('status')}",
        "",
    ]
    if "summary" in tpl["sections"]:
        lines += [
            "## Summary",
            f"Guidance credibility index is **{gci.get('gci_score')}** "
            f"({gci.get('data_quality')}). Cite hand_labeled evidence only.",
            "",
        ]
    if "gci" in tpl["sections"]:
        lines += ["## GCI", f"- Score: {gci.get('gci_score')}", f"- Labels: {gci.get('label_counts')}", ""]
    if "evidence" in tpl["sections"] or "citability" in tpl["sections"]:
        lines.append("## Evidence (citable rows only)")
        citeable_rows = [
            o for o in (gci.get("outcomes") or []) if o.get("citeable") is True
        ]
        skipped = len(gci.get("outcomes") or []) - len(citeable_rows)
        if not citeable_rows:
            lines.append("_No citeable outcomes — provisional/demo rows excluded._")
        for o in citeable_rows[:12]:
            cite = o.get("quote_span") or o.get("guided_text") or ""
            src = o.get("source_url") or o.get("source_ref") or "—"
            cid = o.get("citation_id") or "—"
            lines.append(
                f"- **{o.get('period')}** `{o.get('metric')}` · {o.get('label')} · "
                f"`{cid}` · “{cite}” · [{src}]({src if str(src).startswith('http') else '#'})"
            )
        if skipped:
            lines.append(f"_Excluded {skipped} non-citeable row(s)._")
        lines.append("")
        # Citation appendix
        lines.append("## Citation appendix")
        if not citeable_rows:
            lines.append("_Empty — no citeable rows._")
        else:
            lines.append("| citation_id | period | metric | URL | quote |")
            lines.append("|---|---|---|---|---|")
            for o in citeable_rows[:40]:
                cid = (o.get("citation_id") or "—").replace("|", "/")
                url = (o.get("source_url") or "—").replace("|", "/")
                quote = (o.get("quote_span") or "").replace("|", "/")[:80]
                lines.append(
                    f"| `{cid}` | {o.get('period')} | `{o.get('metric')}` | {url} | {quote} |"
                )
        lines.append("")
    if "deltas" in tpl["sections"] and gci.get("change_bundle"):
        b = gci["change_bundle"]
        lines += [
            "## Deltas",
            f"- MoM: {b.get('mom_pct')} · QoQ: {b.get('qoq_pct')} · YoY: {b.get('yoy_pct')} · WoW: {b.get('wow_pct')}",
            "",
        ]
    if "analytics" in tpl["sections"] and analytics:
        lines += [
            "## Analytics (descriptive — not a forecast)",
            f"- Experimental: {analytics.get('experimental', True)}",
            f"- GCI↔price corr: {analytics.get('gci_price_corr')}",
            f"- N / window: {analytics.get('sample_n')} / {analytics.get('window_label')}",
            f"- Impact factors: {len(analytics.get('impact_factors') or [])}",
            "",
        ]
    if "pending_docs" in tpl["sections"] and docs is not None:
        lines += ["## Documents", f"- Pending/period docs: {len(docs)}", ""]
    if "notes" in tpl["sections"]:
        lines.append("## Private analyst notes")
        if notes:
            for n in notes:
                lines.append(f"- **{n.get('title')}**: {n.get('body')}")
        else:
            lines.append("_No private notes._")
        lines.append("")
    lines += ["---", "_Generated by IntelLens GCI — not investment advice._", ""]
    return {
        "template_id": tpl["id"],
        "template_name": tpl["name"],
        "format": "markdown",
        "markdown": "\n".join(lines),
        "company_id": company.get("id"),
    }
