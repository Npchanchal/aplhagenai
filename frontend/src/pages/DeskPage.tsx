import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ChangeChip from "../components/ChangeChip";
import {
  BarChart,
  CompareBars,
  DonutChart,
  FAMILY_COLORS,
  LineChart,
} from "../components/Charts";
import CompanyPicker from "../components/CompanyPicker";
import DeskConsole from "../components/DeskConsole";
import Disclaimer from "../components/Disclaimer";
import InfoTip from "../components/InfoTip";
import PilotChecklistPanel from "../components/PilotChecklistPanel";
import LabelWorkbench from "../components/LabelWorkbench";
import FeedbackInbox from "../components/FeedbackInbox";
import TabBar from "../components/TabBar";
import Toast from "../components/Toast";
import PlanAccessGate from "../components/PlanAccessGate";
import {
  apiDocsUrl,
  demoApiKey,
  fetchBadge,
  fetchCompanies,
  fetchCompanyGci,
  fetchExtractPending,
  fetchHistory,
  fetchOrg,
  fetchMetrics,
  fetchReviews,
  fetchVernacular,
  fetchWordmap,
  postAlphaHunterImport,
  fetchAlphaHunterStatus,
  postAlphaHunterLive,
  fetchNiftyMilestones,
  postNiftyEnqueueLabeling,
  fetchCsmDashboard,
  postCsmTicket,
  postExtract,
  postExtractCommit,
  postIngestPaste,
  postIngestUrl,
  postIngestRefresh,
  fetchCrawlStatus,
  fetchDocuments,
  postDocumentReview,
  fetchCorpusCoverage,
  fetchPendingDepth,
  postPendingDepthBootstrap,
  postIngestCrawl,
  postConsensusImport,
  fetchConsensusStats,
  fetchSsoStatus,
  fetchReportTemplates,
  postGenerateReport,
  downloadIcAuditPdf,
  fetchOpsThroughput,
  fetchPitContract,
  fetchPitHistoryV1,
  postEnsureCitations,
  postTierFoundation,
  fetchLabelingQueue,
  postLabelingQueue,
  fetchEmFactorCsvUrl,
  type BadgePayload,
  type CompanyGCIDetail,
  type CompanySummary,
  type MetricCatalogRow,
  type OrgPayload,
  type PendingExtractBatch,
  type ReviewRecord,
  type VernacularPayload,
  type WordmapPayload,
  type LabelingQueueItem,
} from "../lib/api";
import { formatScore } from "../lib/score";
import { tipText } from "../lib/glossary";
import { useAuth } from "../lib/auth";
import { useEntitlements } from "../lib/entitlements";
import { useI18n } from "../i18n";

