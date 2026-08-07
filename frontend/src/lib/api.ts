export type CompanySummary = {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  gci_score: number | null;
  data_quality?: string;
  peer_rank_in_sector?: number | null;
  sector_avg_gci?: number | null;
  gci_change_pct?: number | null;
  gci_change_horizon?: string | null;
  market_id?: string | null;
  index_ids?: string[] | null;
};

export type OutcomeView = {
  period: string;
  metric: string;
  guided_value: number;
  guided_low?: number | null;
  guided_high?: number | null;
  actual_value: number | null;
  delta_pct: number | null;
  guided_text: string;
  confidence: number;
  speaker: string;
  contribution_score: number | null;
  label: string;
  thread_id?: string | null;
  source_url?: string | null;
  source_ref?: string | null;
  quote_span?: string | null;
  as_of?: string | null;
  dropped?: boolean;
  actual_change_pct?: number | null;
  actual_change_horizon?: string | null;
  guided_change_pct?: number | null;
  guided_change_horizon?: string | null;
  citation_id?: string | null;
  doc_id?: string | null;
  citeable?: boolean;
  cite_reason?: string | null;
  span_start?: number | null;
  span_end?: number | null;
};

export type CompanyGCIDetail = {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  gci_score: number | null;
  status: string;
  data_quality: string;
  by_metric: Record<string, number>;
  label_counts: Record<string, number>;
  outcomes: OutcomeView[];
  trend: {
    period: string;
    gci_score: number | null;
    change_pct?: number | null;
    change_horizon?: string | null;
    prior_value?: number | null;
  }[];
  peer_rank_in_sector?: number | null;
  sector_avg_gci?: number | null;
  threads: Record<string, OutcomeView[]>;
  sentiment: Record<string, number>;
  gci_change_pct?: number | null;
  gci_change_horizon?: string | null;
  by_metric_changes?: Record<
    string,
    {
      value?: number | null;
      mom_pct?: number | null;
      qoq_pct?: number | null;
      yoy_pct?: number | null;
      pop_pct?: number | null;
    }
  >;
};

export type AlertItem = {
  company_id: string;
  ticker: string;
  kind: string;
  message: string;
  severity: string;
};

export type ResearchDoc = {
  id: string;
  company_id: string;
  ticker: string;
  name?: string;
  doc_type: string;
  title: string;
  date: string;
  source?: string;
  url?: string | null;
  snippet: string;
  body?: string;
  score?: number;
};

export type ResearchSnapshot = {
  company_id: string;
  name: string;
  ticker: string;
  sector: string;
  market: {
    last: number;
    change_pct: number;
    mom_pct?: number | null;
    qoq_pct?: number | null;
    yoy_pct?: number | null;
    mkt_cap_cr: number;
    volume: number;
    note: string;
  };
  gci: {
    score: number | null;
    change_pct?: number | null;
    change_horizon?: string | null;
    label_counts: Record<string, number>;
    peer_rank_in_sector?: number | null;
    sector_avg_gci?: number | null;
    data_quality: string;
    trend?: {
      period: string;
      gci_score: number | null;
      change_pct?: number | null;
      change_horizon?: string | null;
    }[];
  };
  fundamentals_demo: Record<
    string,
    | number
    | {
        value?: number | null;
        mom_pct?: number | null;
        qoq_pct?: number | null;
        yoy_pct?: number | null;
        pop_pct?: number | null;
        pop_horizon?: string | null;
        history?: { period?: string; value?: number | null }[];
      }
  >;
};

export type ResearchEstimateRow = {
  period: string;
  metric: string;
  street_consensus: number | null;
  street_source?: string;
  management_guidance: number;
  guided_band: (number | null)[];
  actual: number | null;
  gci_label: string;
  vs_street_pct: number | null;
  actual_change_pct?: number | null;
  actual_change_horizon?: string | null;
  management_guidance_change_pct?: number | null;
  management_guidance_change_horizon?: string | null;
  street_consensus_change_pct?: number | null;
  street_consensus_change_horizon?: string | null;
};

