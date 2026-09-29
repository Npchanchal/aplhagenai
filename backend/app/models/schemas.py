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
    wow_pct: Optional[float] = None
    mom_pct: Optional[float] = None
    qoq_pct: Optional[float] = None
    yoy_pct: Optional[float] = None
    market_id: Optional[str] = None
    index_ids: Optional[List[str]] = None
    # Index integrity (W1.3): every published number carries its confidence + provenance.
    confidence_tier: Optional[str] = Field(
        default=None, description="provisional | established | deep; null when not scored"
    )
    closed_periods: int = 0
    metrics_scored: int = 0
    as_of: Optional[str] = Field(default=None, description="Latest reviewed outcome date")
    algorithm_id: Optional[str] = None


class AuthRegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""
    preferences: Optional[Dict[str, Any]] = None
    guest_token: Optional[str] = None
    accept_terms: bool = False
    account_type: str = "b2b"  # b2b desk; retail only after sebi_retail attest
    org_name: Optional[str] = None
    org_id: Optional[str] = None
    challenge_id: Optional[str] = None
    challenge_answer: Optional[str] = None


class AuthLoginRequest(BaseModel):
    email: str
    password: str
    totp_code: Optional[str] = None


class AuthMfaConfirmRequest(BaseModel):
    code: str


class AuthGuestRequest(BaseModel):
    accept_terms: bool = False
    challenge_id: Optional[str] = None
    challenge_answer: Optional[str] = None


class LegalAttestRequest(BaseModel):
    kind: str  # terms_privacy | sebi_retail
    attested_by: str
    note: str = ""


class PlatformAdminRoleRequest(BaseModel):
    platform_admin_role: Optional[str] = None  # super | ops | compliance | billing | support | null


class MsaInvoiceRequest(BaseModel):
    plan: str = "desk"
    seats: int = 5
    amount_inr: Optional[float] = None
    po_number: Optional[str] = None
    conversion_path: Optional[str] = None  # "pilot_to_desk" → create_msa_from_pilot
    from_pilot: bool = False


class MsaSignRequest(BaseModel):
    signer_email: str


class RetailCheckoutRequest(BaseModel):
    pass


class RetailPayConfirm(BaseModel):
    order_id: str
    payment_ref: str = "upi-demo"


class AuthEmailRequest(BaseModel):
    email: str


class AuthVerifyConfirm(BaseModel):
    token: str


class AuthPasswordResetConfirm(BaseModel):
    token: str
    password: str


class OrgInviteRequest(BaseModel):
    email: str
    role: str = "member"


class OrgRevokeRequest(BaseModel):
    user_id: str


class OrgOidcRequest(BaseModel):
    oidc_issuer: Optional[str] = None
    oidc_client_id: Optional[str] = None
    email_domain: Optional[str] = None


class AcceptInviteRequest(BaseModel):
    token: str
    password: str
    name: str = ""
    accept_terms: bool = False


class PreferencesUpdate(BaseModel):
    language: Optional[str] = None
    default_market: Optional[str] = None
    default_index: Optional[str] = None
    watchlist: Optional[List[str]] = None
    show_demo_tape: Optional[bool] = None
    density: Optional[str] = None
    saved_queries: Optional[List[str]] = None
    analytics_consent: Optional[bool] = None


class MemberRoleRequest(BaseModel):
    role: str


class FeedbackCreate(BaseModel):
    company_id: Optional[str] = None
    period: Optional[str] = None
    metric: Optional[str] = None
    kind: str
    comment: str = ""
    nps: Optional[int] = None


class PilotRequestCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=254)
    firm: str = Field(min_length=1, max_length=200)
    role: str = Field(default="", max_length=120)
    team_size: str = Field(default="", max_length=40)
    message: str = Field(default="", max_length=4000)
    challenge_id: Optional[str] = None
    challenge_answer: Optional[str] = None


class PilotRequestReview(BaseModel):
    action: str = Field(description="approve or reject")
    note: str = Field(default="", max_length=1000)


class SetAuditFlagRequest(BaseModel):
    flag: str
    source_url: str = ""
    note: str = ""


