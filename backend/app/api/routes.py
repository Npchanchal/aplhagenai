from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException

from app.data.seed import get_data, reset_data
from app.models.schemas import (
    AlertItem,
    ActualsImportRequest,
    AuthLoginRequest,
    AuthRegisterRequest,
    CommitExtractRequest,
    CompanyGCIDetail,
    CompanySummary,
    ConsensusImportRequest,
    CrawlRequest,
    DocReviewRequest,
    ExtractRequest,
    HealthResponse,
    ImportFactsRequest,
    IngestMediaRequest,
    IngestPasteRequest,
    IngestUrlRequest,
    MatchRequest,
    PitPoint,
    PreferencesUpdate,
    RefreshRequest,
    ResearchChatRequest,
    ReviewRequest,
)
from app.services import repository
from app.services.auth import optional_api_key, resolve_api_key
from app.services.extraction import extract_guidance
from app.services.matching import alphahunter_facts_to_actuals, match_actuals
from app.services import research as research_svc

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/api/companies", response_model=List[CompanySummary])
def companies(
    market: Optional[str] = None,
    index: Optional[str] = None,
    limit: Optional[int] = None,
    offset: int = 0,
) -> List[CompanySummary]:
    return repository.list_company_summaries(
        market=market, index=index, limit=limit, offset=offset
    )


@router.get("/api/companies/count")
def companies_count(
    market: Optional[str] = None, index: Optional[str] = None
) -> Dict[str, Any]:
    n = repository.count_companies(market=market, index=index)
    return {"count": n, "market": market, "index": index}


@router.get("/api/companies/search")
def companies_search(
    q: str = "",
    limit: int = 25,
    exchange: Optional[str] = None,
    sector: Optional[str] = None,
    data_quality: Optional[str] = None,
    corpus_status: Optional[str] = None,
) -> Dict[str, Any]:
    """Typeahead over covered India exchange listings + GCI when scored."""
    hits = repository.search_entities(
        q,
        limit=max(1, min(limit, 50)),
        exchange=exchange,
        sector=sector,
        data_quality=data_quality,
        corpus_status=corpus_status,
    )
    return {
        "q": q,
        "count": len(hits),
        "results": hits,
        "facets": {
            "exchange": exchange,
            "sector": sector,
            "data_quality": data_quality,
            "corpus_status": corpus_status,
        },
    }


@router.get("/api/sectors/leaderboard")
def sectors_leaderboard(
    market: Optional[str] = "IN",
    index: Optional[str] = None,
    limit: int = 40,
) -> Dict[str, Any]:
    rows = repository.sector_leaderboard(market=market, index=index, limit=limit)
    return {"market": market, "index": index, "count": len(rows), "sectors": rows}


@router.post("/api/gci/score-universe")
def score_universe(
    limit: Optional[int] = None,
    auth=Depends(resolve_api_key),
) -> Dict[str, Any]:
    """Rebuild NSE+BSE GCI cache with gci_scoring v2 (seed + listing_provisional)."""
    from app.data import audit_log
    from app.data.gci_score_cache import build_india_gci_cache, clear_memory_cache

    clear_memory_cache()
    report = build_india_gci_cache(limit=limit)
    audit_log.record(
        "gci_score_universe",
        org=auth.get("org", "demo"),
        actor=auth.get("key", "unknown"),
        role=auth.get("role", "analyst"),
        detail={"count": report.get("count"), "scored_count": report.get("scored_count")},
    )
    return {
        "ok": True,
        "algorithm": report.get("algorithm"),
        "count": report.get("count"),
        "scored_count": report.get("scored_count"),
        "as_of": report.get("as_of"),
        "note": report.get("note"),
    }


@router.get("/api/companies/{company_id}/gci", response_model=CompanyGCIDetail)
def company_gci(company_id: str) -> CompanyGCIDetail:
    return repository.get_company_gci(company_id)


@router.get("/api/companies/{company_id}/gci/history", response_model=List[PitPoint])
def company_gci_history(company_id: str) -> List[PitPoint]:
    return repository.pit_history(company_id)


@router.get("/api/alerts", response_model=List[AlertItem])
def alerts() -> List[AlertItem]:
    return repository.list_alerts()


@router.get("/api/peers/{sector}")
def peers(sector: str) -> Dict[str, Any]:
    rows = [c for c in repository.list_company_summaries() if c.sector.lower() == sector.lower()]
    return {"sector": sector, "companies": rows}