export type WatchlistItem = {
  company_id: string;
  ticker: string;
  name: string;
  sector: string;
  gci_score: number | null;
  gci_change_pct?: number | null;
  gci_change_horizon?: string | null;
  last: number;
  change_pct: number;
  mom_pct?: number | null;
  qoq_pct?: number | null;
  yoy_pct?: number | null;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const API_KEY = import.meta.env.VITE_API_KEY ?? "intellens-demo";

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchCompanies(opts?: {
  market?: string;
  index?: string;
  limit?: number;
  offset?: number;
}): Promise<CompanySummary[]> {
  const params = new URLSearchParams();
  if (opts?.market) params.set("market", opts.market);
  if (opts?.index) params.set("index", opts.index);
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  if (opts?.offset != null) params.set("offset", String(opts.offset));
  const qs = params.toString();
  return getJson(`/api/companies${qs ? `?${qs}` : ""}`);
}

export function fetchCompaniesCount(opts?: {
  market?: string;
  index?: string;
}): Promise<{ count: number; market?: string; index?: string }> {
  const params = new URLSearchParams();
  if (opts?.market) params.set("market", opts.market);
  if (opts?.index) params.set("index", opts.index);
  const qs = params.toString();
  return getJson(`/api/companies/count${qs ? `?${qs}` : ""}`);
}

export function fetchCompanyGci(id: string): Promise<CompanyGCIDetail> {
  return getJson(`/api/companies/${id}/gci`);
}

export function searchCompanies(
  q: string,
  limit = 20,
  facets?: {
    exchange?: string;
    sector?: string;
    data_quality?: string;
    corpus_status?: string;
  }
): Promise<{
  q: string;
  count: number;
  facets?: Record<string, string | null | undefined>;
  results: Array<{
    id: string;
    name: string;
    ticker: string;
    sector: string;
    gci_score: number | null;
    data_quality?: string;
    exchange?: string;
    doc_count?: number;
    citeable_outcomes?: number;
    corpus_status?: string;
  }>;
}> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  if (facets?.exchange) params.set("exchange", facets.exchange);
  if (facets?.sector) params.set("sector", facets.sector);
  if (facets?.data_quality) params.set("data_quality", facets.data_quality);
  if (facets?.corpus_status) params.set("corpus_status", facets.corpus_status);
  return getJson(`/api/companies/search?${params}`);
}

export function fetchSectorLeaderboard(opts?: {
  market?: string;
  index?: string;
  limit?: number;
}): Promise<{
  market?: string;
  index?: string;
  count: number;
  sectors: Array<{
    sector: string;
    avg: number | null;
    count: number;
    best: { id: string; ticker: string; name: string; gci_score: number | null } | null;
  }>;
}> {
  const params = new URLSearchParams();
  if (opts?.market) params.set("market", opts.market);
  if (opts?.index) params.set("index", opts.index);
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return getJson(`/api/sectors/leaderboard${qs ? `?${qs}` : ""}`);
}

export function fetchCompanyChanges(id: string): Promise<{
  company_id: string;
  wow_pct?: number | null;
  mom_pct?: number | null;
  qoq_pct?: number | null;
  yoy_pct?: number | null;
  pop_pct?: number | null;
  pop_horizon?: string | null;
}> {
  return getJson(`/api/companies/${id}/changes`);
}

export function fetchCompanyAnalytics(id: string): Promise<{
  company_id: string;
  dependent?: string;
  independents?: string[];
  gci_price_corr?: number | null;
  lead_lag_gci_vs_price?: {
    best?: { lag: number; corr: number | null } | null;
    lags: Array<{ lag: number; corr: number | null }>;
  };
  correlation_matrix?: {
    variables: string[];
    matrix: Record<string, Record<string, number | null>>;
  };
  impact_factors?: Array<{
    factor: string;
    score: number;
    impact_vs_gci: number;
  }>;
  sample_n?: number;
  window_label?: string;
  experimental?: boolean;
  show_experimental_ui?: boolean;
  methodology?: string;
  note?: string;
  series_kind?: string;
  citeable?: boolean;
  pit_as_of?: string[];
  granger?: {
    enabled?: boolean;
    disclaimer?: string;
    sample_n?: number;
    var_ready?: boolean;
    lasso_selected?: Array<{ factor: string; coef?: number; corr?: number | null }>;
    granger_tests?: Array<{
      factor?: string;
      ok?: boolean;
      reason?: string;
      f_stat?: number;
      p_value?: number;
      significant_0_05?: boolean;
      best?: { lag?: number; corr?: number | null };
      method?: string;
    }>;
    impact_map?: Array<{
      from?: string;
      to?: string;
      weight?: number;
      p_value?: number;
      lag?: number;
    }>;
  };
}> {
  return getJson(`/api/companies/${id}/analytics`);
}