const TABS = [
  { id: "console", label: "Console", title: "Multi-pane GCI ops console" },
  { id: "review", label: "Review queue", title: tipText("extract") },
  { id: "corpus", label: "Corpus", title: tipText("tier1") },
  { id: "reports", label: "Reports", title: tipText("citability") },
  { id: "pit", label: "API / PIT", title: tipText("pit") },
  { id: "import", label: "Facts import", title: tipText("alphahunter") },
  { id: "parameters", label: "Parameters", title: tipText("gci_parameter") },
  { id: "wordmap", label: "Wordmap", title: tipText("sentiment") },
  { id: "vernacular", label: "Vernacular", title: tipText("gci") },
  { id: "labeling", label: "Labeling", title: tipText("labeling_queue") },
  { id: "feedback", label: "Feedback", title: "Design-partner quality flags" },
  { id: "csm", label: "CSM", title: tipText("csm") },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PRIMARY_TABS = TABS.filter((t) =>
  ["console", "review", "corpus", "reports", "pit"].includes(t.id),
);
const MORE_TAB_IDS = new Set(["import", "parameters", "wordmap", "vernacular", "labeling", "feedback", "csm"]);

const DEFAULT_FACTS = `[
  {
    "period": "FY25",
    "metric": "revenue_growth_pct",
    "guided_low": 5,
    "guided_high": 8,
    "actual_value": 7.1,
    "guidance_change": "Imported guidance fact",
    "source_ref": "alphahunter-demo"
  }
]`;

type StatementDecision = {
  action: "accept" | "reject";
  editing: boolean;
  period: string;
  low: string;
  high: string;
};

export default function DeskPage() {
  const { preferences } = useAuth();
  const { has } = useEntitlements();
  const { t, lang: uiLang } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: TabId = TABS.some((x) => x.id === tabParam)
    ? (tabParam as TabId)
    : "console";
  const setTab = useCallback(
    (id: TabId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", id);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );
  const dismissToast = useCallback(() => setMsg(null), []);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [companyId, setCompanyId] = useState("infy");
  const [detail, setDetail] = useState<CompanyGCIDetail | null>(null);
  const [history, setHistory] = useState<
    {
      as_of: string;
      gci_score: number | null;
      change_pct?: number | null;
      change_horizon?: string | null;
    }[]
  >([]);
  const [wordmap, setWordmap] = useState<WordmapPayload | null>(null);
  const [vernacular, setVernacular] = useState<VernacularPayload | null>(null);
  const [lang, setLang] = useState<string>(uiLang);

  useEffect(() => {
    setLang(uiLang);
  }, [uiLang]);
  const [badge, setBadge] = useState<BadgePayload | null>(null);
  const [org, setOrg] = useState<OrgPayload | null>(null);
  const [labelQueue, setLabelQueue] = useState<LabelingQueueItem[]>([]);
  const [factsJson, setFactsJson] = useState(DEFAULT_FACTS);
  const [ahStatus, setAhStatus] = useState<{
    configured: boolean;
    note: string;
    url_host: string | null;
  } | null>(null);
  const [niftyMs, setNiftyMs] = useState<{
    milestones: Array<{ id: string; title: string; target: string; status: string }>;
    counts: Record<string, number>;
    nifty_extra_ids?: string[];
    note: string;
    progress: { done: number; total: number };
  } | null>(null);
  const [csmDash, setCsmDash] = useState<Awaited<ReturnType<typeof fetchCsmDashboard>> | null>(
    null,
  );
  const [ticketSubject, setTicketSubject] = useState("");
  const [catalog, setCatalog] = useState<MetricCatalogRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiOut, setApiOut] = useState<string>("");

  // Review queue state
  const [pasteText, setPasteText] = useState("");
  const [ingestUrlValue, setIngestUrlValue] = useState("");
  const [extractPeriod, setExtractPeriod] = useState("FY26");
  const [pendingBatches, setPendingBatches] = useState<PendingExtractBatch[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [decisions, setDecisions] = useState<
    Record<string, Record<number, StatementDecision>>
  >({});
  const [queueBusy, setQueueBusy] = useState(false);
  const [crawlBusy, setCrawlBusy] = useState(false);
  const [pendingDocs, setPendingDocs] = useState(0);
  const [lastCrawl, setLastCrawl] = useState<string | null>(null);
  const [foundationBusy, setFoundationBusy] = useState(false);
  const [reportTemplates, setReportTemplates] = useState<
    Array<{ id: string; name: string; role: string; industry: string }>
  >([]);
  const [reportTpl, setReportTpl] = useState("ic_audit");
  const [reportMd, setReportMd] = useState<string | null>(null);
  const [reportJson, setReportJson] = useState<string | null>(null);
  const [throughput, setThroughput] = useState<Record<string, unknown> | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [corpusCov, setCorpusCov] = useState<Record<string, unknown> | null>(null);
  const [pendingDepth, setPendingDepth] = useState<Record<string, unknown> | null>(null);
  const [pendingDocRows, setPendingDocRows] = useState<Record<string, unknown>[]>([]);
  const [consensusJson, setConsensusJson] = useState("");
  const [consensusStats, setConsensusStats] = useState<{
    row_count: number;
    company_count: number;
  } | null>(null);
  const [ssoStatus, setSsoStatus] = useState<{
    enabled?: boolean;
    configured?: boolean;
    production_ready?: boolean;
    ready?: boolean;
    note?: string;
    checklist?: Record<string, boolean>;
  } | null>(null);
  const [labelNiftyOnly, setLabelNiftyOnly] = useState(false);

  const market = preferences?.default_market ?? "IN";
  const index = preferences?.default_index ?? "SENSEX";

  const selected = useMemo(
    () => companies.find((c) => c.id === companyId) ?? null,
    [companies, companyId]
  );

  useEffect(() => {
    fetchCompanies({ market, index, limit: 200 })
      .then((rows) => {
        setCompanies(rows);
        if (!rows.find((r) => r.id === companyId) && rows[0]) {
          setCompanyId(rows[0].id);
        }
      })
      .catch((e: Error) => setError(e.message));
    fetchOrg("demo")
      .then(setOrg)
      .catch(() => setOrg(null));
    fetchLabelingQueue()
      .then((r) => setLabelQueue(r.items || []))
      .catch(() => setLabelQueue([]));
    fetchAlphaHunterStatus()
      .then(setAhStatus)
      .catch(() => setAhStatus(null));
    fetchNiftyMilestones()
      .then((r) =>
        setNiftyMs({
          milestones: r.milestones,
          counts: r.counts as Record<string, number>,
          nifty_extra_ids: r.nifty_extra_ids,
          note: r.note,
          progress: r.progress,
        }),
      )
      .catch(() => setNiftyMs(null));
    fetchCsmDashboard("demo")
      .then(setCsmDash)
      .catch(() => setCsmDash(null));
    fetchMetrics()
      .then((r) => setCatalog(r.metrics))
      .catch(() => setCatalog([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, index]);

  useEffect(() => {
    if (!companyId) return;
    const row = companies.find((c) => c.id === companyId);
    if (row?.data_quality === "market_scaffold" || (row && row.gci_score == null && row.market_id && row.market_id !== "IN")) {
      setDetail(null);
      setHistory([]);
      setWordmap(null);
      setVernacular(null);
      setBadge(null);
      setError(null);
      setMsg(t("desk.scaffold"));
      return;
    }
    setError(null);
    setMsg(null);
    Promise.all([
      fetchCompanyGci(companyId),
      fetchHistory(companyId),
      fetchWordmap(companyId),
      fetchVernacular(companyId, lang),
    ])
      .then(([d, h, w, v]) => {
        setDetail(d);
        setHistory(h);
        setWordmap(w);
        setVernacular(v);
        return fetchBadge(d.ticker).catch(() => null);
      })
      .then(setBadge)
      .catch((e: Error) => setError(e.message));
  }, [companyId, lang, companies]);

  const loadQueue = (cid: string) => {
    fetchExtractPending(cid)
      .then((r) => setPendingBatches(r.batches.filter((b) => b.status === "pending")))
      .catch(() => setPendingBatches([]));
    fetchReviews()
      .then((r) => setReviews(r.reviews.slice(-10).reverse()))
      .catch(() => setReviews([]));
  };

  useEffect(() => {
    if (tab === "review" && companyId) loadQueue(companyId);
    if (tab === "review" || tab === "corpus") {
      fetchCrawlStatus()
        .then((s) => {
          setPendingDocs(s.pending_total);
          setLastCrawl(
            s.last && typeof s.last.as_of === "string" ? String(s.last.as_of) : null
          );
        })
        .catch(() => {
          setPendingDocs(0);
          setLastCrawl(null);
        });
      fetchDocuments({ review_status: "pending" })
        .then((r) => {
          setPendingDocs(r.count);
          setPendingDocRows(r.documents || []);
        })
        .catch(() => undefined);
    }
    if (tab === "corpus") {
      fetchCorpusCoverage()
        .then((c) => setCorpusCov(c as Record<string, unknown>))
        .catch(() => setCorpusCov(null));
      fetchPendingDepth()
        .then((d) => setPendingDepth(d))
        .catch(() => setPendingDepth(null));
    }
    if (tab === "import") {
      fetchConsensusStats()
        .then(setConsensusStats)
        .catch(() => setConsensusStats(null));
    }
    if (tab === "csm" || tab === "console") {
      fetchSsoStatus()
        .then((s) => setSsoStatus(s))
        .catch(() => setSsoStatus(null));
    }
    if (tab === "reports") {
      fetchReportTemplates()
        .then((r) => {
          setReportTemplates(r.templates || []);
          if (r.templates?.[0] && !r.templates.find((t) => t.id === reportTpl)) {
            setReportTpl(r.templates[0].id);
          }
        })
        .catch(() => setReportTemplates([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, companyId]);

  const decisionFor = (batchId: string, idx: number): StatementDecision =>
    decisions[batchId]?.[idx] ?? {
      action: "accept",
      editing: false,
      period: "",
      low: "",
      high: "",
    };

  const setDecision = (batchId: string, idx: number, patch: Partial<StatementDecision>) => {
    setDecisions((prev) => ({
      ...prev,
      [batchId]: {
        ...(prev[batchId] ?? {}),
        [idx]: { ...decisionFor(batchId, idx), ...patch },
      },
    }));
  };

  const commitBatch = async (batch: PendingExtractBatch) => {
    setQueueBusy(true);
    try {
      const accepted: number[] = [];
      const edits: Record<number, Record<string, unknown>> = {};
      batch.statements.forEach((_, i) => {
        const d = decisionFor(batch.id, i);
        if (d.action === "reject") return;
        accepted.push(i);
        const e: Record<string, unknown> = {};
        if (d.period.trim()) e.period = d.period.trim();
        if (d.low.trim() !== "") e.guided_low = Number(d.low);
        if (d.high.trim() !== "") e.guided_high = Number(d.high);
        if (d.low.trim() !== "" && d.high.trim() !== "") {
          e.guided_value = (Number(d.low) + Number(d.high)) / 2;
        }
        if (Object.keys(e).length > 0) edits[i] = e;
      });
      const res = await postExtractCommit({
        extract_id: batch.id,
        accepted_indices: accepted,
        edits: Object.keys(edits).length > 0 ? edits : undefined,
      });
      setMsg(
        `Committed ${res.committed} statement(s)` +
          (res.edited ? ` (${res.edited} edited)` : "") +
          ` — rejected ${batch.statements.length - accepted.length}`
      );
      loadQueue(companyId);
      const d = await fetchCompanyGci(companyId);
      setDetail(d);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setQueueBusy(false);
    }
  };

  const picker = (
    <div className="desk-picker-row">
      <CompanyPicker
        companies={companies}
        value={companyId}
        onChange={setCompanyId}
      />
      {detail && (
        <span className="muted" style={{ fontSize: 13 }}>
          GCI {formatScore(detail.gci_score)} ·{" "}
          <Link to={`/companies/${companyId}`}>Dossier</Link>
          {" · "}
          <Link to="/tracker">Universe</Link>
        </span>
      )}
    </div>
  );

  const moreTabs = TABS.filter((t) => {
    if (!MORE_TAB_IDS.has(t.id)) return false;
    if (t.id === "labeling") return has("labeling") || has("desk");
    if (t.id === "feedback") return has("feedback");
    if (t.id === "import") return has("desk_write");
    if (t.id === "wordmap") return has("wordmap") || has("desk");
    return true;
  });

  const primaryTabs = PRIMARY_TABS.filter((t) => {
    if (t.id === "review" || t.id === "corpus") return has("desk_write") || has("desk");
    if (t.id === "reports" || t.id === "pit") return has("ic_export") || has("desk");
    return true;
  });

  return (
    <PlanAccessGate
      feature="desk"
      title={t("desk.title")}
      kicker={t("desk.kicker")}
      description="Desk review, ingest, and labeling require a Pilot or Desk plan. Sign in if your org already has access."
      returnTo="/desk"
      testId="desk-access-gate"
    >
    <section className="desk-page" data-testid="desk-page">
      <Toast message={msg} onDismiss={dismissToast} />
      <p className="page-kicker">{t("desk.kicker")}</p>
      <h1>
        {t("desk.title")} <InfoTip termId="desk_sku" />
      </h1>
      <p className="muted lede">{t("desk.lede")}</p>

      <div className="desk-sticky">
        {picker}
        <TabBar
          tabs={[
            ...primaryTabs,
            { id: "more", label: "More", title: "Import, parameters, vernacular, labeling, CSM" },
          ]}
          active={MORE_TAB_IDS.has(tab) ? "more" : tab}
          onChange={(id) => {
            if (id === "more") setTab("import");
            else if (TABS.some((x) => x.id === id)) setTab(id as TabId);
          }}
          ariaLabel="Desk sections"
        />
        {MORE_TAB_IDS.has(tab) && (
          <div className="desk-more-tabs" role="tablist" aria-label="More desk tools">
            {moreTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`tab-bar-btn ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {tab === "console" && (
        <DeskConsole
          companyId={companyId}
          onSelectCompany={setCompanyId}
          onJumpTab={(id) => {
            if (id === "tracker" || id === "sectors") navigate("/tracker");
            else if (id === "evidence") navigate(`/companies/${companyId}`);
            else if (TABS.some((x) => x.id === id)) setTab(id as TabId);
          }}
        />
      )}

      {tab === "review" && (
        <div className="panel desk-panel" data-testid="review-queue-panel">
          <h2 style={{ marginTop: 0 }}>
            Guidance review queue <InfoTip termId="extract" />
          </h2>
          <p className="muted">
            Human-in-the-loop pipeline: ingest a transcript → extract candidate
            guidance → accept / edit / reject → commit. Only accepted statements
            enter GCI; every correction compounds the labeled corpus.
          </p>

          <div className="crawl-bar" data-testid="crawl-bar">
            <div>
              <strong>Live refresh</strong>
              <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                Scheduler runs every{" "}
                <strong>6 hours</strong> (`docker compose` service{" "}
                <code className="inline-code">scheduler</code> or{" "}
                <code className="inline-code">scripts/gci-refresh-loop.sh</code>
                ). Live IR fetch → pending docs + extract queue — Accept before GCI.
                {pendingDocs > 0
                  ? ` · ${pendingDocs} doc(s) awaiting review`
                  : " · no pending docs"}
                {lastCrawl ? ` · last ${lastCrawl}` : ""}
              </p>
            </div>
            <button
              type="button"
              className="btn"
              disabled={crawlBusy || queueBusy}
              data-testid="run-ir-crawl"
              onClick={async () => {
                setCrawlBusy(true);
                try {
                  const r = await postIngestRefresh({ limit: 30, live: true });
                  const c = r.crawl || {};
                  const ex = r.extract || {};
                  setMsg(
                    `Live refresh: ${c.pending_new ?? 0} new docs · ${ex.batches ?? 0} extract batch(es) · ${c.pending_total ?? 0} pending`
                  );
                  setPendingDocs(Number(c.pending_total ?? pendingDocs));
                  setLastCrawl(String(c.as_of ?? new Date().toISOString()));
                  loadQueue(companyId);
                } catch (e) {
                  setMsg((e as Error).message);
                } finally {
                  setCrawlBusy(false);
                }
              }}
            >
              {crawlBusy ? "Refreshing…" : "Run live refresh now"}
            </button>
          </div>

          <div className="queue-ingest">
            <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
              Primary path: live IR crawl keeps period docs in the queue (see status above).
              Paste below is the <strong>exception</strong> path when a transcript is not
              yet in the corpus.
            </p>
            <label className="desk-field">
              <span className="field-label">Exception · paste transcript</span>
              <textarea
                rows={6}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste concall / IR transcript text with quantified guidance…"
                spellCheck={false}
                data-testid="queue-paste"
              />
            </label>
            <div className="queue-ingest-row">
              <input
                value={ingestUrlValue}
                onChange={(e) => setIngestUrlValue(e.target.value)}
                placeholder="…or an IR page URL (https://)"
                data-testid="queue-url"
              />
              <input
                value={extractPeriod}
                onChange={(e) => setExtractPeriod(e.target.value)}
                style={{ maxWidth: 90 }}
                aria-label="Guidance period"
              />
              <button
                type="button"
                className="btn ghost"
                disabled={queueBusy || (!pasteText.trim() && !ingestUrlValue.trim())}
                onClick={async () => {
                  setQueueBusy(true);
                  try {
                    if (pasteText.trim()) {
                      const r = await postIngestPaste({
                        company_id: companyId,
                        text: pasteText,
                      });
                      const n = r.extract?.statements?.length ?? 0;
                      setMsg(
                        n > 0
                          ? `Ingested ${r.document.doc_id} · auto-extracted ${n} candidate(s) — review below`
                          : `Ingested ${r.document.doc_id} · no quantified guidance found to extract`
                      );
                      if (n > 0) loadQueue(companyId);
                    } else {
                      const r = await postIngestUrl({
                        company_id: companyId,
                        url: ingestUrlValue.trim(),
                      });
                      const n = r.extract?.statements?.length ?? 0;
                      setMsg(
                        n > 0
                          ? `Ingested ${r.document.doc_id} · auto-extracted ${n} candidate(s)`
                          : `Ingested ${r.document.doc_id}`
                      );
                      if (n > 0) loadQueue(companyId);
                    }
                  } catch (e) {
                    setMsg((e as Error).message);
                  } finally {
                    setQueueBusy(false);
                  }
                }}
              >
                Ingest to doc store
              </button>
              <button
                type="button"
                className="btn"
                disabled={queueBusy}
                data-testid="queue-extract"
                onClick={async () => {
                  setQueueBusy(true);
                  try {
                    const res = await postExtract(companyId, {
                      text: pasteText.trim() || undefined,
                      period: extractPeriod,
                      sourceRef: pasteText.trim() ? "desk-paste" : "seed-transcript",
                    });
                    setMsg(
                      res.count > 0
                        ? `2 · Extracted ${res.count} candidate statement(s) — review below`
                        : "No quantified guidance found in that text"
                    );
                    loadQueue(companyId);
                  } catch (e) {
                    setMsg((e as Error).message);
                  } finally {
                    setQueueBusy(false);
                  }
                }}
              >
                Run extract
              </button>
            </div>
          </div>

          <h3 style={{ marginBottom: 4 }}>Pending statements</h3>
          {pendingBatches.length === 0 && (
            <p className="muted" data-testid="queue-empty">
              Queue is clear — run an extract to add candidate statements.
            </p>
          )}
          {pendingBatches.map((batch) => (
            <div className="queue-batch" key={batch.id} data-testid={`batch-${batch.id}`}>
              <div className="queue-batch-head">
                <span className="muted" style={{ fontSize: 12 }}>
                  Batch <code className="inline-code">{batch.id.slice(0, 8)}</code> ·{" "}
                  {batch.statements.length} statement(s)
                </span>
                <button
                  type="button"
                  className="btn small"
                  disabled={queueBusy}
                  data-testid={`commit-${batch.id}`}
                  onClick={() => commitBatch(batch)}
                >
                  Commit decisions →
                </button>
              </div>
              {batch.statements.map((s, i) => {
                const d = decisionFor(batch.id, i);
                return (
                  <div
                    className={`queue-stmt ${d.action}`}
                    key={`${batch.id}-${i}`}
                    data-testid={`stmt-${batch.id}-${i}`}
                  >
                    <div className="queue-stmt-main">
                      <div className="queue-stmt-meta">
                        <strong>{s.metric.replaceAll("_", " ")}</strong>
                        <span className="muted">{s.period}</span>
                        <span className="queue-band">
                          {s.guided_low != null && s.guided_high != null
                            ? `${s.guided_low}–${s.guided_high}`
                            : s.guided_value}
                        </span>
                        <span className="muted">conf {s.confidence}</span>
                        <span className="muted">{s.speaker}</span>
                      </div>
                      <p className="muted queue-quote">“{s.guided_text}”</p>
                      {d.editing && (
                        <div className="edit-form">
                          <label>
                            <span className="field-label">Period</span>
                            <input
                              value={d.period || s.period}
                              onChange={(e) =>
                                setDecision(batch.id, i, { period: e.target.value })
                              }
                            />
                          </label>
                          <label>
                            <span className="field-label">Guided low</span>
                            <input
                              type="number"
                              value={d.low}
                              placeholder={String(s.guided_low ?? "")}
                              onChange={(e) =>
                                setDecision(batch.id, i, { low: e.target.value })
                              }
                            />
                          </label>
                          <label>
                            <span className="field-label">Guided high</span>
                            <input
                              type="number"
                              value={d.high}
                              placeholder={String(s.guided_high ?? "")}
                              onChange={(e) =>
                                setDecision(batch.id, i, { high: e.target.value })
                              }
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    <div className="review-actions">
                      <button
                        type="button"
                        className={`btn ghost small ${d.action === "accept" && !d.editing ? "active-lang" : ""}`}
                        onClick={() =>
                          setDecision(batch.id, i, { action: "accept", editing: false })
                        }
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className={`btn ghost small ${d.editing ? "active-lang" : ""}`}
                        onClick={() =>
                          setDecision(batch.id, i, { action: "accept", editing: !d.editing })
                        }
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`btn ghost small ${d.action === "reject" ? "active-lang" : ""}`}
                        onClick={() =>
                          setDecision(batch.id, i, { action: "reject", editing: false })
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          <h3 style={{ marginBottom: 4 }}>Recent review history</h3>
          {reviews.length === 0 ? (
            <p className="muted">No reviews recorded yet.</p>
          ) : (
            <div className="table-scroll">
              <table className="table" data-testid="review-history">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Company</th>
                    <th>Action</th>
                    <th>Source</th>
                    <th>Edits</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r, i) => (
                    <tr key={`${r.at}-${i}`}>
                      <td>{r.at ? r.at.slice(0, 16).replace("T", " ") : "—"}</td>
                      <td>{r.company_id}</td>
                      <td>
                        <span className={`pill ${r.action === "reject" ? "missed" : "met"}`}>
                          {r.action}
                        </span>
                      </td>
                      <td>{r.source ?? "dossier"}</td>
                      <td className="evidence-text">
                        {r.edits && Object.keys(r.edits).length > 0
                          ? Object.entries(r.edits)
                              .map(([k, v]) => `${k}=${String(v)}`)
                              .join(", ")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Disclaimer compact />
        </div>
      )}

      {tab === "corpus" && (
        <div className="panel desk-panel" data-testid="corpus-panel">
          <h2 style={{ marginTop: 0 }}>
            Tier 1 corpus <InfoTip termId="tier1" />
          </h2>
          <p className="muted">
            Coverage, IR crawl, pending doc Accept/Reject, and pending-depth bootstrap. Digests stay
            curated until analysts accept — never invent actuals.
          </p>
          {corpusCov && (
            <div className="metrics" data-testid="corpus-coverage">
              <div className="metric">
                <div className="label">Tier-1 pass</div>
                <div className="value" style={{ fontSize: 20 }}>
                  {String(corpusCov.tier1_gate_pass ?? corpusCov.tier1_pass ?? "—")} /{" "}
                  {String(
                    corpusCov.hand_labeled_sensex ??
                      (Array.isArray(corpusCov.companies)
                        ? (corpusCov.companies as unknown[]).length
                        : corpusCov.companies) ??
                      "—",
                  )}
                </div>
              </div>
              <div className="metric">
                <div className="label">Tier-1 rate</div>
                <div className="value" style={{ fontSize: 20 }}>
                  {corpusCov.tier1_gate_rate != null || corpusCov.tier1_rate_pct != null
                    ? `${Number(corpusCov.tier1_gate_rate ?? corpusCov.tier1_rate_pct).toFixed(1)}%`
                    : "—"}
                </div>
              </div>
            </div>
          )}
          {pendingDepth && (
            <p className="muted" style={{ fontSize: 13 }} data-testid="pending-depth-summary">
              Depth: LLM{" "}
              {String(
                (pendingDepth.flags as Record<string, unknown> | undefined)?.LLM_CONFIGURED ??
                  pendingDepth.llm_configured ??
                  "—",
              )}{" "}
              · SSO{" "}
              {String(
                ((pendingDepth.sso as Record<string, unknown> | undefined)?.production_ready ??
                  "—") as string,
              )}
            </p>
          )}
          <div className="crawl-bar">
            <div>
              <strong>Ingest lag</strong>
              <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                Live IR refresh every 6h.
                {pendingDocs > 0
                  ? ` · ${pendingDocs} doc(s) pending review`
                  : " · queue clear"}
                {lastCrawl ? ` · last ${lastCrawl}` : ""}
              </p>
            </div>
            <button
              type="button"
              className="btn"
              disabled={foundationBusy}
              data-testid="run-tier-foundation"
              onClick={async () => {
                setFoundationBusy(true);
                try {
                  const r = await postTierFoundation();
                  const cites = (r.citations || {}) as { companies?: number; linked?: number };
                  const pit = (r.pit_warehouse || {}) as {
                    companies?: number;
                    min_n?: number;
                  };
                  setMsg(
                    `Foundation: ${cites.companies ?? 0} companies · PIT min N=${pit.min_n ?? "—"}`
                  );
                  const c = await fetchCorpusCoverage();
                  setCorpusCov(c as Record<string, unknown>);
                } catch (e) {
                  setMsg((e as Error).message);
                } finally {
                  setFoundationBusy(false);
                }
              }}
            >
              {foundationBusy ? "Building…" : "Build Sensex foundation"}
            </button>
          </div>
          <div className="queue-ingest-row" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn ghost"
              disabled={crawlBusy}
              data-testid="corpus-crawl-dry"
              onClick={async () => {
                setCrawlBusy(true);
                try {
                  const r = await postIngestCrawl({ limit: 30, dry_run: true, live: false });
                  setMsg(
                    `Crawl dry-run: pending_new=${r.pending_new} pending_total=${r.pending_total}`,
                  );
                } catch (e) {
                  setMsg((e as Error).message);
                } finally {
                  setCrawlBusy(false);
                }
              }}
            >
              Crawl dry-run
            </button>
            <button
              type="button"
              className="btn ghost"
              disabled={crawlBusy}
              data-testid="corpus-crawl-live"
              onClick={async () => {
                setCrawlBusy(true);
                try {
                  const r = await postIngestCrawl({ limit: 30, dry_run: false, live: true });
                  setMsg(
                    `Crawl live: pending_new=${r.pending_new} pending_total=${r.pending_total}`,
                  );
                  const docs = await fetchDocuments({ review_status: "pending" });
                  setPendingDocs(docs.count);
                  setPendingDocRows(docs.documents || []);
                } catch (e) {
                  setMsg((e as Error).message);
                } finally {
                  setCrawlBusy(false);
                }
              }}
            >
              Crawl live (IR allowlist)
            </button>
            <button
              type="button"
              className="btn ghost"
              disabled={foundationBusy}
              data-testid="pending-depth-bootstrap"
              onClick={async () => {
                setFoundationBusy(true);
                try {
                  const r = await postPendingDepthBootstrap();
                  setMsg(`Bootstrap ok · ${JSON.stringify(r).slice(0, 120)}…`);
                  setPendingDepth(await fetchPendingDepth());
                } catch (e) {
                  setMsg((e as Error).message);
                } finally {
                  setFoundationBusy(false);
                }
              }}
            >
              Pending-depth bootstrap
            </button>
          </div>
          <div className="queue-ingest-row" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn ghost"
              disabled={!companyId || foundationBusy}
              data-testid="ensure-citations-company"
              onClick={async () => {
                if (!companyId) return;
                setFoundationBusy(true);
                try {
                  const r = await postEnsureCitations({ company_id: companyId });
                  setMsg(
                    `Bound ${String(r.linked ?? 0)} citations for ${companyId}` +
                      (r.pit ? ` · PIT n=${(r.pit as { n?: number }).n}` : "")
                  );
                } catch (e) {
                  setMsg((e as Error).message);
                } finally {
                  setFoundationBusy(false);
                }
              }}
            >
              Bind citations · {selected?.ticker || companyId}
            </button>
            <button
              type="button"
              className="btn ghost"
              data-testid="ops-throughput"
              onClick={async () => {
                try {
                  const tput = await fetchOpsThroughput();
                  setThroughput(tput as unknown as Record<string, unknown>);
                  const u = tput.universe || {};
                  setMsg(
                    `Throughput: citeable ${u.citeable_outcomes}/${u.outcomes_total_hand_labeled} · pending docs ${tput.backlog?.pending_docs_review ?? 0}`,
                  );
                } catch (e) {
                  setMsg((e as Error).message);
                }
              }}
            >
              Citeable coverage / throughput
            </button>
          </div>
          {throughput && (
            <pre
              className="api-out"
              data-testid="ops-throughput-out"
              style={{ whiteSpace: "pre-wrap", maxHeight: 180, overflow: "auto" }}
            >
              {JSON.stringify(throughput, null, 2)}
            </pre>
          )}
          <h3 style={{ marginTop: 20 }}>Pending documents</h3>
          <div className="table-scroll">
            <table className="table" data-testid="pending-docs-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingDocRows.slice(0, 40).map((d) => {
                  const id = String(d.id || "");
                  return (
                    <tr key={id}>
                      <td>{String(d.ticker || d.company_id || "—")}</td>
                      <td>{String(d.doc_type || "—")}</td>
                      <td>{String(d.title || d.url || id).slice(0, 60)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn ghost"
                          style={{ marginRight: 6 }}
                          onClick={async () => {
                            try {
                              await postDocumentReview({ doc_id: id, action: "accept" });
                              const docs = await fetchDocuments({ review_status: "pending" });
                              setPendingDocs(docs.count);
                              setPendingDocRows(docs.documents || []);
                              setMsg(`Accepted ${id}`);
                            } catch (e) {
                              setMsg((e as Error).message);
                            }
                          }}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={async () => {
                            try {
                              await postDocumentReview({ doc_id: id, action: "reject" });
                              const docs = await fetchDocuments({ review_status: "pending" });
                              setPendingDocs(docs.count);
                              setPendingDocRows(docs.documents || []);
                              setMsg(`Rejected ${id}`);
                            } catch (e) {
                              setMsg((e as Error).message);
                            }
                          }}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {pendingDocRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted">
                      No pending documents
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>
            Gate: expected types (transcript / results / IR) accepted per recent FY + ≥95%
            citeable outcomes. Open the company dossier → Docs for the period matrix.
          </p>
          {msg && <p className="toast-inline">{msg}</p>}
          <Disclaimer compact />
        </div>
      )}

      {tab === "reports" && (
        <div className="panel desk-panel" data-testid="reports-panel">
          <h2 style={{ marginTop: 0 }}>
            IC audit dossier & role reports <InfoTip termId="citability" />
          </h2>
          <p className="muted">
            Default template is the <strong>IC audit dossier</strong> (citeable matrix +
            citation appendix). Export Markdown, JSON, or PDF for investment committee
            notes. Provisional rows are excluded.
          </p>
          <div className="queue-ingest-row">
            <select
              value={reportTpl}
              onChange={(e) => setReportTpl(e.target.value)}
              data-testid="report-template"
            >
              {(reportTemplates.length
                ? reportTemplates
                : [{ id: "ic_audit", name: "IC audit", role: "", industry: "" }]
              ).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn"
              disabled={!companyId || reportBusy}
              data-testid="generate-report"
              onClick={async () => {
                if (!companyId) return;
                setReportBusy(true);
                try {
                  const r = await postGenerateReport({
                    company_id: companyId,
                    template_id: reportTpl,
                    format: "markdown",
                  });
                  setReportMd(r.markdown || "");
                  setReportJson(null);
                  setMsg(`Generated: ${r.template_name}`);
                } catch (e) {
                  setMsg((e as Error).message);
                } finally {
                  setReportBusy(false);
                }
              }}
            >
              {reportBusy ? "Generating…" : `Markdown · ${selected?.ticker || "—"}`}
            </button>
            <button
              type="button"
              className="btn ghost"
              disabled={!companyId || reportBusy}
              data-testid="generate-report-json"
              onClick={async () => {
                if (!companyId) return;
                setReportBusy(true);
                try {
                  const r = await postGenerateReport({
                    company_id: companyId,
                    template_id: "ic_audit",
                    format: "json",
                  });
                  setReportJson(JSON.stringify(r.dossier || r, null, 2));
                  setReportMd(r.markdown || null);
                  setMsg(`IC JSON · citeable ${r.citeable_count ?? "—"}`);
                } catch (e) {
                  setMsg((e as Error).message);
                } finally {
                  setReportBusy(false);
                }
              }}
            >
              IC JSON
            </button>
            <button
              type="button"
              className="btn ghost"
              disabled={!companyId || reportBusy}
              data-testid="generate-report-pdf"
              onClick={async () => {
                if (!companyId) return;
                setReportBusy(true);
                try {
                  const blob = await downloadIcAuditPdf(companyId);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `ic-audit-${selected?.ticker || companyId}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setMsg("IC PDF downloaded");
                } catch (e) {
                  setMsg((e as Error).message);
                } finally {
                  setReportBusy(false);
                }
              }}
            >
              IC PDF
            </button>
          </div>
          {reportJson && (
            <pre
              className="api-out"
              data-testid="report-json"
              style={{ whiteSpace: "pre-wrap", maxHeight: 320, overflow: "auto" }}
            >
              {reportJson}
            </pre>
          )}
          {reportMd && (
            <pre
              className="api-out"
              data-testid="report-markdown"
              style={{ whiteSpace: "pre-wrap", maxHeight: 420, overflow: "auto" }}
            >
              {reportMd}
            </pre>
          )}
          <Disclaimer compact />
        </div>
      )}

      {tab === "pit" && (
        <div className="panel desk-panel" data-testid="pit-panel">
          <h2 style={{ marginTop: 0 }}>
            API + point-in-time history <InfoTip termId="pit" />
          </h2>
          <p className="muted">
            Use <code className="inline-code">as_of</code> scores for backtests — do not
            leak today’s GCI into past dates. Demo key:{" "}
            <code className="inline-code">{demoApiKey()}</code>
          </p>
          {history.length >= 2 && (
            <div className="chart-block">
              <h3 className="chart-title">PIT GCI path</h3>
              <LineChart
                points={history.map((h) => ({
                  label: h.as_of.slice(0, 7),
                  value: h.gci_score,
                }))}
                yDomain={[0, 100]}
                ariaLabel="Point-in-time GCI line chart"
              />
            </div>
          )}
          <div className="table-scroll" style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>as_of</th>
                  <th>GCI</th>
                  <th>Δ</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.as_of}>
                    <td>{h.as_of}</td>
                    <td>{formatScore(h.gci_score)}</td>
                    <td>
                      <ChangeChip value={h.change_pct} horizon={h.change_horizon} />
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={3} className="muted">
                      No PIT points yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="desk-api-actions">
            <button
              type="button"
              className="btn"
              onClick={async () => {
                const rows = await fetchHistory(companyId);
                setApiOut(JSON.stringify(rows, null, 2));
                setMsg("Fetched /api/companies/{id}/gci/history");
              }}
            >
              Try PIT API
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={async () => {
                const [contract, hist] = await Promise.all([
                  fetchPitContract(),
                  fetchPitHistoryV1(companyId),
                ]);
                setApiOut(
                  JSON.stringify({ contract, history_v1: hist }, null, 2),
                );
                setMsg(
                  `pit.v1 · ${hist.series_kind} · citeable=${String(hist.citeable)}`,
                );
              }}
            >
              PIT v1 contract
            </button>
            <a className="btn ghost" href={apiDocsUrl()} target="_blank" rel="noreferrer">
              OpenAPI /docs
            </a>
            <a
              className="btn ghost"
              href={fetchEmFactorCsvUrl(companyId)}
              target="_blank"
              rel="noreferrer"
            >
              EM factor CSV
            </a>
          </div>
          {apiOut && <pre className="desk-pre">{apiOut}</pre>}
        </div>
      )}

      {tab === "import" && (
        <div className="panel desk-panel">
          <h2 style={{ marginTop: 0 }}>
            Facts / AlphaHunter <InfoTip termId="alphahunter" />
          </h2>
          <p className="muted">
            {ahStatus?.configured
              ? `Live connector configured (${ahStatus.url_host || "vendor"}). Pull merges into the selected company after review.`
              : "Paste catalog-aligned facts JSON, or set ALPHAHUNTER_API_URL for live vendor pull."}
          </p>
          {ahStatus && <p className="muted">{ahStatus.note}</p>}
          <button
            type="button"
            className="btn"
            disabled={!ahStatus?.configured}
            style={{ marginBottom: 12 }}
            onClick={async () => {
              try {
                const res = await postAlphaHunterLive({ company_id: companyId, merge: true });
                setMsg(`Live pull ok — ${res.fact_count ?? 0} fact(s), merged ${res.merged ?? 0}`);
                setApiOut(JSON.stringify(res, null, 2));
                const d = await fetchCompanyGci(companyId);
                setDetail(d);
              } catch (e) {
                setMsg((e as Error).message);
              }
            }}
          >
            Pull live & merge
          </button>
          <label className="desk-field">
            <span className="field-label">Facts JSON (paste)</span>
            <textarea
              rows={12}
              value={factsJson}
              onChange={(e) => setFactsJson(e.target.value)}
              spellCheck={false}
            />
          </label>
          <button
            type="button"
            className="btn"
            style={{ marginTop: 12 }}
            onClick={async () => {
              try {
                const facts = JSON.parse(factsJson) as Record<string, unknown>[];
                const res = await postAlphaHunterImport({
                  facts,
                  merge_into_company: companyId,
                });
                setMsg(`Import ok — merged ${res.merged ?? 0} outcome(s)`);
                setApiOut(JSON.stringify(res, null, 2));
                const d = await fetchCompanyGci(companyId);
                setDetail(d);
              } catch (e) {
                setMsg((e as Error).message);
              }
            }}
          >
            Import & merge
          </button>
          {apiOut && <pre className="desk-pre">{apiOut}</pre>}

          <h3 style={{ marginTop: 28 }}>Street consensus import</h3>
          <p className="muted" style={{ fontSize: 13 }}>
            Upsert rows via <code>POST /api/consensus/import</code>. Sample rows use{" "}
            <code>source: sample_import</code> and require <code>?demo=true</code>. Licensed street
            data replaces this for production.
          </p>
          {consensusStats && (
            <p className="muted" data-testid="consensus-stats">
              Store: {consensusStats.row_count} row(s) · {consensusStats.company_count} compan(ies)
            </p>
          )}
          <label className="desk-field">
            <span className="field-label">Consensus JSON array</span>
            <textarea
              rows={8}
              value={consensusJson}
              onChange={(e) => setConsensusJson(e.target.value)}
              spellCheck={false}
              placeholder='[{"company_id":"infy","period":"FY26","metric":"revenue_growth_pct","street_consensus":6.5,"source":"vendor"}]'
            />
          </label>
          <div className="queue-ingest-row" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn"
              data-testid="consensus-import"
              onClick={async () => {
                try {
                  const rows = JSON.parse(consensusJson || "[]") as Record<string, unknown>[];
                  const demo = rows.some((r) => String(r.source || "").includes("sample"));
                  const res = await postConsensusImport(rows, { demo });
                  setMsg(`Consensus imported ${res.imported} row(s)${res.demo ? " (demo)" : ""}`);
                  setConsensusStats(await fetchConsensusStats());
                } catch (e) {
                  setMsg((e as Error).message);
                }
              }}
            >
              Import consensus
            </button>
            <button
              type="button"
              className="btn ghost"
              data-testid="consensus-load-sample"
              onClick={async () => {
                try {
                  const r = await fetch("/api/consensus/sample", {
                    headers: { "X-API-Key": demoApiKey() },
                  });
                  if (!r.ok) throw new Error("Sample unavailable");
                  const body = await r.json();
                  setConsensusJson(JSON.stringify(body.rows || body, null, 2));
                  setMsg("Loaded sample_import fixture — import with demo gate");
                } catch {
                  setConsensusJson(
                    JSON.stringify(
                      [
                        {
                          company_id: "infy",
                          period: "FY26",
                          metric: "revenue_growth_pct",
                          street_consensus: 6.5,
                          as_of: "sample",
                          source: "sample_import",
                        },
                      ],
                      null,
                      2,
                    ),
                  );
                  setMsg("Loaded inline sample (demo)");
                }
              }}
            >
              Load sample fixture
            </button>
          </div>
        </div>
      )}

      {tab === "parameters" && (
        <div className="panel desk-panel" data-testid="gci-parameters-panel">
          <h2 style={{ marginTop: 0 }}>
            GCI parameters <InfoTip termId="gci_parameter" />
          </h2>
          <p className="muted lede">
            What can enter the score: quantified guidance metrics only. Charts show
            how the catalog is used in the current Sensex seed.
          </p>

          <div className="viz-grid">
            <div className="chart-block">
              <h3 className="chart-title">By family</h3>
              <DonutChart
                centerLabel={`${catalog.length}`}
                slices={Object.entries(
                  catalog.reduce<Record<string, number>>((acc, m) => {
                    acc[m.family] = (acc[m.family] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([label, value]) => ({
                  label,
                  value,
                  color: FAMILY_COLORS[label] || "var(--accent)",
                }))}
                ariaLabel="Metric families donut"
              />
            </div>
            <div className="chart-block">
              <h3 className="chart-title">Outcome coverage (seed)</h3>
              <BarChart
                rows={[...catalog]
                  .sort((a, b) => (b.outcome_count || 0) - (a.outcome_count || 0))
                  .slice(0, 8)
                  .map((m) => ({
                    label: m.display_name.replace(/ %$/, ""),
                    value: m.outcome_count || 0,
                    color: FAMILY_COLORS[m.family] || "var(--accent)",
                  }))}
                ariaLabel="Top metrics by outcome count"
              />
            </div>
          </div>

          <div className="source-viz" aria-label="Source policy">
            <h3 className="chart-title">What feeds GCI</h3>
            <div className="source-pills">
              {[
                { ok: true, label: "Transcripts" },
                { ok: true, label: "Filings / PDF text" },
                { ok: true, label: "IR HTML" },
                { ok: true, label: "PPT text" },
                { ok: true, label: "ASR → text" },
                { ok: true, label: "Reported actuals" },
                { ok: false, label: "Raw audio/video" },
                { ok: false, label: "Technicals" },
                { ok: false, label: "Shenanigans" },
                { ok: false, label: "Sentiment-only" },
              ].map((s) => (
                <span key={s.label} className={`source-pill ${s.ok ? "in" : "out"}`}>
                  {s.ok ? "✓" : "✕"} {s.label}
                </span>
              ))}
            </div>
          </div>

          <div className="table-scroll" style={{ marginTop: 20 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Family</th>
                  <th>Unit</th>
                  <th>Tier</th>
                  <th>Usage</th>
                </tr>
              </thead>
              <tbody>
                {catalog.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.display_name}</strong>
                      <div className="muted" style={{ fontSize: 12 }}>
                        <code className="inline-code">{m.id}</code>
                      </div>
                    </td>
                    <td>
                      <span
                        className="family-chip"
                        style={{
                          borderColor: FAMILY_COLORS[m.family] || "var(--line)",
                          color: FAMILY_COLORS[m.family] || "var(--ink)",
                        }}
                      >
                        {m.family}
                      </span>
                    </td>
                    <td>{m.unit}</td>
                    <td>{m.tier}</td>
                    <td style={{ minWidth: 120 }}>
                      <div className="mini-bar-track">
                        <div
                          className="mini-bar-fill"
                          style={{
                            width: `${Math.min(
                              100,
                              ((m.outcome_count || 0) /
                                Math.max(
                                  1,
                                  ...catalog.map((x) => x.outcome_count || 0)
                                )) *
                                100
                            )}%`,
                            background: FAMILY_COLORS[m.family] || "var(--accent)",
                          }}
                        />
                      </div>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {m.outcome_count ?? 0} outcomes
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "wordmap" && (
        <div className="panel desk-panel">
          <h2 style={{ marginTop: 0 }}>
            Wordmap context <InfoTip termId="sentiment" />
          </h2>
          <p className="muted">
            Entity vs sector-average themes from citeable corpus text when available
            (seed fallback otherwise). Context only — not part of GCI math.
            {wordmap?.source ? (
              <>
                {" "}
                Source: <strong>{wordmap.source}</strong>
                {wordmap.citeable ? " · citeable" : " · non-citeable stub"}
              </>
            ) : null}
          </p>
          {wordmap && (
            <div className="chart-block" style={{ marginTop: 16 }}>
              <CompareBars
                rows={Object.keys(wordmap.entity).map((k) => ({
                  label: k,
                  left: wordmap.entity[k],
                  right: wordmap.industry[k],
                }))}
                ariaLabel="Entity vs industry wordmap"
              />
            </div>
          )}
          <p className="muted" style={{ marginTop: 8 }}>
            Peers in sector: {wordmap?.peer_count ?? "—"}
          </p>
        </div>
      )}

      {tab === "vernacular" && (
        <div className="panel desk-panel">
          <h2 style={{ marginTop: 0 }}>Vernacular blurbs + badge</h2>
          <p className="muted">Factual GCI templates only — not investment advice.</p>
          <div className="desk-lang-row">
            {(vernacular?.supported_langs ?? ["en", "hi", "ta", "gu", "mr", "ja"]).map(
              (l) => (
                <button
                  key={l}
                  type="button"
                  className={`btn ghost small ${lang === l ? "active-lang" : ""}`}
                  onClick={() => setLang(l)}
                >
                  {l}
                </button>
              )
            )}
          </div>
          {vernacular && (
            <blockquote className="desk-blurb" data-testid="vernacular-blurb">
              {vernacular.text}
            </blockquote>
          )}
          <Disclaimer compact />
          {badge && (
            <div className="desk-badge-box">
              <div className="field-label">{badge.label}</div>
              <div className="value score" style={{ fontFamily: "var(--serif)", fontSize: 28 }}>
                {badge.trust_score ?? "n/a"}
              </div>
              <p className="muted">{badge.disclaimer}</p>
              <code className="inline-code">{badge.embed}</code>
              <p style={{ marginTop: 8 }}>
                <a href={badge.svg_url} target="_blank" rel="noreferrer">
                  Preview SVG badge →
                </a>
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "labeling" && (
        <>
          {has("labeling") && <LabelWorkbench companyId={companyId} />}
        <div className="panel desk-panel" data-testid="labeling-queue-panel">
          <h2 style={{ marginTop: 0 }}>
            Labeling priority queue <InfoTip termId="labeling_queue" />
          </h2>
          <p className="muted">
            One-Stop dedicated labeling path — request hand-label priority for a name.
            Process SLA; does not invent actuals. Hand-label M3/M4 per{" "}
            <code>docs/LABELING_PLAYBOOK.md</code> in the repo (no day-1 Nifty claim).
          </p>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={labelNiftyOnly}
              onChange={(e) => setLabelNiftyOnly(e.target.checked)}
              data-testid="label-nifty-filter"
            />
            <span className="muted">Show Nifty-extra queue only</span>
          </label>
          {niftyMs && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Nifty deep GCI milestones</h3>
              <p className="muted">{niftyMs.note}</p>
              <p className="muted">
                Progress {niftyMs.progress.done}/{niftyMs.progress.total} · Sensex HL{" "}
                {niftyMs.counts.sensex_hand_labeled ?? "—"} · Nifty HL{" "}
                {niftyMs.counts.nifty_hand_labeled ?? 0} · queued{" "}
                {niftyMs.counts.nifty_queued ?? 0}
              </p>
              <ul className="package-steps">
                {niftyMs.milestones.map((m) => (
                  <li key={m.id}>
                    <strong>{m.id}</strong> · {m.title} · {m.status} — {m.target}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn"
                style={{ marginTop: 8 }}
                onClick={async () => {
                  try {
                    const res = await postNiftyEnqueueLabeling();
                    setMsg(`Enqueued ${res.enqueued} Nifty name(s) for labeling`);
                    const q = await fetchLabelingQueue();
                    setLabelQueue(q.items || []);
                    const ms = await fetchNiftyMilestones();
                    setNiftyMs({
                      milestones: ms.milestones,
                      counts: ms.counts as Record<string, number>,
                      nifty_extra_ids: ms.nifty_extra_ids,
                      note: ms.note,
                      progress: ms.progress,
                    });
                  } catch (e) {
                    setMsg((e as Error).message);
                  }
                }}
              >
                Enqueue Nifty-extra for labeling (M2)
              </button>
            </div>
          )}
          <button
            type="button"
            className="btn"
            onClick={async () => {
              try {
                await postLabelingQueue({
                  company_id: companyId,
                  priority: "high",
                  note: "Desk request",
                });
                const q = await fetchLabelingQueue();
                setLabelQueue(q.items || []);
                setMsg("Queued for labeling priority");
              } catch (e) {
                setMsg((e as Error).message);
              }
            }}
          >
            Queue {companyId} (high priority)
          </button>
          <ul className="package-steps" style={{ marginTop: 16 }}>
            {(labelQueue || [])
              .filter((item) => {
                if (!labelNiftyOnly) return true;
                const ids = new Set(niftyMs?.nifty_extra_ids || []);
                if (ids.size && item.company_id && ids.has(String(item.company_id))) return true;
                const note = `${item.note || ""}`.toLowerCase();
                return note.includes("nifty");
              })
              .slice(0, 20)
              .map((item) => (
              <li key={item.id}>
                <strong>{item.company_name || item.company_id}</strong> · {item.priority} ·{" "}
                {item.status} · {item.data_quality}
              </li>
            ))}
            {!labelQueue?.length && <li className="muted">No queue items yet</li>}
          </ul>
          <p className="muted" style={{ fontSize: 12 }}>
            M3/M4 stay open until real hand_labels exist — enqueue only prepares the queue.
          </p>
        </div>
        </>
      )}

      {tab === "feedback" && <FeedbackInbox />}

      {tab === "csm" && (
        <div className="panel desk-panel">
          <h2 style={{ marginTop: 0 }}>Customer success (CSM)</h2>
          <p className="muted">
            {csmDash?.note ||
              "Named CSM, SLA meter, and VPC posture for Enterprise / One-Stop — commercial terms in MSA."}
          </p>
          {ssoStatus && (
            <div className="panel" style={{ marginBottom: 16 }} data-testid="sso-readiness">
              <h3 style={{ marginTop: 0 }}>Enterprise SSO readiness</h3>
              <p className="muted" style={{ fontSize: 13 }}>
                Enabled: {ssoStatus.enabled ? "yes" : "no"} · Configured:{" "}
                {ssoStatus.configured ? "yes" : "no"} · Production-ready:{" "}
                {ssoStatus.production_ready || ssoStatus.ready ? "yes" : "not yet"}
              </p>
              {ssoStatus.note && <p className="muted">{ssoStatus.note}</p>}
              {ssoStatus.checklist && (
                <ul className="package-steps">
                  {Object.entries(ssoStatus.checklist).map(([k, v]) => (
                    <li key={k}>
                      {k}: {v ? "ok" : "missing"}
                    </li>
                  ))}
                </ul>
              )}
              <p className="muted" style={{ fontSize: 12 }}>
                Register IdP → set <code>SSO=true</code> + <code>OIDC_*</code> → redirect{" "}
                <code>https://citealpha.com/api/auth/sso/callback</code>. See{" "}
                <Link to="/trust">Trust Center</Link>.
              </p>
            </div>
          )}
          <div className="metrics">
            <div className="metric">
              <div className="label">Org</div>
              <div className="value" style={{ fontSize: 20 }}>
                {String(csmDash?.org?.name ?? org?.name ?? org?.id ?? "demo")}
              </div>
            </div>
            <div className="metric">
              <div className="label">Plan</div>
              <div className="value" style={{ fontSize: 20 }}>
                {String(csmDash?.org?.plan ?? org?.plan ?? "pilot")}
              </div>
            </div>
            <div className="metric">
              <div className="label">Seats</div>
              <div className="value">
                {String(csmDash?.org?.seats_used ?? org?.seats_used ?? 0)} /{" "}
                {String(csmDash?.org?.seats ?? org?.seats ?? "—")}
              </div>
            </div>
            <div className="metric">
              <div className="label">Named CSM</div>
              <div className="value" style={{ fontSize: 18 }}>
                {String(csmDash?.csm?.named ?? org?.csm ?? "Assigned at convert")}
              </div>
            </div>
            <div className="metric">
              <div className="label">SLA target</div>
              <div className="value" style={{ fontSize: 18 }}>
                {csmDash?.sla?.targets?.uptime_pct != null
                  ? `${csmDash.sla.targets.uptime_pct}%`
                  : "—"}
              </div>
            </div>
            <div className="metric">
              <div className="label">Observed uptime</div>
              <div className="value" style={{ fontSize: 18 }}>
                {csmDash?.sla?.observed?.uptime_pct != null
                  ? `${csmDash.sla.observed.uptime_pct}%`
                  : "n/a yet"}
              </div>
            </div>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            VPC: {csmDash?.vpc?.status ?? "msa_scoped"} · template{" "}
            {csmDash?.vpc?.private_subnet_example ?? "deploy/aws/vpc-private.example.tf"}
          </p>
          <ul className="package-steps" style={{ marginTop: 16 }}>
            <li>Weekly: review alerts + one evidence citation in a draft note</li>
            <li>Monthly: labeling feedback (wrong band / period / label)</li>
            <li>Quarterly: QBR — coverage milestones Sensex → Nifty</li>
            <li>
              Open labeling items: {csmDash?.labeling_open ?? "—"} · open tickets:{" "}
              {csmDash?.tickets_open ?? 0}
            </li>
          </ul>
          {csmDash?.labeling_audit && csmDash.labeling_audit.length > 0 ? (
            <div data-testid="csm-labeling-audit" style={{ marginTop: 12 }}>
              <p className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
                Recent label submitter / reviewer (ids only)
              </p>
              <ul className="package-steps">
                {csmDash.labeling_audit.slice(0, 8).map((row) => (
                  <li key={row.id || `${row.company_id}-${row.updated_at}`}>
                    {row.company_id} · {row.status}
                    {row.submitter_id ? ` · labeled by ${row.submitter_id}` : ""}
                    {row.reviewer_id ? ` · reviewed by ${row.reviewer_id}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <label className="desk-field" style={{ marginTop: 12 }}>
            <span className="field-label">CSM ticket subject</span>
            <input
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="e.g. Need QBR slot"
            />
          </label>
          <button
            type="button"
            className="btn"
            style={{ marginTop: 8 }}
            onClick={async () => {
              try {
                await postCsmTicket("demo", { subject: ticketSubject, severity: "3" });
                setTicketSubject("");
                setCsmDash(await fetchCsmDashboard("demo"));
                setMsg("Ticket filed with CSM queue");
              } catch (e) {
                setMsg((e as Error).message);
              }
            }}
          >
            File CSM ticket
          </button>
          <p className="cta-line">
            Contact: <strong>{csmDash?.csm?.email ?? "csm@citealpha.com"}</strong> · sales:{" "}
            <strong>sales@citealpha.com</strong>
          </p>
          <Link className="btn" to="/package" style={{ marginTop: 12 }}>
            View Package / One-Stop →
          </Link>
          <div className="panel" style={{ marginTop: 24 }} data-testid="org-settings-cta">
            <h3 style={{ marginTop: 0 }}>Team &amp; seats</h3>
            <p className="muted">
              Invite analysts, revoke seats, and mint org API keys on the org settings page.
            </p>
            <Link to="/org/settings" className="btn-primary">
              Open org settings →
            </Link>
          </div>
          <PilotChecklistPanel orgId={String(org?.id || "demo")} />
        </div>
      )}
    </section>
    </PlanAccessGate>
  );
}