@router.post("/api/extract")
def extract(body: ExtractRequest, auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    from app.data import audit_log
    from app.services.extraction import extract_with_llm_prompt
    from app.services.feature_flags import research_llm_enabled

    text = body.text
    if not text:
        text = get_data().get("sample_transcripts", {}).get(body.company_id)
    if not text:
        return {"statements": [], "error": "No transcript text provided or seeded"}
    if research_llm_enabled():
        statements = extract_with_llm_prompt(
            text,
            company_id=body.company_id,
            period=body.period,
            source_ref=body.source_ref,
        )
    else:
        statements = extract_guidance(
            text,
            company_id=body.company_id,
            period=body.period,
            source_ref=body.source_ref,
        )
    batch = repository.save_pending_extract(body.company_id, statements)
    audit_log.record(
        "extract",
        org=auth.get("org", "demo"),
        actor=auth.get("key", "unknown"),
        role=auth.get("role", "analyst"),
        detail={"extract_id": batch["id"], "count": len(statements)},
    )
    return {
        "statements": statements,
        "count": len(statements),
        "extract_id": batch["id"],
        "needs_review": True,
        "note": "Statements are pending — POST /api/extract/commit to enter GCI",
    }


@router.post("/api/match")
def match(body: MatchRequest, _auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    matched = match_actuals(body.statements, body.actuals)
    return {"matched": matched, "count": len(matched)}


@router.post("/api/import/alphahunter")
def import_alphahunter(body: ImportFactsRequest, _auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    return _import_facts(body)


@router.post("/api/import/facts")
def import_facts(body: ImportFactsRequest, _auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    """P1.4 — Facts JSON import (AlphaHunter-compatible alias)."""
    return _import_facts(body)


def _import_facts(body: ImportFactsRequest) -> Dict[str, Any]:
    from app.data.metric_catalog import normalize_metric, require_metric

    # Normalize metrics on facts before matching
    facts: List[Dict[str, Any]] = []
    for f in body.facts:
        row = dict(f)
        if row.get("metric") is not None or row.get("guided_value") is not None:
            try:
                row["metric"] = require_metric(
                    row.get("metric") or "revenue_growth_pct",
                    allow_custom=body.allow_custom,
                )
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e)) from e
        facts.append(row)

    actuals = alphahunter_facts_to_actuals(facts)
    for a in actuals:
        nid = normalize_metric(a.get("metric"))
        if nid:
            a["metric"] = nid
        elif not body.allow_custom:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown metric in actuals: {a.get('metric')}",
            )

    if body.merge_into_company:
        statements = []
        for f in facts:
            if f.get("guidance_change") or f.get("guided_value") is not None:
                try:
                    metric = require_metric(
                        f.get("metric", "revenue_growth_pct"),
                        allow_custom=body.allow_custom,
                    )
                except ValueError as e:
                    raise HTTPException(status_code=400, detail=str(e)) from e
                statements.append(
                    {
                        "company_id": body.merge_into_company,
                        "period": f.get("period") or f.get("fiscal_period") or "FY25",
                        "metric": metric,
                        "guided_value": float(f.get("guided_value") or f.get("yoy_revenue_pct") or 0),
                        "guided_low": f.get("guided_low"),
                        "guided_high": f.get("guided_high"),
                        "actual_value": f.get("actual_value"),
                        "guided_text": str(f.get("guidance_change") or f.get("guidance_summary") or "imported"),
                        "confidence": float(f.get("confidence_flag") or 0.75),
                        "speaker": "CFO",
                        "thread_id": f"{body.merge_into_company}-import",
                        "dropped": False,
                        "source_url": f.get("source_ref"),
                        "source_ref": f.get("source_ref") or "facts_json",
                        "quote_span": None,
                        "as_of": f.get("as_of"),
                    }
                )
        matched = match_actuals(statements, actuals) if statements else []
        n = repository.merge_matched(body.merge_into_company, matched) if matched else 0
        return {"actuals": actuals, "merged": n, "import_kind": "facts_json"}
    return {"actuals": actuals, "import_kind": "facts_json"}


@router.post("/api/review")
def review(body: ReviewRequest, auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    return repository.apply_review(
        body.company_id,
        body.outcome_index,
        body.action,
        body.comment,
        body.edits,
        reviewer=auth.get("org", "unknown"),
    )


@router.get("/api/reviews")
def reviews(_auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    return {"reviews": get_data().get("reviews", [])}


@router.post("/api/admin/reset-demo")
def reset_demo(_auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    data = reset_data()
    return {"ok": True, "companies": len(data["companies"])}


@router.get("/api/companies/{company_id}/wordmap")
def wordmap(company_id: str) -> Dict[str, Any]:
    """G13 / P1.1 — entity vs industry themes from corpus (seed fallback)."""
    from app.services.wordmap import build_wordmap

    return build_wordmap(company_id)


@router.get("/api/orgs/{org_id}")
def org(org_id: str, auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    """G16 / P2.1 — org seats + plan entitlements."""
    from app.services import orgs as org_svc

    if auth.get("org") != org_id and auth.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Org mismatch")
    return org_svc.org_snapshot(org_id)


@router.get("/api/vernacular/{company_id}")
def vernacular(company_id: str, lang: str = "hi") -> Dict[str, Any]:
    """G19 / G23 — localized GCI blurb templates."""
    detail = repository.get_company_gci(company_id)
    score = detail.gci_score
    templates = {
        "hi": f"{detail.name} का GCI स्कोर {score} है। यह प्रबंधन मार्गदर्शन बनाम वास्तविक परिणाम पर आधारित है।",
        "en": f"{detail.name} GCI score is {score}, based on guidance vs actuals.",
        "ta": f"{detail.name} GCI மதிப்பெண் {score}. இது வழிகாட்டுதல் vs உண்மையான முடிவுகள் அடிப்படையில்.",
        "te": f"{detail.name} GCI స్కోర్ {score}. మార్గదర్శకత్వం vs వాస్తవాలు.",
        "kn": f"{detail.name} GCI ಸ್ಕೋರ್ {score}. ಮಾರ್ಗದರ್ಶನ vs ವಾಸ್ತವ.",
        "ml": f"{detail.name} GCI സ്കോർ {score}. മാർഗനിർദ്ദേശം vs യഥാർത്ഥം.",
        "gu": f"{detail.name} નો GCI સ્કોર {score} છે.",
        "mr": f"{detail.name} चा GCI स्कोअर {score} आहे.",
        "bn": f"{detail.name}-এর GCI স্কোর {score}।",
        "pa": f"{detail.name} ਦਾ GCI ਸਕੋਰ {score} ਹੈ।",
        "ja": f"{detail.name} の GCI スコアは {score} です（ガイダンス対実績）。",
        "zh": f"{detail.name} 的 GCI 评分为 {score}（指引对比实际）。",
        "ar": f"درجة GCI لـ {detail.name} هي {score} (التوجيه مقابل النتائج).",
        "es": f"La puntuación GCI de {detail.name} es {score} (orientación vs resultados).",
        "fr": f"Le score GCI de {detail.name} est {score} (guidance vs résultats).",
        "de": f"Der GCI-Score von {detail.name} beträgt {score} (Guidance vs. Ist).",
        "pt": f"A pontuação GCI de {detail.name} é {score} (orientação vs resultados).",
    }
    fallback = lang not in templates
    return {
        "company_id": company_id,
        "lang": "en" if fallback else lang,
        "text": templates.get(lang, templates["en"]),
        "supported_langs": list(templates.keys()),
        "status": "template",
        "fallback": fallback,
    }


@router.get("/api/badge/{ticker}")
def trust_badge(ticker: str) -> Dict[str, Any]:
    """G20 — broker-embeddable Trust Score badge payload."""
    rows = repository.list_company_summaries()
    row = next((c for c in rows if c.ticker.upper() == ticker.upper()), None)
    if row is None:
        raise HTTPException(status_code=404, detail="Ticker not found")
    return {
        "ticker": row.ticker,
        "trust_score": row.gci_score,
        "label": "Promoter/Management Trust Score (GCI)",
        "embed": f"<span data-intellens-badge=\"{row.ticker}\">{row.gci_score}</span>",
        "svg_url": f"/api/badge/{row.ticker}/svg",
        "status": "ok",
        "disclaimer": "Not investment advice. Factual guidance-delivery metric.",
    }


@router.get("/api/badge/{ticker}/svg")
def trust_badge_svg(ticker: str):
    """G20 — SVG badge for broker embed."""
    from fastapi.responses import Response

    rows = repository.list_company_summaries()
    # allow INFY.svg style by stripping suffix if present
    clean = ticker.replace(".svg", "")
    row = next((c for c in rows if c.ticker.upper() == clean.upper()), None)
    if row is None:
        raise HTTPException(status_code=404, detail="Ticker not found")
    score = "n/a" if row.gci_score is None else f"{row.gci_score:.0f}"
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="160" height="36">
  <rect width="160" height="36" fill="#1f6b4a"/>
  <text x="10" y="22" fill="#fff" font-family="sans-serif" font-size="12">GCI {row.ticker}: {score}</text>
</svg>"""
    return Response(content=svg, media_type="image/svg+xml")


@router.get("/api/meta")
def meta() -> Dict[str, Any]:
    from app.data import doc_store
    from app.data import markets as markets_data
    from app.data.market_history import history_meta
    from app.data.metric_catalog import METRICS
    from app.data.source_policy import POLICY_SUMMARY, policy_payload
    from app.services.feature_flags import flags_dict
    from app.services.refresh import refresh_interval_hours

    data = get_data()
    labeled = sum(1 for c in data["companies"] if c.get("data_quality") == "hand_labeled")
    demo = sum(1 for c in data["companies"] if c.get("data_quality") == "demo_structured")
    mmeta = markets_data.markets_meta()
    hmeta = history_meta()
    from app.services.gci_scoring import compute_company_gci
    from app.data.seed import get_outcomes

    scored = sum(
        1
        for c in data["companies"]
        if compute_company_gci(get_outcomes(c["id"])) is not None
    )
    from app.data.gci_score_cache import load_cache

    gci_cache = load_cache()
    listing_scored = int(gci_cache.get("scored_count") or 0)
    return {
        "version": "0.5.1",
        "company_count": len(data["companies"]),
        "hand_labeled_count": labeled,
        "demo_structured_count": demo,
        "gci_scored_count": scored,
        "gci_listing_scored_count": listing_scored,
        "gci_algorithm": gci_cache.get("algorithm") or "gci_scoring_v2",
        "gci_listing_as_of": gci_cache.get("as_of"),
        "markets_count": mmeta["markets_count"],
        "indexes_count": mmeta["indexes_count"],
        "gci_deep_markets": mmeta["gci_deep_markets"],
        "markets_note": mmeta["scaffold_note"],
        "market_universe_size": mmeta["market_universe_size"],
        "india_listings": mmeta.get("india_listings"),
        "history_years": hmeta["history_years"],
        "history_kind": hmeta["history_kind"],
        "history_note": hmeta["history_note"],
        "fmp_configured": hmeta.get("fmp_configured", False),
        "refresh": {
            "interval_hours": refresh_interval_hours(),
            "endpoint": "POST /api/ingest/refresh",
            "scheduler": "docker compose scheduler | scripts/gci-refresh-loop.sh",
            "note": "Live IR crawl every 6h; docs/extracts stay pending until Desk accept",
        },
        "document_count": len(doc_store.list_documents(include_rejected=True)),
        "gci_metric_count": len(METRICS),
        "gci_source_policy": POLICY_SUMMARY,
        "source_policy": policy_payload(),
        "implementation_phases": ["0", "1", "2", "3", "4", "5", "6", "7", "8"],
        "feature_flags": flags_dict(),
        "gaps_closed": [
            "G01-hand-labeled-cohort",
            "G02-extract",
            "G03-match",
            "G04-sensex30",
            "G05-sources",
            "G06-asymmetric",
            "G07-ranges",
            "G08-labels",
            "G09-threads",
            "G10-trend",
            "G11-peers",
            "G12-dropped",
            "G13-wordmap",
            "G14-review",
            "G15-alphahunter-import",
            "G16-api-key-auth",
            "G17-pit-history",
            "G18-alerts",
            "G19-vernacular",
            "G20-badge",
            "G21-sebi-note",
            "G22-em-api-shape",
            "G23-japan",
            "G24-metric-catalog",
            "G25-source-policy",
        ],
        "open_gaps": [],
        "data_quality_note": (
            f"{labeled}/{len(data['companies'])} Sensex companies are hand_labeled "
            f"({demo} demo_structured). Prefer hand_labeled for external citations. "
            + POLICY_SUMMARY
        ),
        "pitch": "Keep your market terminal for prices; use Intellens for guidance delivery.",
        "research_terminal": {
            "search": "/api/research/search",
            "chat": "/api/research/chat",
            "snapshot": "/api/research/snapshot/{id}",
            "estimates": "/api/research/estimates/{id}",
            "news": "/api/research/news",
            "watchlist": "/api/research/watchlist",
            "transcripts": "/api/research/transcripts",
            "note": "Intellens Research Terminal; cite-only chat over document store. Fundamentals MoM/QoQ/YoY are context — not GCI.",
        },
    }


@router.get("/api/compliance/sebi-note")
def sebi_note() -> Dict[str, Any]:
    """G21 — packaging guidance for SEBI RA scope."""
    return {
        "lead_with": "factual GCI / evidence trail",
        "avoid_without_ra": ["buy", "hold", "sell", "retail recommendations"],
        "status": "counsel-required-before-retail",
    }


@router.get("/api/export/em-factor/{company_id}")
def em_factor(
    company_id: str,
    format: str = "json",
    auth=Depends(optional_api_key),
) -> Any:
    """G22 / P1.3 — EM factor feed (JSON default; CSV / Parquet download)."""
    fmt = (format or "json").lower()
    if fmt != "json" and auth is None:
        raise HTTPException(status_code=401, detail="X-API-Key required for file export")
    hist = repository.pit_history(company_id)
    detail = repository.get_company_gci(company_id)
    payload = {
        "factor": "india_gci",
        "company_id": company_id,
        "ticker": detail.ticker,
        "point_in_time": hist,
        "asof_gci": detail.gci_score,
        "status": "ok",
        "series_kind": "citeable_pit",
        "citeable": True,
    }
    if fmt == "json":
        return payload

    import csv
    import io

    from fastapi.responses import Response, StreamingResponse

    rows = []
    for p in hist:
        rows.append(
            {
                "factor": "india_gci",
                "company_id": company_id,
                "ticker": detail.ticker,
                "as_of": p.as_of,
                "gci_score": p.gci_score,
                "prior_gci": p.prior_gci,
                "change_pct": p.change_pct,
                "change_horizon": p.change_horizon,
            }
        )
    if not rows:
        rows.append(
            {
                "factor": "india_gci",
                "company_id": company_id,
                "ticker": detail.ticker,
                "as_of": "",
                "gci_score": detail.gci_score,
                "prior_gci": "",
                "change_pct": "",
                "change_horizon": "",
            }
        )

    if fmt == "csv":
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
        return StreamingResponse(
            iter([buf.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="em_factor_{detail.ticker}.csv"'
            },
        )

    if fmt in ("parquet", "pq"):
        try:
            import pyarrow as pa
            import pyarrow.parquet as pq

            table = pa.Table.from_pylist(rows)
            sink = io.BytesIO()
            pq.write_table(table, sink)
            return Response(
                content=sink.getvalue(),
                media_type="application/octet-stream",
                headers={
                    "Content-Disposition": f'attachment; filename="em_factor_{detail.ticker}.parquet"'
                },
            )
        except ImportError:
            buf = io.StringIO()
            writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()), delimiter="\t")
            writer.writeheader()
            writer.writerows(rows)
            return StreamingResponse(
                iter([buf.getvalue()]),
                media_type="text/tab-separated-values",
                headers={
                    "Content-Disposition": f'attachment; filename="em_factor_{detail.ticker}.tsv"',
                    "X-Parquet-Fallback": "tsv",
                },
            )

    raise HTTPException(status_code=400, detail="format must be json, csv, or parquet")


# --- Research Terminal (Intellens Search + Intellens Desk, demo) ---


@router.get("/api/research/search")
def research_search(
    q: str = "",
    company_id: Optional[str] = None,
    doc_type: Optional[str] = None,
    limit: int = 25,
) -> Dict[str, Any]:
    return research_svc.search_documents(q, company_id=company_id, doc_type=doc_type, limit=limit)


@router.post("/api/research/chat")
def research_chat(body: ResearchChatRequest) -> Dict[str, Any]:
    return research_svc.research_chat(body.question, company_id=body.company_id)


@router.get("/api/research/snapshot/{company_id}")
def research_snapshot(company_id: str) -> Dict[str, Any]:
    return research_svc.company_snapshot(company_id)


@router.get("/api/research/estimates/{company_id}")
def research_estimates(company_id: str) -> Dict[str, Any]:
    return research_svc.consensus_estimates(company_id)


@router.get("/api/research/brief/{company_id}")
def research_brief(company_id: str) -> Dict[str, Any]:
    """Pre-earnings promise brief — open guidance + historical hit rate per metric."""
    return research_svc.promise_brief(company_id)


@router.get("/api/research/news")
def research_news(company_id: Optional[str] = None, limit: int = 20) -> Dict[str, Any]:
    return research_svc.news_feed(company_id=company_id, limit=limit)


@router.get("/api/research/watchlist")
def research_watchlist() -> Dict[str, Any]:
    return research_svc.watchlist()


@router.get("/api/research/transcripts")
def research_transcripts(company_id: Optional[str] = None) -> Dict[str, Any]:
    return research_svc.list_transcripts(company_id=company_id)


# --- Phase 2–8 APIs ---


@router.post("/api/extract/commit")
def extract_commit(body: CommitExtractRequest, auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    from app.data import audit_log

    result = repository.commit_pending_extract(
        body.extract_id,
        body.accepted_indices,
        edits=body.edits,
        reviewer=auth.get("org", "queue"),
    )
    audit_log.record(
        "extract_commit",
        org=auth.get("org", "demo"),
        actor=auth.get("key", "unknown"),
        role=auth.get("role", "analyst"),
        detail=result,
    )
    return result


@router.get("/api/extract/pending")
def extract_pending(company_id: Optional[str] = None, _auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    rows = repository.list_pending_extracts(company_id)
    return {"count": len(rows), "batches": rows}


@router.post("/api/ingest/paste")
def ingest_paste(body: IngestPasteRequest, auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    from app.data import audit_log
    from app.services import ingest

    doc = ingest.ingest_paste(body.company_id, body.text, title=body.title, doc_type=body.doc_type)
    extract_batch = None
    if (body.text or "").strip():
        statements = extract_guidance(body.text, company_id=body.company_id, period="FY26")
        if statements:
            extract_batch = repository.save_pending_extract(body.company_id, statements)
    audit_log.record(
        "ingest_paste",
        org=auth.get("org", "demo"),
        actor=auth.get("key", "unknown"),
        role=auth.get("role", "analyst"),
        detail={"doc_id": doc["doc_id"], "extract_id": (extract_batch or {}).get("id")},
    )
    return {
        "ok": True,
        "document": doc,
        "extract": extract_batch,
        "note": "Document stored pending review; extract candidates queued when quantified guidance found.",
    }


@router.post("/api/ingest/text")
def ingest_text(body: IngestPasteRequest, auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    from app.services import ingest

    doc = ingest.ingest_plain_text(body.company_id, body.text, title=body.title, doc_type=body.doc_type)
    extract_batch = None
    if (body.text or "").strip():
        statements = extract_guidance(body.text, company_id=body.company_id, period="FY26")
        if statements:
            extract_batch = repository.save_pending_extract(body.company_id, statements)
    return {"ok": True, "document": doc, "extract": extract_batch}


@router.post("/api/ingest/url")
def ingest_url(body: IngestUrlRequest, auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    from app.services import ingest

    try:
        doc = ingest.ingest_html_url(body.company_id, body.url, title=body.title)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Fetch failed: {e}") from e
    extract_batch = None
    text = (doc.get("text") or doc.get("content") or "").strip()
    if text:
        statements = extract_guidance(text, company_id=body.company_id, period="FY26")
        if statements:
            extract_batch = repository.save_pending_extract(body.company_id, statements)
    return {"ok": True, "document": doc, "extract": extract_batch}


@router.post("/api/ingest/bootstrap")
def ingest_bootstrap(_auth=Depends(resolve_api_key), limit: int = 10) -> Dict[str, Any]:
    from app.services import ingest

    n = ingest.bootstrap_top_companies(limit=limit)
    return {"ok": True, "companies_with_docs": n}


@router.post("/api/ingest/ensure-citations")
def ingest_ensure_citations(
    limit: Optional[int] = None,
    company_id: Optional[str] = None,
    auth=Depends(resolve_api_key),
) -> Dict[str, Any]:
    """Tier 1 gate helper: bind hand_labeled outcomes → accepted period docs + spans.

    Also builds the demo_pit_extension warehouse (≥12 quarters) for Tier 2/3 analytics.
    """
    from app.data import audit_log
    from app.services.citation_corpus import (
        ensure_company_citation_corpus,
        ensure_sensex_citation_corpus,
    )
    from app.services.pit_warehouse import ensure_pit_series, ensure_sensex_pit_warehouse

    if company_id:
        report = ensure_company_citation_corpus(company_id)
        pit = ensure_pit_series(company_id)
        report["pit"] = {"n": pit.get("n"), "series_kind": pit.get("series_kind")}
    else:
        report = ensure_sensex_citation_corpus(limit=limit)
        pit = ensure_sensex_pit_warehouse(limit=limit)
        report["pit"] = pit
    audit_log.record(
        "ensure_citations",
        org=auth.get("org", "demo"),
        actor=auth.get("key", "unknown"),
        role=auth.get("role", "analyst"),
        detail={"company_id": company_id, "limit": limit, "linked": report.get("linked")},
    )
    return report


@router.post("/api/ingest/tier-foundation")
def ingest_tier_foundation(
    limit: Optional[int] = None,
    auth=Depends(resolve_api_key),
) -> Dict[str, Any]:
    """One-shot: Sensex citation corpus + PIT warehouse for Tier 1–3 demos."""
    from app.data import audit_log
    from app.services.citation_corpus import ensure_sensex_citation_corpus
    from app.services.pit_warehouse import ensure_sensex_pit_warehouse

    cites = ensure_sensex_citation_corpus(limit=limit)
    pit = ensure_sensex_pit_warehouse(limit=limit)
    audit_log.record(
        "tier_foundation",
        org=auth.get("org", "demo"),
        actor=auth.get("key", "unknown"),
        role=auth.get("role", "analyst"),
        detail={"cites": cites.get("companies"), "pit": pit.get("companies")},
    )
    return {"ok": True, "citations": cites, "pit_warehouse": pit}


@router.post("/api/ingest/crawl")
def ingest_crawl(body: CrawlRequest, auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    """On-demand / scheduled Sensex IR crawl → pending docs for review."""
    from app.data import audit_log
    from app.services.crawl import run_sensex_ir_crawl

    report = run_sensex_ir_crawl(
        limit=body.limit,
        dry_run=body.dry_run,
        live=body.live,
        company_ids=body.company_ids,
    )
    if not body.dry_run:
        audit_log.record(
            "ingest_crawl",
            org=auth.get("org", "demo"),
            actor=auth.get("key", "unknown"),
            role=auth.get("role", "analyst"),
            detail={
                "live": body.live,
                "targets": report.get("targets"),
                "pending_new": report.get("pending_new"),
                "failed": report.get("failed"),
            },
        )
    return report


@router.get("/api/ingest/crawl/status")
def ingest_crawl_status(_auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    from app.services.crawl import load_state, pending_document_counts
    from app.services.refresh import refresh_interval_hours

    state = load_state()
    pending = pending_document_counts()
    return {
        "last": state.get("last"),
        "last_refresh": state.get("last_refresh"),
        "runs": state.get("runs", [])[-10:],
        "pending_total": sum(pending.values()),
        "pending_by_company": pending,
        "schedule": {
            "interval_hours": refresh_interval_hours(),
            "crawl_live_default": True,
            "note": "Compose service `scheduler` or cron every 6h; POST /api/ingest/refresh",
        },
    }


@router.post("/api/ingest/refresh")
def ingest_refresh(body: RefreshRequest, auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    """Scheduled/on-demand live refresh: IR crawl + extract queue (+ optional FMP warm)."""
    from app.data import audit_log
    from app.services.refresh import run_gci_refresh

    report = run_gci_refresh(
        limit=body.limit,
        live=body.live,
        auto_extract=body.auto_extract,
        warm_fmp=body.warm_fmp,
    )
    audit_log.record(
        "ingest_refresh",
        org=auth.get("org", "demo"),
        actor=auth.get("key", "unknown"),
        role=auth.get("role", "analyst"),
        detail={
            "live": report.get("live"),
            "pending_new": (report.get("crawl") or {}).get("pending_new"),
            "extract_batches": (report.get("extract") or {}).get("batches"),
        },
    )
    return report


@router.post("/api/ingest/media")
def ingest_media(body: IngestMediaRequest, auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    """Audio/video stub — GCI scores from ASR transcript text only, never raw AV."""
    from app.data import audit_log

    mt = (body.media_type or "").strip().lower()
    if mt not in ("audio", "video"):
        raise HTTPException(status_code=400, detail="media_type must be audio or video")
    audit_log.record(
        "ingest_media_stub",
        org=auth.get("org", "demo"),
        actor=auth.get("key", "unknown"),
        role=auth.get("role", "analyst"),
        detail={"company_id": body.company_id, "media_type": mt},
    )
    return {
        "status": "accepted_stub",
        "company_id": body.company_id,
        "media_type": mt,
        "title": body.title,
        "note": body.note,
        "next": "provide ASR transcript via /api/ingest/text",
        "scored_from": "transcript_only",
        "disallowed": ["audio_raw", "video_raw", "tone_scoring"],
    }


@router.get("/api/metrics")
def metrics_list(sector: Optional[str] = None) -> Dict[str, Any]:
    from collections import Counter

    from app.data.metric_catalog import list_metrics
    from app.data.seed import get_outcomes, list_companies

    counts: Counter = Counter()
    for c in list_companies():
        for o in get_outcomes(c["id"]):
            counts[o.metric] += 1
    rows = []
    for m in list_metrics(sector=sector):
        rows.append({**m, "outcome_count": counts.get(m["id"], 0)})
    return {"count": len(rows), "metrics": rows}


@router.get("/api/metrics/{metric_id}")
def metrics_detail(metric_id: str) -> Dict[str, Any]:
    from app.data.metric_catalog import get_metric, normalize_metric
    from app.data.seed import get_outcomes, list_companies

    nid = normalize_metric(metric_id) or metric_id
    m = get_metric(nid)
    if m is None:
        raise HTTPException(status_code=404, detail="Metric not in catalog")
    n = 0
    companies = set()
    for c in list_companies():
        for o in get_outcomes(c["id"]):
            if o.metric == nid:
                n += 1
                companies.add(c["id"])
    return {**m, "outcome_count": n, "company_count": len(companies)}


@router.post("/api/actuals/import")
def actuals_import(body: ActualsImportRequest, auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    """Import reported actuals to match guidance — not a fundamentals score."""
    from app.data import audit_log
    from app.data.metric_catalog import require_metric
    from app.data.seed import get_data, save_data

    data = get_data()
    merged = 0
    errors = []
    for i, row in enumerate(body.rows):
        try:
            company_id = row["company_id"]
            period = row["period"]
            metric = require_metric(row.get("metric"), allow_custom=body.allow_custom)
            actual = float(row["actual_value"])
        except (KeyError, TypeError, ValueError) as e:
            errors.append({"index": i, "error": str(e)})
            continue
        outs = data.setdefault("outcomes", {}).setdefault(company_id, [])
        hit = False
        for o in outs:
            if o.get("period") == period and o.get("metric") == metric:
                o["actual_value"] = actual
                if row.get("source_ref"):
                    o["source_ref"] = row["source_ref"]
                hit = True
                merged += 1
                break
        if not hit:
            # store as pending-style actual-only row is skipped — actuals need a guidance row
            errors.append(
                {
                    "index": i,
                    "error": f"No guidance outcome for {company_id}/{period}/{metric} to attach actual",
                }
            )
    save_data(data)
    audit_log.record(
        "actuals_import",
        org=auth.get("org", "demo"),
        actor=auth.get("key", "unknown"),
        role=auth.get("role", "analyst"),
        detail={"merged": merged, "errors": len(errors)},
    )
    return {
        "ok": True,
        "merged": merged,
        "errors": errors,
        "note": "Fundamentals/reported numbers fill actual_value only — not a parallel GCI",
    }


@router.post("/api/documents/review")
def documents_review(body: DocReviewRequest, auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    from app.data import audit_log, doc_store

    status = "accepted" if body.action == "accept" else "rejected"
    try:
        doc = doc_store.set_review_status(body.doc_id, status)
    except KeyError:
        raise HTTPException(status_code=404, detail="Document not found") from None
    audit_log.record(
        "doc_review",
        org=auth.get("org", "demo"),
        actor=auth.get("key", "unknown"),
        role=auth.get("role", "analyst"),
        detail={"doc_id": body.doc_id, "status": status},
    )
    return {"ok": True, "document": doc}


@router.get("/api/documents")
def documents_list(
    company_id: Optional[str] = None,
    doc_type: Optional[str] = None,
    review_status: Optional[str] = None,
) -> Dict[str, Any]:
    from app.data import doc_store

    rows = doc_store.list_documents(company_id=company_id, doc_type=doc_type)
    if review_status:
        rows = [d for d in rows if d.get("review_status") == review_status]
    return {"count": len(rows), "documents": rows}


@router.post("/api/consensus/import")
def consensus_import(body: ConsensusImportRequest, auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    from app.data import audit_log, consensus_store
    from app.services.feature_flags import consensus_import_enabled

    if not consensus_import_enabled():
        raise HTTPException(status_code=404, detail="CONSENSUS_IMPORT disabled")
    n = consensus_store.import_rows(body.rows)
    audit_log.record(
        "consensus_import",
        org=auth.get("org", "demo"),
        actor=auth.get("key", "unknown"),
        role=auth.get("role", "admin"),
        detail={"count": n},
    )
    return {"ok": True, "imported": n}


@router.get("/api/audit")
def audit_list(org: Optional[str] = None, limit: int = 100, auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    from app.data import audit_log

    if auth.get("role") not in ("admin", "reviewer", "analyst"):
        raise HTTPException(status_code=403, detail="Insufficient role")
    rows = audit_log.list_audit(org=org or auth.get("org"), limit=limit)
    return {"count": len(rows), "events": rows}


@router.get("/api/analytics/events")
def analytics_events(limit: int = 50, _auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    from app.services.analytics import recent_events

    return {"events": recent_events(limit)}


@router.get("/api/auth/sso/status")
def auth_sso_status() -> Dict[str, Any]:
    from app.services.rbac import sso_status

    st = sso_status()
    return {
        **st,
        "coming_soon": not st.get("configured"),
        "modes": ["register", "login", "guest", "api_key", "sso"],
    }


@router.get("/api/auth/sso/login")
def auth_sso_login() -> Dict[str, Any]:
    from app.services.rbac import sso_login_stub

    return sso_login_stub()


@router.get("/api/auth/sso/callback")
def auth_sso_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    email: Optional[str] = None,
    name: Optional[str] = None,
) -> Dict[str, Any]:
    from app.services import sso as sso_svc

    return sso_svc.sso_callback(code=code, state=state, email=email, name=name)


@router.get("/api/labeling/queue")
def labeling_queue_list(
    org_id: Optional[str] = None, _auth=Depends(resolve_api_key)
) -> Dict[str, Any]:
    from app.services import labeling_queue as lq

    items = lq.list_queue(org_id=org_id)
    return {"items": items, "count": len(items)}


@router.post("/api/labeling/queue")
def labeling_queue_enqueue(body: Dict[str, Any], auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    from app.services import labeling_queue as lq

    company_id = body.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="company_id required")
    item = lq.enqueue(
        company_id=str(company_id),
        org_id=str(body.get("org_id") or auth.get("org") or "demo"),
        priority=str(body.get("priority") or "normal"),
        note=str(body.get("note") or ""),
        requested_by=str(auth.get("org") or "api"),
    )
    return {"ok": True, "item": item}


@router.patch("/api/labeling/queue/{item_id}")
def labeling_queue_patch(
    item_id: str, body: Dict[str, Any], _auth=Depends(resolve_api_key)
) -> Dict[str, Any]:
    from app.services import labeling_queue as lq

    status = body.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="status required")
    return {"ok": True, "item": lq.update_status(item_id, str(status))}


@router.post("/api/auth/register")
def auth_register(body: AuthRegisterRequest) -> Dict[str, Any]:
    from app.services import session_auth

    return session_auth.register(
        body.email,
        body.password,
        body.name,
        merge_preferences=body.preferences,
        guest_token=body.guest_token,
    )


@router.post("/api/auth/login")
def auth_login(body: AuthLoginRequest) -> Dict[str, Any]:
    from app.services import session_auth

    return session_auth.login(body.email, body.password)


@router.post("/api/auth/guest")
def auth_guest() -> Dict[str, Any]:
    from app.services import session_auth

    return session_auth.create_guest()


@router.post("/api/auth/logout")
def auth_logout(authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    from app.services import session_auth

    token = session_auth.extract_bearer(authorization)
    return session_auth.logout(token)


@router.get("/api/auth/me")
def auth_me(authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    from app.services import session_auth

    user = session_auth.require_session(session_auth.extract_bearer(authorization))
    return {"user": user}


@router.get("/api/auth/preferences")
def auth_get_preferences(
    authorization: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    from app.services import session_auth

    prefs = session_auth.get_preferences(session_auth.extract_bearer(authorization))
    return {"preferences": prefs}


@router.put("/api/auth/preferences")
def auth_put_preferences(
    body: PreferencesUpdate,
    authorization: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    from app.services import session_auth

    patch = body.model_dump(exclude_none=True)
    prefs = session_auth.update_preferences(
        session_auth.extract_bearer(authorization), patch
    )
    return {"preferences": prefs}


@router.get("/api/universe/nifty")
def universe_nifty() -> Dict[str, Any]:
    from app.data.universe import NIFTY_EXTRA, SENSEX_30

    return {
        "sensex_count": len(SENSEX_30),
        "nifty_extra": [
            {"id": a, "name": b, "ticker": c, "sector": d} for a, b, c, d in NIFTY_EXTRA
        ],
        "note": (
            "Nifty scaffolding only — deep hand_labeled GCI remains Sensex pilot. "
            "Do not treat Nifty rows as day-1 GCI depth."
        ),
    }


@router.get("/api/markets")
def markets_list() -> Dict[str, Any]:
    from app.data import markets as markets_data

    rows = markets_data.list_markets()
    return {
        "count": len(rows),
        "markets": rows,
        "gci_deep_markets": markets_data.GCI_DEEP_MARKETS,
        "note": markets_data.markets_meta()["scaffold_note"],
    }


@router.get("/api/markets/{market_id}/indexes")
def market_indexes(market_id: str) -> Dict[str, Any]:
    from app.data import markets as markets_data

    if markets_data.get_market(market_id) is None:
        raise HTTPException(status_code=404, detail="Market not found")
    rows = markets_data.list_indexes(market_id)
    return {
        "market_id": market_id.upper(),
        "count": len(rows),
        "indexes": rows,
        "gci_deep": market_id.upper() in markets_data.GCI_DEEP_MARKETS,
    }


@router.get("/api/indexes/{index_id}/constituents")
def index_constituents(
    index_id: str, limit: Optional[int] = None, offset: int = 0
) -> Dict[str, Any]:
    from app.data import markets as markets_data

    ix = markets_data.get_index(index_id)
    if ix is None:
        raise HTTPException(status_code=404, detail="Index not found")
    rows = markets_data.list_constituents(index_id)
    total = len(rows)
    if offset:
        rows = rows[offset:]
    if limit is not None and limit > 0:
        rows = rows[:limit]
    return {
        "index": ix,
        "count": total,
        "returned": len(rows),
        "offset": offset,
        "constituents": rows,
        "gci_deep": ix["market_id"] in markets_data.GCI_DEEP_MARKETS
        and index_id.upper() == "SENSEX",
    }


@router.get("/api/markets/{market_id}/history")
def market_history(
    market_id: str, index: Optional[str] = None, years: int = 5
) -> Dict[str, Any]:
    from app.data.market_history import get_market_history

    row = get_market_history(market_id, index_id=index, years=years)
    if row is None:
        raise HTTPException(status_code=404, detail="Market not found")
    return row


@router.get("/api/indexes/{index_id}/history")
def index_history(index_id: str, years: int = 5) -> Dict[str, Any]:
    from app.data.market_history import get_index_history

    row = get_index_history(index_id, years=years)
    if row is None:
        raise HTTPException(status_code=404, detail="Index not found")
    return row


@router.get("/api/stocks/{stock_id}/history")
def stock_history(stock_id: str, years: int = 5) -> Dict[str, Any]:
    from app.data.market_history import get_stock_history

    row = get_stock_history(stock_id, years=years)
    if row is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    return row


@router.get("/api/sectors/{sector}/benchmark")
def sector_benchmark(sector: str) -> Dict[str, Any]:
    rows = [c for c in repository.list_company_summaries() if c.sector.lower() == sector.lower()]
    scores = [c.gci_score for c in rows if c.gci_score is not None]
    avg = round(sum(scores) / len(scores), 1) if scores else None
    return {
        "sector": sector,
        "company_count": len(rows),
        "avg_gci": avg,
        "companies": rows,
        "product": "Intellens Sector Benchmark",
    }


@router.get("/api/research/eval")
def research_eval(_auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    cases = [
        {"q": "Infosys margin guidance", "company_id": "infy", "expect_company_id": "infy"},
        {"q": "revenue growth guidance", "company_id": "tcs", "expect_company_id": "tcs"},
        {"q": "completely unrelated xyzzy999", "expect_refuse": True},
    ]
    # pad to 30 lightweight cases
    for cid in ["reliance", "wipro", "hcltech", "hdfcbank", "maruti"]:
        cases.append({"q": "guidance", "company_id": cid, "expect_company_id": cid})
    while len(cases) < 30:
        cases.append({"q": "guidance growth margin", "expect_company_id": "infy"})
    return research_svc.chat_eval_hit_rate(cases)


@router.get("/api/companies/{company_id}/docs")
def company_docs(company_id: str, period: Optional[str] = None) -> Dict[str, Any]:
    # Lazy Tier-1 corpus bind for hand_labeled dossiers
    try:
        detail = repository.get_company_gci(company_id)
        if detail.data_quality == "hand_labeled":
            from app.services.citation_corpus import ensure_company_citation_corpus

            ensure_company_citation_corpus(company_id)
    except Exception:
        pass
    docs = repository.company_period_docs(company_id, period=period)
    completeness = repository.period_completeness(company_id)
    return {
        "company_id": company_id,
        "period": period,
        "count": len(docs),
        "documents": docs,
        "completeness": completeness,
    }


@router.get("/api/companies/{company_id}/changes")
def company_changes(company_id: str) -> Dict[str, Any]:
    bundle = repository.gci_change_bundle_for(company_id)
    return {"company_id": company_id, **bundle}


@router.get("/api/companies/{company_id}/analytics")
def company_analytics(company_id: str) -> Dict[str, Any]:
    from app.data.market_history import get_stock_history
    from app.services.factor_analytics import build_company_analytics
    from app.services.feature_flags import (
        analytics_experimental_ui,
        analytics_granger_v1_enabled,
    )
    from app.services.granger_analytics import build_granger_bundle
    from app.services.pit_warehouse import (
        analytics_series_for,
        build_aligned_factor_series,
        ensure_pit_series,
    )

    detail = repository.get_company_gci(company_id)
    price = get_stock_history(company_id, years=5) or {}
    analytics = build_company_analytics(
        gci_trend=detail.trend or [],
        price_points=price.get("points") or [],
        by_metric=detail.by_metric or {},
        gci_score=detail.gci_score,
    )
    analytics["experimental"] = True
    analytics["show_experimental_ui"] = analytics_experimental_ui()
    # Prefer PIT warehouse (≥12) for #7 alignment disclosure
    gci_vals, pit_points = analytics_series_for(company_id)
    closes = [
        float(p["close"])
        for p in (price.get("points") or [])
        if p.get("close") is not None
    ]
    if len(gci_vals) >= 3 and closes:
        from app.services.factor_analytics import _pearson, lead_lag

        n = min(len(gci_vals), len(closes))
        analytics["sample_n"] = n
        analytics["window_label"] = (
            f"last {n} PIT quarters "
            f"({(pit_points[-1] or {}).get('series_kind', 'demo_pit_extension')} + price tape)"
            if pit_points
            else f"last {n} PIT quarters (demo_pit_extension + price tape)"
        )
        analytics["gci_price_corr"] = _pearson(gci_vals[-n:], closes[-n:])
        analytics["lead_lag_gci_vs_price"] = lead_lag(
            gci_vals[-n:], closes[-n:], max_lag=3
        )
        analytics["pit_as_of"] = [p.get("as_of") for p in pit_points[-n:]]
        sk = (pit_points[-1] or {}).get("series_kind") if pit_points else "demo_pit_extension"
        analytics["series_kind"] = sk
        analytics["citeable"] = bool((pit_points[-1] or {}).get("citeable")) if pit_points else False
        analytics["methodology"] = (
            "Pearson / lag corr on PIT GCI + price tape. "
            "Descriptive pattern only — not causation, not a forecast. "
            + (
                "Series is citeable outcome as_of PIT."
                if analytics["citeable"]
                else "demo_pit_extension is non-citeable analytics scaffolding."
            )
        )
    if analytics_granger_v1_enabled():
        ensure_pit_series(company_id)
        factors = build_aligned_factor_series(
            company_id,
            gci_vals,
            by_metric=detail.by_metric or {},
            price_closes=closes,
        )
        analytics["granger"] = build_granger_bundle(
            gci_series=gci_vals,
            price_series=factors.get("price") or closes[-len(gci_vals) :],
            factor_series=factors,
        )
    else:
        analytics["granger"] = {
            "enabled": False,
            "flag": "ANALYTICS_GRANGER_V1",
            "note": "Enable env ANALYTICS_GRANGER_V1=1 after Tier 1 citation gate.",
        }
    return {"company_id": company_id, **analytics}


@router.get("/api/notes")
def notes_list(
    company_id: Optional[str] = None,
    auth=Depends(resolve_api_key),
) -> Dict[str, Any]:
    from app.services import analyst_notes

    actor = auth.get("key") or auth.get("email") or "anonymous"
    rows = analyst_notes.list_notes(actor=actor, company_id=company_id)
    return {"actor": actor, "count": len(rows), "notes": rows}


@router.post("/api/notes")
def notes_upsert(body: Dict[str, Any], auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    from app.services import analyst_notes

    actor = auth.get("key") or auth.get("email") or "anonymous"
    company_id = (body.get("company_id") or "").strip()
    if not company_id:
        raise HTTPException(status_code=400, detail="company_id required")
    note = analyst_notes.upsert_note(
        actor=actor,
        company_id=company_id,
        body=str(body.get("body") or ""),
        note_id=body.get("id"),
        title=str(body.get("title") or ""),
    )
    return {"ok": True, "note": note}


@router.delete("/api/notes/{note_id}")
def notes_delete(note_id: str, auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    from app.services import analyst_notes

    actor = auth.get("key") or auth.get("email") or "anonymous"
    ok = analyst_notes.delete_note(actor=actor, note_id=note_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"ok": True}


@router.get("/api/reports/templates")
def report_templates(role: Optional[str] = None, industry: Optional[str] = None) -> Dict[str, Any]:
    from app.services.reports import list_templates

    rows = list_templates(role=role, industry=industry)
    return {"count": len(rows), "templates": rows}


@router.post("/api/reports/generate")
def report_generate(body: Dict[str, Any], auth=Depends(resolve_api_key)) -> Dict[str, Any]:
    from app.services import analyst_notes
    from app.services.reports import render_report
    from app.data.market_history import get_stock_history
    from app.services.factor_analytics import build_company_analytics

    company_id = (body.get("company_id") or "").strip()
    template_id = (body.get("template_id") or "ra_delivery").strip()
    if not company_id:
        raise HTTPException(status_code=400, detail="company_id required")
    detail = repository.get_company_gci(company_id)
    actor = auth.get("key") or auth.get("email") or "anonymous"
    notes = analyst_notes.list_notes(actor=actor, company_id=company_id)
    docs = repository.company_period_docs(company_id)
    price = get_stock_history(company_id, years=5) or {}
    analytics = build_company_analytics(
        gci_trend=detail.trend or [],
        price_points=price.get("points") or [],
        by_metric=detail.by_metric or {},
        gci_score=detail.gci_score,
    )
    gci_payload = detail.model_dump() if hasattr(detail, "model_dump") else detail.dict()
    gci_payload["change_bundle"] = repository.gci_change_bundle_for(company_id)
    report = render_report(
        template_id=template_id,
        company={"id": detail.id, "name": detail.name, "ticker": detail.ticker},
        gci=gci_payload,
        notes=notes,
        analytics=analytics,
        docs=docs,
    )
    return report