export function fetchCompanyDocs(
  id: string,
  period?: string
): Promise<{
  company_id: string;
  count: number;
  documents: Array<Record<string, unknown>>;
  completeness?: {
    periods: Array<{
      period: string;
      status: string;
      doc_count: number;
      expected_types?: string[];
      types_complete?: boolean;
      type_coverage?: Record<string, boolean>;
      documents?: Array<Record<string, unknown>>;
    }>;
    summary?: {
      accepted_periods: number;
      total_periods: number;
      complete: boolean;
      citeable_bound_outcomes?: number;
      citeable_pct?: number;
      types_complete_periods?: number;
      tier1_gate?: boolean;
    };
    note?: string;
  };
}> {
  const params = new URLSearchParams();
  if (period) params.set("period", period);
  const qs = params.toString();
  return getJson(`/api/companies/${id}/docs${qs ? `?${qs}` : ""}`);
}

export function fetchNotes(companyId?: string): Promise<{
  notes: Array<{ id: string; title: string; body: string; company_id: string }>;
}> {
  const params = new URLSearchParams();
  if (companyId) params.set("company_id", companyId);
  const qs = params.toString();
  return getJson(`/api/notes${qs ? `?${qs}` : ""}`, {
    headers: { "X-API-Key": API_KEY },
  });
}

export function postNote(body: {
  company_id: string;
  title?: string;
  body: string;
  id?: string;
}): Promise<unknown> {
  return getJson("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
    body: JSON.stringify(body),
  });
}

export function fetchReportTemplates(): Promise<{
  templates: Array<{ id: string; name: string; role: string; industry: string }>;
}> {
  return getJson("/api/reports/templates");
}

export function postGenerateReport(body: {
  company_id: string;
  template_id: string;
}): Promise<{ markdown: string; template_name: string }> {
  return getJson("/api/reports/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
    body: JSON.stringify(body),
  });
}

export function postEnsureCitations(opts?: {
  company_id?: string;
  limit?: number;
}): Promise<Record<string, unknown>> {
  const params = new URLSearchParams();
  if (opts?.company_id) params.set("company_id", opts.company_id);
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return getJson(`/api/ingest/ensure-citations${qs ? `?${qs}` : ""}`, {
    method: "POST",
    headers: { "X-API-Key": API_KEY },
  });
}

export function postTierFoundation(limit?: number): Promise<{
  ok: boolean;
  citations?: Record<string, unknown>;
  pit_warehouse?: Record<string, unknown>;
}> {
  const qs = limit != null ? `?limit=${limit}` : "";
  return getJson(`/api/ingest/tier-foundation${qs}`, {
    method: "POST",
    headers: { "X-API-Key": API_KEY },
  });
}

export function fetchSectorBenchmark(sector: string): Promise<{
  sector: string;
  company_count: number;
  avg_gci: number | null;
  companies: CompanySummary[];
}> {
  return getJson(`/api/sectors/${encodeURIComponent(sector)}/benchmark`);
}

export function fetchAlerts(): Promise<AlertItem[]> {
  return getJson("/api/alerts");
}

export function fetchHistory(
  id: string
): Promise<
  {
    as_of: string;
    gci_score: number | null;
    prior_gci?: number | null;
    change_pct?: number | null;
    change_horizon?: string | null;
  }[]
> {
  return getJson(`/api/companies/${id}/gci/history`);
}

export function postReview(body: {
  company_id: string;
  outcome_index: number;
  action: "accept" | "edit" | "reject";
  comment?: string;
  edits?: Record<string, unknown>;
}): Promise<unknown> {
  return getJson("/api/review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(body),
  });
}

export type PendingStatement = {
  company_id: string;
  period: string;
  metric: string;
  guided_value: number;
  guided_low?: number | null;
  guided_high?: number | null;
  actual_value?: number | null;
  guided_text: string;
  confidence: number;
  speaker: string;
  thread_id?: string | null;
  source_ref?: string | null;
  quote_span?: string | null;
  review_status?: string;
  needs_review?: boolean;
};

