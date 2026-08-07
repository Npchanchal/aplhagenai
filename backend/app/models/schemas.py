from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class CompanySummary(BaseModel):
    id: str
    name: str
    ticker: str
    sector: str
    gci_score: Optional[float]
    data_quality: str = "demo_structured"
    peer_rank_in_sector: Optional[int] = None
    sector_avg_gci: Optional[float] = None
    gci_change_pct: Optional[float] = None
    gci_change_horizon: Optional[str] = None
    market_id: Optional[str] = None
    index_ids: Optional[List[str]] = None


class AuthRegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""
    preferences: Optional[Dict[str, Any]] = None
    guest_token: Optional[str] = None


class AuthLoginRequest(BaseModel):
    email: str
    password: str


class PreferencesUpdate(BaseModel):
    language: Optional[str] = None
    default_market: Optional[str] = None
    default_index: Optional[str] = None
    watchlist: Optional[List[str]] = None
    show_demo_tape: Optional[bool] = None
    density: Optional[str] = None


class OutcomeView(BaseModel):
    period: str
    metric: str
    guided_value: float
    guided_low: Optional[float] = None
    guided_high: Optional[float] = None
    actual_value: Optional[float]
    delta_pct: Optional[float]
    guided_text: str
    confidence: float
    speaker: str
    contribution_score: Optional[float]
    label: str
    thread_id: Optional[str] = None
    source_url: Optional[str] = None
    source_ref: Optional[str] = None
    quote_span: Optional[str] = None
    as_of: Optional[str] = None
    dropped: bool = False
    actual_change_pct: Optional[float] = None
    actual_change_horizon: Optional[str] = None
    guided_change_pct: Optional[float] = None
    guided_change_horizon: Optional[str] = None
    citation_id: Optional[str] = None
    doc_id: Optional[str] = None
    citeable: bool = False
    cite_reason: Optional[str] = None
    span_start: Optional[int] = None
    span_end: Optional[int] = None


class CompanyGCIDetail(BaseModel):
    id: str
    name: str
    ticker: str
    sector: str
    gci_score: Optional[float]
    status: str = Field(description="ok | insufficient_data")
    data_quality: str
    by_metric: Dict[str, float]
    label_counts: Dict[str, int]
    outcomes: List[OutcomeView]
    trend: List[Dict[str, Any]]
    peer_rank_in_sector: Optional[int] = None
    sector_avg_gci: Optional[float] = None
    threads: Dict[str, List[OutcomeView]] = Field(default_factory=dict)
    sentiment: Dict[str, float] = Field(default_factory=dict)
    gci_change_pct: Optional[float] = None
    gci_change_horizon: Optional[str] = None
    by_metric_changes: Dict[str, Dict[str, Any]] = Field(default_factory=dict)


class HealthResponse(BaseModel):
    status: str
    version: str = "0.2.0"


class ExtractRequest(BaseModel):
    company_id: str
    text: Optional[str] = None
    period: str = "FY26"
    source_ref: str = "upload"


class MatchRequest(BaseModel):
    statements: List[Dict[str, Any]]
    actuals: List[Dict[str, Any]]


class ImportFactsRequest(BaseModel):
    facts: List[Dict[str, Any]]
    merge_into_company: Optional[str] = None
    allow_custom: bool = False


class IngestMediaRequest(BaseModel):
    company_id: str
    media_type: str  # audio | video
    note: Optional[str] = None
    title: Optional[str] = None


class ActualsImportRequest(BaseModel):
    rows: List[Dict[str, Any]]
    allow_custom: bool = False


class ReviewRequest(BaseModel):
    company_id: str
    outcome_index: int
    action: str  # accept | edit | reject
    comment: Optional[str] = None
    edits: Optional[Dict[str, Any]] = None


class AlertItem(BaseModel):
    company_id: str
    ticker: str
    kind: str
    message: str
    severity: str


class PitPoint(BaseModel):
    as_of: str
    gci_score: Optional[float]
    prior_gci: Optional[float] = None
    change_pct: Optional[float] = None
    change_horizon: Optional[str] = None


class ResearchChatRequest(BaseModel):
    question: str
    company_id: Optional[str] = None


class IngestPasteRequest(BaseModel):
    company_id: str
    text: str
    title: str = "Pasted transcript"
    doc_type: str = "transcript"


class IngestUrlRequest(BaseModel):
    company_id: str
    url: str
    title: Optional[str] = None


class CommitExtractRequest(BaseModel):
    extract_id: str
    accepted_indices: List[int]
    # Optional per-statement corrections applied before commit,
    # keyed by statement index: {0: {"guided_low": 6, "guided_high": 8}}
    edits: Optional[Dict[int, Dict[str, Any]]] = None


class ConsensusImportRequest(BaseModel):
    rows: List[Dict[str, Any]]


class DocReviewRequest(BaseModel):
    doc_id: str
    action: str  # accept | reject


class CrawlRequest(BaseModel):
    limit: int = 30
    dry_run: bool = False
    live: bool = False
    company_ids: Optional[List[str]] = None


class RefreshRequest(BaseModel):
    limit: int = 30
    live: Optional[bool] = None
    auto_extract: Optional[bool] = None
    warm_fmp: Optional[bool] = None
