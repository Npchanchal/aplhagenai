"""Public citeable-only GCI ranking report (content / GTM)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.services import repository


def gci_rankings(
    *,
    market: str = "IN",
    index: str = "SENSEX",
    limit: int = 30,
    citeable_only: bool = True,
) -> Dict[str, Any]:
    """Rank companies by GCI using citeable / hand_labeled rows only by default."""
    rows = repository.list_company_summaries(market=market, index=index)
    scored: List[Dict[str, Any]] = []
    for c in rows:
        quality = (c.data_quality or "").lower()
        if citeable_only and quality != "hand_labeled":
            continue
        score = c.gci_score
        if score is None:
            continue
        # Prefer companies with at least one citeable outcome when available
        try:
            outs = repository.get_outcomes(c.id)
            cite_n = sum(1 for o in outs if getattr(o, "citeable", None) is True)
        except Exception:
            cite_n = 0
        if citeable_only and cite_n < 1 and quality != "hand_labeled":
            continue
        scored.append(
            {
                "rank": 0,
                "company_id": c.id,
                "ticker": c.ticker,
                "name": c.name,
                "sector": c.sector,
                "gci_score": score,
                "delta": c.gci_change_pct,
                "wow_pct": getattr(c, "wow_pct", None),
                "mom_pct": getattr(c, "mom_pct", None),
                "qoq_pct": getattr(c, "qoq_pct", None),
                "yoy_pct": getattr(c, "yoy_pct", None),
                "data_quality": c.data_quality,
                "citeable_outcomes": cite_n,
                "peer_rank_in_sector": c.peer_rank_in_sector,
            }
        )

    scored.sort(key=lambda r: (-float(r["gci_score"]), r["ticker"]))
    lim = max(1, min(int(limit), 100))
    top = scored[:lim]
    bottom = list(reversed(scored[-lim:])) if len(scored) > lim else list(reversed(scored))
    for i, row in enumerate(top, start=1):
        row["rank"] = i
    for i, row in enumerate(bottom, start=1):
        row["rank"] = i

    as_of = datetime.now(timezone.utc).date().isoformat()
    return {
        "title": "Guidance Credibility Quarterly — citeable rankings",
        "as_of": as_of,
        "market": market,
        "index": index,
        "citeable_only": citeable_only,
        "universe_n": len(scored),
        "top": top,
        "bottom": bottom,
        "methodology": (
            "Ranks use hand_labeled GCI only. Provisional and demo_structured names are excluded. "
            "Not investment advice; no Buy/Hold/Sell."
        ),
        "legal": (
            "© Ocotillo Innovation Private Limited. Factual research tooling — "
            "not a SEBI-registered research analyst product."
        ),
    }


def rankings_markdown(payload: Optional[Dict[str, Any]] = None, **kwargs: Any) -> str:
    data = payload or gci_rankings(**kwargs)
    lines = [
        f"# {data['title']}",
        "",
        f"**As of:** {data['as_of']} · **Universe:** {data['index']} ({data['market']}) · "
        f"n={data['universe_n']} citeable",
        "",
        data["methodology"],
        "",
        "## Top management delivery (GCI)",
        "",
        "| Rank | Ticker | Name | Sector | GCI | Citeable rows |",
        "|---|---|---|---|---|---|",
    ]
    for r in data["top"]:
        lines.append(
            f"| {r['rank']} | {r['ticker']} | {r['name']} | {r['sector']} | "
            f"{r['gci_score']} | {r['citeable_outcomes']} |"
        )
    lines += ["", "## Lowest GCI (same citeable universe)", "", "| Rank | Ticker | Name | Sector | GCI | Citeable rows |", "|---|---|---|---|---|---|"]
    for r in data["bottom"]:
        lines.append(
            f"| {r['rank']} | {r['ticker']} | {r['name']} | {r['sector']} | "
            f"{r['gci_score']} | {r['citeable_outcomes']} |"
        )
    lines += ["", "---", data["legal"], ""]
    return "\n".join(lines)