export type PendingExtractBatch = {
  id: string;
  company_id: string;
  statements: PendingStatement[];
  status: string;
  accepted_count?: number;
};

export function postExtract(
  companyId: string,
  opts?: { text?: string; period?: string; sourceRef?: string }
): Promise<{ statements: PendingStatement[]; count: number; extract_id?: string }> {
  const body: Record<string, unknown> = { company_id: companyId };
  if (opts?.text) body.text = opts.text;
  if (opts?.period) body.period = opts.period;
  if (opts?.sourceRef) body.source_ref = opts.sourceRef;
  return getJson("/api/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(body),
  });
}

export function fetchExtractPending(
  companyId?: string
): Promise<{ count: number; batches: PendingExtractBatch[] }> {
  const qs = companyId ? `?company_id=${encodeURIComponent(companyId)}` : "";
  return getJson(`/api/extract/pending${qs}`, {
    headers: { "X-API-Key": API_KEY },
  });
}

export function postExtractCommit(body: {
  extract_id: string;
  accepted_indices: number[];
  edits?: Record<number, Record<string, unknown>>;
}): Promise<{ ok: boolean; committed: number; edited?: number; company_id: string }> {
  return getJson("/api/extract/commit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(body),
  });
}

export type ReviewRecord = {
  company_id: string;
  action: string;
  reviewer?: string;
  source?: string;
  at?: string;
  comment?: string | null;
  edits?: Record<string, unknown>;
  outcome_index?: number;
  statement_index?: number;
};

export function fetchReviews(): Promise<{ reviews: ReviewRecord[] }> {
  return getJson("/api/reviews", {
    headers: { "X-API-Key": API_KEY },
  });
}

export function postIngestPaste(body: {
  company_id: string;
  text: string;
  title?: string;
  doc_type?: string;
}): Promise<{
  ok: boolean;
  document: { doc_id: string; title: string };
  extract?: { id?: string; statements?: unknown[] } | null;
  note?: string;
}> {
  return getJson("/api/ingest/paste", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(body),
  });
}

export function postIngestUrl(body: {
  company_id: string;
  url: string;
  title?: string;
}): Promise<{
  ok: boolean;
  document: { doc_id: string; title: string };
  extract?: { id?: string; statements?: unknown[] } | null;
}> {
  return getJson("/api/ingest/url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(body),
  });
}

export type CrawlReport = {
  ok: boolean;
  as_of: string;
  dry_run: boolean;
  live: boolean;
  targets: number;
  fetched: number;
  catalog: number;
  skipped_dedupe: number;
  failed: number;
  pending_new: number;
  pending_total: number;
  pending_by_company: Record<string, number>;
  note?: string;
};

export function postIngestCrawl(body?: {
  limit?: number;
  dry_run?: boolean;
  live?: boolean;
  company_ids?: string[];
}): Promise<CrawlReport> {
  return getJson("/api/ingest/crawl", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(body ?? { limit: 30, dry_run: false, live: true }),
  });
}

export type RefreshReport = {
  ok: boolean;
  live: boolean;
  interval_hours: number;
  crawl: Record<string, unknown>;
  extract: Record<string, unknown>;
  fmp: Record<string, unknown>;
  note?: string;
};

export function postIngestRefresh(body?: {
  limit?: number;
  live?: boolean;
  auto_extract?: boolean;
  warm_fmp?: boolean;
}): Promise<RefreshReport> {
  return getJson("/api/ingest/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(body ?? { limit: 30, live: true }),
  });
}

export function fetchCrawlStatus(): Promise<{
  last: Record<string, unknown> | null;
  runs: Record<string, unknown>[];
  pending_total: number;
  pending_by_company: Record<string, number>;
}> {
  return getJson("/api/ingest/crawl/status", {
    headers: { "X-API-Key": API_KEY },
  });
}

export function fetchDocuments(params?: {
  company_id?: string;
  review_status?: string;
}): Promise<{ count: number; documents: Record<string, unknown>[] }> {
  const q = new URLSearchParams();
  if (params?.company_id) q.set("company_id", params.company_id);
  if (params?.review_status) q.set("review_status", params.review_status);
  const qs = q.toString() ? `?${q}` : "";
  return getJson(`/api/documents${qs}`);
}