class LabelDraftRequest(BaseModel):
    company_id: str
    ticker: Optional[str] = None
    period: str = "FY"
    metric: str = "revenue_growth_pct"
    guided_low: Optional[float] = None
    guided_high: Optional[float] = None
    guided_value: Optional[float] = None
    actual_value: Optional[float] = None
    dropped: bool = False
    guided_text: str = ""
    quote_span: Optional[str] = None
    source_url: Optional[str] = None
    source_ref: Optional[str] = None
    source_type: str = "ir_html"
    as_of: Optional[str] = None
    speaker: Optional[str] = None
    thread_id: Optional[str] = None
    confidence: float = 0.85
    notes: Optional[str] = None
    guidance_source_url: Optional[str] = None
    guidance_source_ref: Optional[str] = None
    guidance_quote: Optional[str] = None
    guidance_as_of: Optional[str] = None


class LabelImportRequest(BaseModel):
    csv: str


class LabelRejectRequest(BaseModel):
    comment: str = ""


class GuidanceRevision(BaseModel):
    as_of: str
    guided_low: float
    guided_high: float
    source_url: Optional[str] = None
    source_ref: Optional[str] = None
    quote: Optional[str] = None


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
    guidance_source_url: Optional[str] = None
    guidance_source_ref: Optional[str] = None
    guidance_quote: Optional[str] = None
    guidance_as_of: Optional[str] = None
    revisions: List[GuidanceRevision] = Field(default_factory=list)
    revision_direction: Optional[str] = Field(
        default=None, description="raised | cut | unchanged — final vs opening band"
    )
    final_guided_low: Optional[float] = None
    final_guided_high: Optional[float] = None
    final_label: Optional[str] = Field(
        default=None, description="Outcome against the last revised band (not scored)"
    )
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
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None


class CompanyGCIDetail(BaseModel):
    id: str
    name: str
    ticker: str
    sector: str
    gci_score: Optional[float]
    status: str = Field(description="ok | insufficient_data")
    data_quality: str
    by_metric: Dict[str, float] = Field(description="Metrics in the composite")
    context_metrics: Dict[str, float] = Field(
        default_factory=dict,
        description="Metrics with < 2 closed periods — shown, not in the composite",
    )
    periods_by_metric: Dict[str, int] = Field(default_factory=dict)
    composite_weights: Dict[str, float] = Field(default_factory=dict)
    label_counts: Dict[str, int]
    outcomes: List[OutcomeView]
    trend: List[Dict[str, Any]]
    peer_rank_in_sector: Optional[int] = None
    sector_avg_gci: Optional[float] = None
    threads: Dict[str, List[OutcomeView]] = Field(default_factory=dict)
    gci_change_pct: Optional[float] = None
    # Index integrity (W1.3)
    confidence_tier: Optional[str] = None
    closed_periods: int = 0
    metrics_scored: int = 0
    as_of: Optional[str] = None
    algorithm_id: Optional[str] = None
    reviewed_at: Optional[str] = None
    gci_change_horizon: Optional[str] = None
    by_metric_changes: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    # Audit / red-alert layer (v3 deductions — not forensic Beneish)
    audit_flags: List[str] = Field(default_factory=list)
    audit_deduction: float = 0.0
    audit_badges: List[Dict[str, Any]] = Field(default_factory=list)
    red_alerts: List[Dict[str, Any]] = Field(default_factory=list)
    revision_timeline: List[Dict[str, Any]] = Field(default_factory=list)
    audit_note: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str = "0.5.2"


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
    period: Optional[str] = None
    metric: Optional[str] = None
    source_url: Optional[str] = None
    audit_flag: Optional[str] = None
    deduction_pts: Optional[float] = None


class PitPoint(BaseModel):
    as_of: str
    gci_score: Optional[float]
    prior_gci: Optional[float] = None
    change_pct: Optional[float] = None
    change_horizon: Optional[str] = None


class ResearchChatRequest(BaseModel):
    question: str
    company_id: Optional[str] = None


class SightsAskRequest(BaseModel):
    question: str
    company_id: Optional[str] = None
    web_assist: bool = False


class SightsGridRequest(BaseModel):
    prompts: List[str]
    company_ids: Optional[List[str]] = None


class SightsDeepDiveRequest(BaseModel):
    topic: str
    company_id: Optional[str] = None


class SightsAgentRunRequest(BaseModel):
    template_id: str
    company_id: str


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