export function fetchResearchSearch(
  q: string,
  companyId?: string
): Promise<{ results: ResearchDoc[]; count: number }> {
  const params = new URLSearchParams({ q });
  if (companyId) params.set("company_id", companyId);
  return getJson(`/api/research/search?${params}`);
}

export function fetchResearchChat(
  question: string,
  companyId?: string
): Promise<{ answer: string; citations: ResearchDoc[] }> {
  return getJson("/api/research/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, company_id: companyId }),
  });
}

export function fetchResearchSnapshot(id: string): Promise<ResearchSnapshot> {
  return getJson(`/api/research/snapshot/${id}`);
}

export function fetchResearchEstimates(
  id: string
): Promise<{ estimates: ResearchEstimateRow[] }> {
  return getJson(`/api/research/estimates/${id}`);
}

export type PromiseBriefItem = {
  period: string;
  metric: string;
  guided_value: number;
  guided_band: (number | null)[];
  guided_text: string;
  speaker: string;
  confidence: number;
  source_url?: string | null;
  source_ref?: string | null;
  street_consensus: number;
  street_source: string;
  history: {
    closed: number;
    met: number;
    exceeded: number;
    missed: number;
    dropped: number;
    kept: number;
    hit_rate_pct: number | null;
  };
};

export type PromiseBrief = {
  company_id: string;
  name: string;
  ticker: string;
  sector: string;
  gci_score: number | null;
  gci_change_pct?: number | null;
  gci_change_horizon?: string | null;
  data_quality: string;
  open_promise_count: number;
  promises: PromiseBriefItem[];
  note: string;
  disclaimer: string;
};

export function fetchResearchBrief(companyId: string): Promise<PromiseBrief> {
  return getJson(`/api/research/brief/${encodeURIComponent(companyId)}`);
}

export function fetchResearchNews(
  companyId?: string
): Promise<{ items: ResearchDoc[] }> {
  const params = new URLSearchParams();
  if (companyId) params.set("company_id", companyId);
  const qs = params.toString();
  return getJson(`/api/research/news${qs ? `?${qs}` : ""}`);
}

export function fetchResearchWatchlist(): Promise<{ items: WatchlistItem[] }> {
  return getJson("/api/research/watchlist");
}

export function fetchResearchTranscripts(
  companyId?: string
): Promise<{ transcripts: ResearchDoc[] }> {
  const params = new URLSearchParams();
  if (companyId) params.set("company_id", companyId);
  const qs = params.toString();
  return getJson(`/api/research/transcripts${qs ? `?${qs}` : ""}`);
}

export type WordmapPayload = {
  company_id: string;
  entity: Record<string, number>;
  industry: Record<string, number | null>;
  sector: string;
  peer_count: number;
  source?: string;
  citeable?: boolean;
  note?: string;
};

export type LabelingQueueItem = {
  id: string;
  company_id: string;
  company_name?: string;
  data_quality?: string;
  priority?: string;
  status?: string;
  note?: string;
};

export type VernacularPayload = {
  company_id: string;
  lang: string;
  text: string;
  supported_langs: string[];
  status: string;
};

export type BadgePayload = {
  ticker: string;
  trust_score: number | null;
  label: string;
  embed: string;
  svg_url: string;
  status: string;
  disclaimer: string;
};

export type OrgPayload = {
  id: string;
  name?: string;
  seats?: number;
  seats_used?: number;
  seats_available?: number;
  plan?: string;
  csm?: string;
  features?: string[];
  [key: string]: unknown;
};

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  };
}

export function fetchWordmap(id: string): Promise<WordmapPayload> {
  return getJson(`/api/companies/${id}/wordmap`);
}

export function fetchVernacular(id: string, lang = "hi"): Promise<VernacularPayload> {
  return getJson(`/api/vernacular/${id}?lang=${encodeURIComponent(lang)}`);
}

export function fetchBadge(ticker: string): Promise<BadgePayload> {
  return getJson(`/api/badge/${encodeURIComponent(ticker)}`);
}

export function fetchOrg(orgId = "demo"): Promise<OrgPayload> {
  return getJson(`/api/orgs/${orgId}`, {
    headers: { "X-API-Key": API_KEY },
  });
}

export function postAlphaHunterImport(body: {
  facts: Record<string, unknown>[];
  merge_into_company?: string;
}): Promise<{ actuals: unknown[]; merged?: number }> {
  return getJson("/api/import/alphahunter", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
}

export function fetchAlphaHunterStatus(): Promise<{
  configured: boolean;
  api_key_set: boolean;
  url_host: string | null;
  note: string;
}> {
  return getJson("/api/import/alphahunter/status");
}

export function postAlphaHunterLive(opts: {
  company_id: string;
  merge?: boolean;
}): Promise<{
  ok?: boolean;
  source?: string;
  fact_count?: number;
  merged?: number;
  note?: string;
}> {
  const qs = new URLSearchParams({
    company_id: opts.company_id,
    merge: opts.merge === false ? "false" : "true",
  });
  return getJson(`/api/import/alphahunter/live?${qs}`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export function fetchNiftyMilestones(): Promise<{
  milestones: Array<{
    id: string;
    title: string;
    target: string;
    status: string;
  }>;
  counts: Record<string, number>;
  progress: { done: number; total: number };
  note: string;
  day1_claim: boolean;
}> {
  return getJson("/api/universe/nifty/milestones");
}

export function postNiftyEnqueueLabeling(): Promise<{
  ok: boolean;
  enqueued: number;
  milestones: {
    milestones: Array<{ id: string; title: string; status: string }>;
  };
}> {
  return getJson("/api/universe/nifty/enqueue-labeling", {
    method: "POST",
    headers: authHeaders(),
  });
}

export function fetchCsmDashboard(orgId = "demo"): Promise<{
  org: OrgPayload;
  csm: { named: string; email: string; qbr_cadence: string; next_qbr_hint: string };
  sla: {
    plan: string;
    targets: { uptime_pct: number; sev1_hours: number; channel: string };
    observed: { uptime_pct: number | null; checks: number; note?: string };
    within_target: boolean | null;
  };
  labeling_open: number;
  tickets_open: number;
  tickets: Array<{ id: string; subject: string; severity: string; status: string }>;
  vpc: { status: string; private_subnet_example: string; note: string };
  note: string;
}> {
  return getJson(`/api/csm/${encodeURIComponent(orgId)}`, {
    headers: { "X-API-Key": API_KEY },
  });
}

export function postCsmTicket(
  orgId: string,
  body: { subject: string; severity?: string; body?: string },
): Promise<{ ok: boolean; ticket: { id: string } }> {
  return getJson(`/api/csm/${encodeURIComponent(orgId)}/tickets`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
}

export function fetchSsoStatus(): Promise<{
  enabled: boolean;
  configured: boolean;
  ready?: boolean;
  coming_soon?: boolean;
  note?: string;
  login_url?: string | null;
}> {
  return getJson("/api/auth/sso/status");
}

export function fetchSsoLogin(): Promise<{
  status: string;
  authorize_url: string | null;
  message?: string;
}> {
  return getJson("/api/auth/sso/login");
}

export function fetchLabelingQueue(orgId?: string): Promise<{
  items: LabelingQueueItem[];
  count: number;
}> {
  const qs = orgId ? `?org_id=${encodeURIComponent(orgId)}` : "";
  return getJson(`/api/labeling/queue${qs}`, { headers: { "X-API-Key": API_KEY } });
}

export function postLabelingQueue(body: {
  company_id: string;
  priority?: string;
  note?: string;
  org_id?: string;
}): Promise<{ ok: boolean; item: LabelingQueueItem }> {
  return getJson("/api/labeling/queue", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
}

export function fetchEmFactorCsvUrl(companyId: string): string {
  return `${API_BASE || ""}/api/export/em-factor/${encodeURIComponent(companyId)}?format=csv`;
}

export type MetricCatalogRow = {
  id: string;
  display_name: string;
  unit: string;
  family: string;
  sectors: string[];
  aliases: string[];
  tier: string;
  bands_preferred: boolean;
  outcome_count?: number;
};

export function fetchMetrics(sector?: string): Promise<{ count: number; metrics: MetricCatalogRow[] }> {
  const qs = sector ? `?sector=${encodeURIComponent(sector)}` : "";
  return getJson(`/api/metrics${qs}`);
}

export function apiDocsUrl(): string {
  return `${API_BASE || ""}/docs`;
}

export function demoApiKey(): string {
  return API_KEY;
}

export type UserPreferences = {
  language: string;
  default_market: string;
  default_index: string;
  watchlist: string[];
  show_demo_tape: boolean;
  density?: "comfortable" | "compact";
};

export type AuthUser = {
  id: string;
  email: string | null;
  name: string;
  kind: "registered" | "guest";
  preferences: UserPreferences;
  created_at?: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type Market = {
  id: string;
  name: string;
  currency: string;
  timezone: string;
};

export type MarketIndex = {
  id: string;
  market_id: string;
  name: string;
  ticker: string;
  constituent_count?: number;
};

async function authJson<T>(
  path: string,
  init?: RequestInit,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = `Request failed: ${res.status}`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export function postRegister(body: {
  email: string;
  password: string;
  name: string;
  guest_token?: string;
  preferences?: Partial<UserPreferences>;
}): Promise<AuthSession> {
  return authJson("/api/auth/register", { method: "POST", body: JSON.stringify(body) });
}

export function postLogin(email: string, password: string): Promise<AuthSession> {
  return authJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function postGuest(): Promise<AuthSession> {
  return authJson("/api/auth/guest", { method: "POST", body: "{}" });
}

export function postLogout(token: string): Promise<{ status: string }> {
  return authJson("/api/auth/logout", { method: "POST" }, token);
}

export function fetchAuthMe(token: string): Promise<{ user: AuthUser }> {
  return authJson("/api/auth/me", undefined, token);
}

export function fetchPreferences(token: string): Promise<{ preferences: UserPreferences }> {
  return authJson("/api/auth/preferences", undefined, token);
}

export function putPreferences(
  token: string,
  patch: Partial<UserPreferences>,
): Promise<{ preferences: UserPreferences }> {
  return authJson(
    "/api/auth/preferences",
    { method: "PUT", body: JSON.stringify(patch) },
    token,
  );
}

export function fetchMarkets(): Promise<{
  count: number;
  markets: Market[];
  gci_deep_markets: string[];
  note: string;
}> {
  return getJson("/api/markets");
}

export function fetchMarketIndexes(marketId: string): Promise<{
  market_id: string;
  count: number;
  indexes: MarketIndex[];
  gci_deep: boolean;
}> {
  return getJson(`/api/markets/${encodeURIComponent(marketId)}/indexes`);
}

export function fetchIndexConstituents(indexId: string): Promise<{
  index: MarketIndex;
  count: number;
  constituents: unknown[];
  gci_deep: boolean;
}> {
  return getJson(`/api/indexes/${encodeURIComponent(indexId)}/constituents`);
}

export type HistoryPoint = {
  date: string;
  close: number;
  volume?: number;
};

export type IndexHistory = {
  index_id: string;
  market_id: string;
  name: string;
  ticker: string;
  years: number;
  points: HistoryPoint[];
  point_count: number;
  last: number;
  change_pct: number | null;
  data_quality: string;
  kind: string;
  note: string;
};

export type StockHistory = {
  stock_id: string;
  name: string;
  ticker: string;
  market_id?: string;
  years: number;
  points: HistoryPoint[];
  point_count: number;
  last: number;
  change_pct: number | null;
  fundamentals: {
    fiscal_year: string;
    revenue_growth_pct?: number;
    operating_margin_pct?: number;
  }[];
  data_quality: string;
  kind: string;
  note: string;
};

export function fetchMarketHistory(
  marketId: string,
  opts?: { index?: string; years?: number },
): Promise<{
  market_id: string;
  market_name: string;
  currency: string;
  index: IndexHistory;
  kind: string;
  note: string;
}> {
  const params = new URLSearchParams();
  if (opts?.index) params.set("index", opts.index);
  if (opts?.years) params.set("years", String(opts.years));
  const qs = params.toString();
  return getJson(
    `/api/markets/${encodeURIComponent(marketId)}/history${qs ? `?${qs}` : ""}`,
  );
}

export function fetchStockHistory(
  stockId: string,
  years = 5,
): Promise<StockHistory> {
  return getJson(
    `/api/stocks/${encodeURIComponent(stockId)}/history?years=${years}`,
  );
}
