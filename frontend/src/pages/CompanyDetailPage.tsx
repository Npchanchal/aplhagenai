import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ChangeChip, { ChangeTriple } from "../components/ChangeChip";
import { BarChart, CompareBars, DualLineChart, LineChart } from "../components/Charts";
import Disclaimer from "../components/Disclaimer";
import EvidenceTable from "../components/EvidenceTable";
import InfoTip from "../components/InfoTip";
import QualityBadge from "../components/QualityBadge";
import ScoreReveal from "../components/ScoreReveal";
import Skeleton from "../components/Skeleton";
import ThreadTimeline from "../components/ThreadTimeline";
import Toast from "../components/Toast";
import {
  fetchCompanyAnalytics,
  fetchCompanyChanges,
  fetchCompanyDocs,
  fetchCompanyGci,
  fetchHistory,
  fetchNotes,
  fetchReportTemplates,
  fetchStockHistory,
  fetchVernacular,
  fetchWordmap,
  postGenerateReport,
  postNote,
  postExtract,
  postReview,
  type CompanyGCIDetail,
  type StockHistory,
  type VernacularPayload,
  type WordmapPayload,
} from "../lib/api";
import { tipForLabel } from "../lib/glossary";
import { scoreClass } from "../lib/score";
import { useI18n } from "../i18n";

const SECTIONS = [
  { id: "evidence", label: "Evidence" },
  { id: "docs", label: "Docs" },
  { id: "trend", label: "Trend" },
  { id: "analytics", label: "Analytics" },
  { id: "threads", label: "Threads" },
  { id: "metrics", label: "Metrics" },
  { id: "notes", label: "Notes" },
  { id: "report", label: "Report" },
  { id: "pit", label: "PIT" },
  { id: "context", label: "Context" },
] as const;

export default function CompanyDetailPage() {
  const { id } = useParams();
  const { t } = useI18n();
  const [detail, setDetail] = useState<CompanyGCIDetail | null>(null);
  const [history, setHistory] = useState<
    {
      as_of: string;
      gci_score: number | null;
      change_pct?: number | null;
      change_horizon?: string | null;
    }[]
  >([]);
  const [priceHistory, setPriceHistory] = useState<StockHistory | null>(null);
  const [wordmap, setWordmap] = useState<WordmapPayload | null>(null);
  const [vernacular, setVernacular] = useState<VernacularPayload | null>(null);
  const [lang, setLang] = useState("en");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [changes, setChanges] = useState<{
    wow_pct?: number | null;
    mom_pct?: number | null;
    qoq_pct?: number | null;
    yoy_pct?: number | null;
    pop_pct?: number | null;
    pop_horizon?: string | null;
  } | null>(null);
  const [analytics, setAnalytics] = useState<Awaited<
    ReturnType<typeof fetchCompanyAnalytics>
  > | null>(null);
  const [docs, setDocs] = useState<Array<Record<string, unknown>>>([]);
  const [completeness, setCompleteness] = useState<{
    periods: Array<{
      period: string;
      status: string;
      doc_count: number;
      expected_types?: string[];
      types_complete?: boolean;
      type_coverage?: Record<string, boolean>;
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
  } | null>(null);
  const [notes, setNotes] = useState<
    Array<{ id: string; title: string; body: string }>
  >([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [templates, setTemplates] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [reportMd, setReportMd] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState("ra_delivery");
  const dismissToast = useCallback(() => setToast(null), []);

  const reload = useCallback(() => {
    if (!id) return;
    setError(null);
    Promise.all([
      fetchCompanyGci(id),
      fetchHistory(id).catch(() => []),
      fetchWordmap(id).catch(() => null),
      fetchVernacular(id, lang).catch(() => null),
      fetchStockHistory(id, 5).catch(() => null),
      fetchCompanyChanges(id).catch(() => null),
      fetchCompanyAnalytics(id).catch(() => null),
      fetchCompanyDocs(id).catch(() => ({
        documents: [] as Array<Record<string, unknown>>,
        completeness: undefined as
          | {
              periods: Array<{
                period: string;
                status: string;
                doc_count: number;
                expected_types?: string[];
                types_complete?: boolean;
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
            }
          | undefined,
      })),
      fetchNotes(id).catch(() => ({ notes: [] })),
      fetchReportTemplates().catch(() => ({ templates: [] })),
    ])
      .then(([d, h, w, v, ph, ch, an, dc, nt, tpl]) => {
        setDetail(d);
        setHistory(h || []);
        setWordmap(w);
        setVernacular(v);
        setPriceHistory(ph);
        setChanges(ch);
        setAnalytics(an);
        setDocs(dc.documents || []);
        setCompleteness(dc.completeness || null);
        setNotes(nt.notes || []);
        setTemplates(tpl.templates || []);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [id, lang]);

  useEffect(() => {
    setDetail(null);
    reload();
  }, [reload]);

  if (error) {
    return (
      <section>
        <Link className="back" to="/">
          ← Universe
        </Link>
        <p className="error">{error}</p>
      </section>
    );
  }

  if (!detail) {
    return (
      <section>
        <Link className="back" to="/">
          {t("common.back")}
        </Link>
        <p className="page-kicker">{t("company.kicker")}</p>
        <h1 className="muted">Loading dossier…</h1>
        <Skeleton rows={10} className="panel" />
      </section>
    );
  }

  const hasThreads = detail.threads && Object.keys(detail.threads).length > 0;
  const hasMetricChanges =
    detail.by_metric_changes && Object.keys(detail.by_metric_changes).length > 0;

  return (
    <section className="dossier-page">
      <Toast message={toast} onDismiss={dismissToast} tone="info" />

      <Link className="back" to="/">
        {t("common.back")}
      </Link>

      <div className="dossier-hero">
        <div>
          <p className="page-kicker">{t("company.kicker")}</p>
          <h1 data-testid="company-name">{detail.name}</h1>
          <div className="dossier-meta">
            <span>
              <strong>{detail.ticker}</strong> · {detail.sector}
            </span>
            <QualityBadge quality={detail.data_quality} />
            {detail.peer_rank_in_sector != null && (
              <span>
                Peer #{detail.peer_rank_in_sector} <InfoTip termId="peer_rank" />
                {" · "}
                sector avg {detail.sector_avg_gci} <InfoTip termId="sector_avg" />
              </span>
            )}
          </div>
        </div>
        <div className="dossier-score-block">
          <span className="field-label">
            GCI <InfoTip termId="gci" />
          </span>
          <ScoreReveal score={detail.gci_score} testId="gci-score" />
          <div style={{ marginTop: 6 }}>
            {changes ? (
              <ChangeTriple
                wow={changes.wow_pct}
                mom={changes.mom_pct}
                qoq={changes.qoq_pct}
                yoy={changes.yoy_pct}
                pop={changes.pop_pct}
                popHorizon={changes.pop_horizon}
              />
            ) : (
              <ChangeChip
                value={detail.gci_change_pct}
                horizon={detail.gci_change_horizon}
              />
            )}
          </div>
        </div>
      </div>

      <Disclaimer compact />

      <div className="metrics">
        {Object.entries(detail.label_counts).map(([label, n]) => (
          <div className="metric" key={label}>
            <div className="label">
              {label}{" "}
              <InfoTip termId={label.toLowerCase()} text={tipForLabel(label)} />
            </div>
            <div className="value">{n}</div>
          </div>
        ))}
      </div>

      <nav className="dossier-toc" aria-label="Dossier sections">
        {SECTIONS.filter((s) => {
          if (s.id === "threads") return hasThreads;
          if (s.id === "metrics") return hasMetricChanges;
          return true;
        }).map((s) => (
          <a key={s.id} href={`#${s.id}`} className="dossier-toc-link">
            {s.label}
          </a>
        ))}
      </nav>

      <div className="panel" id="evidence">
        <div className="panel-head">
          <h2>
            Evidence trail <InfoTip termId="evidence" />
          </h2>
          <button
            type="button"
            className="btn ghost small"
            onClick={async () => {
              try {
                const res = await postExtract(detail.id);
                setToast(
                  `Extracted ${res.count} statement(s) — review in Desk → Review queue`
                );
              } catch (e) {
                setToast((e as Error).message);
              }
            }}
          >
            Run extract
          </button>
        </div>
        <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
          Every score point traces to guided vs actual. Accept / reject before
          citing externally.{" "}
          <Link to="/desk?tab=review" className="inline-link">
            Open review queue
          </Link>
        </p>
        {detail.status === "insufficient_data" || detail.outcomes.length === 0 ? (
          <div className="empty" data-testid="empty-state">
            Insufficient data — no matched guidance outcomes yet.
          </div>
        ) : (
          <EvidenceTable
            outcomes={detail.outcomes}
            testId="evidence-table"
            onReview={async (outcomeIndex, action) => {
              await postReview({
                company_id: detail.id,
                outcome_index: outcomeIndex,
                action,
                comment: action === "reject" ? "reject from UI" : undefined,
              });
              setToast(
                action === "accept"
                  ? `Accepted outcome #${outcomeIndex}`
                  : `Rejected outcome #${outcomeIndex}`
              );
              reload();
            }}
            onEdit={async (outcomeIndex, edits) => {
              await postReview({
                company_id: detail.id,
                outcome_index: outcomeIndex,
                action: "edit",
                comment: "edit from UI",
                edits,
              });
              setToast(`Edited outcome #${outcomeIndex}`);
              reload();
            }}
          />
        )}
        <Disclaimer />
      </div>

      <div className="panel" id="docs" data-testid="period-docs">
        <h2>
          Period documents <InfoTip termId="source" />
        </h2>
        <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
          Automatic corpus first (IR crawl every 6h). Paste on Desk is the{" "}
          <strong>exception</strong> path. Pending until Accept — never auto-scored into citeable GCI.
        </p>
        {completeness && (
          <div className="period-matrix" data-testid="period-completeness">
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Types</th>
                  <th>Docs</th>
                </tr>
              </thead>
              <tbody>
                {completeness.periods.map((p) => (
                  <tr key={p.period}>
                    <td>{p.period}</td>
                    <td>
                      <span className={`pill ${p.status}`}>{p.status}</span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {p.types_complete
                        ? "transcript · results · IR"
                        : p.expected_types?.join(" · ") || "—"}
                    </td>
                    <td>{p.doc_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {completeness.note && (
              <p className="muted" style={{ fontSize: 12 }}>
                {completeness.note}
              </p>
            )}
            {completeness.summary && (
              <p style={{ fontSize: 12 }} data-testid="tier1-gate">
                Tier 1 gate:{" "}
                {completeness.summary.tier1_gate ? (
                  <span className="score good">pass</span>
                ) : (
                  <span className="score bad">open</span>
                )}
                {" · "}
                accepted {completeness.summary.accepted_periods}/
                {completeness.summary.total_periods}
                {completeness.summary.types_complete_periods != null && (
                  <>
                    {" "}
                    · types {completeness.summary.types_complete_periods}/
                    {completeness.summary.total_periods}
                  </>
                )}
                {completeness.summary.citeable_pct != null && (
                  <> · citeable {completeness.summary.citeable_pct}%</>
                )}
                {completeness.summary.citeable_bound_outcomes != null && (
                  <> · bound {completeness.summary.citeable_bound_outcomes}</>
                )}
              </p>
            )}
          </div>
        )}
        {docs.length === 0 ? (
          <p className="muted">
            No documents yet — wait for IR crawl or use Desk exception ingest.
          </p>
        ) : (
          <ul className="doc-list">
            {docs.slice(0, 12).map((d) => (
              <li key={String(d.doc_id)}>
                <strong>{String(d.title || d.doc_type || "Document")}</strong>{" "}
                <span className="muted">
                  · {String(d.review_status || "pending")} ·{" "}
                  {String(d.source || d.source_type || "")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel" id="trend">
        <h2>
          GCI trend <InfoTip termId="trend" />
        </h2>
        <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
          Period levels and incremental Δ — both matter for desk work.
        </p>
        {changes && (
          <div className="chart-block" data-testid="delta-horizon-chart">
            <h3 style={{ marginBottom: 4 }}>Δ horizons</h3>
            <BarChart
              rows={[
                { label: "WoW", value: Number(changes.wow_pct ?? 0) },
                { label: "MoM", value: Number(changes.mom_pct ?? 0) },
                { label: "QoQ", value: Number(changes.qoq_pct ?? 0) },
                { label: "YoY", value: Number(changes.yoy_pct ?? 0) },
              ].filter((_, i) =>
                [changes.wow_pct, changes.mom_pct, changes.qoq_pct, changes.yoy_pct][
                  i
                ] != null
              )}
              unit="%"
              ariaLabel="GCI change by horizon"
            />
          </div>
        )}
        {detail.trend.length >= 2 && (
          <div className="chart-block">
            <LineChart
              points={detail.trend.map((pt) => ({
                label: pt.period,
                value: pt.gci_score,
              }))}
              yDomain={[0, 100]}
              ariaLabel="GCI trend line"
            />
          </div>
        )}
        {priceHistory &&
          priceHistory.points.length >= 2 &&
          detail.trend.length >= 2 && (
            <div className="chart-block" data-testid="gci-price-overlay">
              <h3 style={{ marginBottom: 4 }}>GCI ↔ stock tape (historical pattern)</h3>
              <p className="muted" style={{ fontSize: 12, marginTop: 0 }}>
                Observed co-movement only — <strong>not a forecast</strong>, not causation,
                not investment advice. No future trend is extrapolated.
                {analytics?.sample_n != null && (
                  <>
                    {" "}
                    N={analytics.sample_n}
                    {analytics.window_label ? ` · ${analytics.window_label}` : ""}.
                  </>
                )}
              </p>
              {analytics?.pit_as_of && analytics.pit_as_of.length > 0 && (
                <p className="muted" style={{ fontSize: 11, marginTop: 0 }}>
                  GCI as_of (PIT): {analytics.pit_as_of.slice(-6).join(" · ")}
                  {analytics.pit_as_of.length > 6 ? "…" : ""}
                </p>
              )}
              <DualLineChart
                left={detail.trend.map((pt) => ({
                  label: pt.period,
                  value: pt.gci_score,
                }))}
                right={priceHistory.points
                  .slice(-detail.trend.length)
                  .map((p) => ({
                    label: p.date.slice(0, 7),
                    value: p.close,
                  }))}
                leftName="GCI"
                rightName={priceHistory.ticker}
                ariaLabel="GCI versus price historical overlay"
              />
            </div>
          )}
        {priceHistory && priceHistory.points.length >= 2 && (
          <div className="chart-block" data-testid="stock-history">
            <h3 style={{ marginBottom: 4 }}>
              {t("common.history")} · {priceHistory.ticker}{" "}
              <span className="muted" style={{ fontSize: 12, fontWeight: 500 }}>
                ({priceHistory.kind?.includes("fmp") || priceHistory.kind?.includes("eod")
                  ? priceHistory.kind
                  : t("common.demoTape")}
                )
              </span>
            </h3>
            <LineChart
              points={priceHistory.points.map((p) => ({
                label: p.date.slice(0, 7),
                value: p.close,
              }))}
              height={140}
              ariaLabel={`${priceHistory.ticker} 5 year price (${priceHistory.kind || "demo"})`}
            />
            {priceHistory.note ? (
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                {priceHistory.note}
              </p>
            ) : null}
          </div>
        )}
        <div className="trend-row" data-testid="trend-row">
          {detail.trend.map((pt) => (
            <div key={pt.period} className="trend-point">
              <div className="muted">{pt.period}</div>
              <div className={`score ${scoreClass(pt.gci_score)}`}>
                {pt.gci_score ?? "—"}
              </div>
              <ChangeChip value={pt.change_pct} horizon={pt.change_horizon} />
            </div>
          ))}
        </div>
      </div>

      <div className="panel" id="analytics" data-testid="analytics-panel">
        <h2>
          Analytics · lead / lag · impact{" "}
          <span className="pill" title="Methodology incomplete">
            Experimental
          </span>
        </h2>
        <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
          Dependent variable = <strong>GCI</strong>. Independents = metrics & price
          tape. <strong>Descriptive only — not a forecast.</strong> Granger v1 uses
          LASSO → F-test on PIT series (≥12 quarters); proxy corr is optional.
          {analytics?.series_kind ? (
            <>
              {" "}
              Series: <strong>{String(analytics.series_kind)}</strong>
              {analytics.citeable ? " · citeable" : " · non-citeable / hybrid scaffold"}
            </>
          ) : null}
        </p>
        {analytics?.granger && (analytics.granger as { enabled?: boolean }).enabled !== false && (
          <div data-testid="granger-panel" style={{ marginBottom: 16 }}>
            <h3>Granger precedence (LASSO → F-test)</h3>
            <p className="muted" style={{ fontSize: 12 }}>
              {(analytics.granger as { disclaimer?: string }).disclaimer ||
                "Statistical precedence only — not causation, not a forecast."}
              {(analytics.granger as { sample_n?: number }).sample_n != null && (
                <> · N={(analytics.granger as { sample_n?: number }).sample_n}</>
              )}
              {(analytics.granger as { var_ready?: boolean }).var_ready ? (
                <> · VAR-ready sample</>
              ) : (
                <> · VAR held (need ≥24)</>
              )}
            </p>
            {Array.isArray((analytics.granger as { lasso_selected?: unknown[] }).lasso_selected) &&
              ((analytics.granger as { lasso_selected: Array<{ factor: string; coef?: number; corr?: number }> }).lasso_selected.length > 0) && (
                <p style={{ fontSize: 13 }}>
                  LASSO selected:{" "}
                  {(
                    analytics.granger as {
                      lasso_selected: Array<{ factor: string; coef?: number }>;
                    }
                  ).lasso_selected
                    .map((r) => `${r.factor}${r.coef != null ? ` (${r.coef})` : ""}`)
                    .join(", ")}
                </p>
              )}
            {Array.isArray((analytics.granger as { granger_tests?: unknown[] }).granger_tests) && (
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Factor</th>
                      <th>F</th>
                      <th>p</th>
                      <th>Best lag</th>
                      <th>Sig</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      analytics.granger as {
                        granger_tests: Array<{
                          factor?: string;
                          ok?: boolean;
                          reason?: string;
                          f_stat?: number;
                          p_value?: number;
                          best?: { lag?: number; corr?: number | null };
                          significant_0_05?: boolean;
                        }>;
                      }
                    ).granger_tests.map((t) => (
                      <tr key={t.factor || t.reason}>
                        <td>{t.factor || "—"}</td>
                        <td>{t.ok === false ? t.reason || "—" : t.f_stat ?? "—"}</td>
                        <td>{t.p_value ?? "—"}</td>
                        <td>
                          {t.best?.lag != null
                            ? `${t.best.lag} (corr ${t.best.corr ?? "—"})`
                            : "—"}
                        </td>
                        <td>{t.significant_0_05 ? "yes" : "no"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {Array.isArray((analytics.granger as { impact_map?: unknown[] }).impact_map) &&
              ((analytics.granger as { impact_map: Array<{ from?: string; to?: string; weight?: number; p_value?: number }> }).impact_map.length > 0) && (
                <>
                  <h3>Impact map (FDR edges)</h3>
                  <BarChart
                    rows={(
                      analytics.granger as {
                        impact_map: Array<{ from?: string; weight?: number }>;
                      }
                    ).impact_map.map((e) => ({
                      label: `${e.from || "?"} → GCI`,
                      value: e.weight ?? 0,
                    }))}
                    unit=""
                    ariaLabel="Granger impact map edges"
                  />
                </>
              )}
          </div>
        )}
        {analytics && analytics.show_experimental_ui === false && !(analytics.granger as { enabled?: boolean } | undefined)?.enabled ? (
          <p className="muted">Experimental proxy analytics UI disabled.</p>
        ) : analytics && analytics.show_experimental_ui !== false ? (
          <>
            <p>
              Dependent = <strong>{analytics.dependent || "gci"}</strong>
              {" · "}
              GCI ↔ price corr: <strong>{analytics.gci_price_corr ?? "—"}</strong>
              {analytics.sample_n != null && (
                <>
                  {" "}
                  · N={analytics.sample_n}
                  {analytics.window_label ? ` (${analytics.window_label})` : ""}
                </>
              )}
              {analytics.lead_lag_gci_vs_price?.best && (
                <>
                  {" "}
                  · best lag {analytics.lead_lag_gci_vs_price.best.lag} (corr{" "}
                  {analytics.lead_lag_gci_vs_price.best.corr})
                </>
              )}
            </p>
            {analytics.methodology && (
              <p className="muted" style={{ fontSize: 12 }}>
                {analytics.methodology}
              </p>
            )}
            {analytics.correlation_matrix?.variables?.length ? (
              <div className="table-scroll" data-testid="corr-matrix">
                <h3>Correlation matrix (proxy)</h3>
                <table className="table corr-matrix">
                  <thead>
                    <tr>
                      <th />
                      {analytics.correlation_matrix.variables.map((v) => (
                        <th key={v} title={v}>
                          {v.replace("metric:", "").slice(0, 12)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.correlation_matrix.variables.map((row) => (
                      <tr key={row}>
                        <th title={row}>{row.replace("metric:", "").slice(0, 14)}</th>
                        {analytics.correlation_matrix!.variables.map((col) => {
                          const cell =
                            analytics.correlation_matrix!.matrix[row]?.[col];
                          return (
                            <td
                              key={col}
                              className={
                                cell == null
                                  ? "muted"
                                  : cell >= 0.5
                                    ? "corr-pos"
                                    : cell <= -0.5
                                      ? "corr-neg"
                                      : ""
                              }
                            >
                              {cell == null ? "—" : cell.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            <h3>Impact factors → GCI (score proxy)</h3>
            <BarChart
              rows={(analytics.impact_factors || []).slice(0, 8).map((f) => ({
                label: f.factor.replaceAll("_", " "),
                value: f.impact_vs_gci,
              }))}
              unit=""
              ariaLabel="Impact factors versus GCI"
            />
            <p className="muted" style={{ fontSize: 12 }}>
              {analytics.note}
            </p>
          </>
        ) : analytics ? (
          <p className="muted" style={{ fontSize: 12 }}>
            {analytics.methodology || analytics.note}
          </p>
        ) : (
          <p className="muted">Analytics unavailable for this name.</p>
        )}
      </div>

      <div className="panel" id="notes" data-testid="private-notes">
        <h2>Private analyst notes</h2>
        <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
          Visible only to your API key / session — not shared org-wide.
        </p>
        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          rows={3}
          placeholder="Your insight…"
          style={{ width: "100%" }}
        />
        <button
          type="button"
          className="btn small"
          style={{ marginTop: 8 }}
          disabled={!noteDraft.trim()}
          onClick={async () => {
            await postNote({ company_id: detail.id, body: noteDraft.trim(), title: "Insight" });
            setNoteDraft("");
            setToast("Private note saved");
            reload();
          }}
        >
          Save note
        </button>
        <ul>
          {notes.map((n) => (
            <li key={n.id}>
              <strong>{n.title}</strong> — {n.body}
            </li>
          ))}
        </ul>
      </div>

      <div className="panel" id="report" data-testid="report-panel">
        <h2>Generate analyst report</h2>
        <div className="queue-ingest-row">
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn"
            onClick={async () => {
              const r = await postGenerateReport({
                company_id: detail.id,
                template_id: templateId,
              });
              setReportMd(r.markdown);
              setToast(`Report: ${r.template_name}`);
            }}
          >
            Generate
          </button>
        </div>
        {reportMd && (
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontSize: 12,
              maxHeight: 320,
              overflow: "auto",
              marginTop: 12,
            }}
          >
            {reportMd}
          </pre>
        )}
      </div>

      {hasThreads && (
        <div className="panel" id="threads" data-testid="promise-threads">
          <h2>
            Promise threads <InfoTip termId="thread" />
          </h2>
          <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
            How each guidance commitment was first stated, then raised / lowered /
            reiterated over time, and how it finally resolved.
          </p>
          <ThreadTimeline threads={detail.threads!} />
        </div>
      )}

      {hasMetricChanges && (
        <div className="panel" id="metrics">
          <h2>
            Metric change trends <InfoTip termId="change_trend" />
          </h2>
          <div className="chart-block">
            <BarChart
              rows={Object.entries(detail.by_metric_changes!).map(([metric, b]) => ({
                label: metric.replaceAll("_", " "),
                value: Number(b.yoy_pct ?? b.qoq_pct ?? b.pop_pct ?? 0),
                color:
                  Number(b.yoy_pct ?? b.qoq_pct ?? b.pop_pct ?? 0) >= 0
                    ? "var(--good)"
                    : "var(--bad)",
              }))}
              unit="%"
              ariaLabel="Metric YoY or PoP change bars"
            />
            <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              Bars show YoY when available, else QoQ / PoP (%). Absolute levels below.
            </p>
          </div>
          <div className="metrics">
            {Object.entries(detail.by_metric_changes!).map(([metric, b]) => (
              <div className="metric" key={metric}>
                <div className="label">{metric}</div>
                <div className="value" style={{ fontSize: 22 }}>
                  {b.value ?? "—"}
                </div>
                <ChangeTriple
                  mom={b.mom_pct}
                  qoq={b.qoq_pct}
                  yoy={b.yoy_pct}
                  pop={b.pop_pct}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel" id="pit">
        <h2>
          PIT history <InfoTip termId="pit" />
        </h2>
        {history.length >= 2 && (
          <div className="chart-block">
            <LineChart
              points={history.map((h) => ({
                label: h.as_of.slice(0, 7),
                value: h.gci_score,
              }))}
              yDomain={[0, 100]}
              ariaLabel="PIT GCI history"
            />
          </div>
        )}
        <div className="table-scroll">
          <table className="table" data-testid="pit-table">
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
                  <td className={`score ${scoreClass(h.gci_score)}`}>
                    {h.gci_score ?? "—"}
                  </td>
                  <td>
                    <ChangeChip value={h.change_pct} horizon={h.change_horizon} />
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={3} className="muted">
                    No PIT points.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel" id="context">
        <h2>
          Wordmap context <InfoTip termId="sentiment" />
        </h2>
        <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
          Entity vs industry tone themes — stub only; not part of GCI math.
        </p>
        {wordmap ? (
          <CompareBars
            rows={Object.keys(wordmap.entity).map((k) => ({
              label: k,
              left: wordmap.entity[k],
              right: wordmap.industry[k],
            }))}
            ariaLabel="Entity vs industry wordmap"
          />
        ) : (
          <div className="metrics">
            {Object.entries(detail.sentiment).map(([k, v]) => (
              <div className="metric" key={k}>
                <div className="label">{k.replaceAll("_", " ")}</div>
                <div className="value">{v}</div>
              </div>
            ))}
          </div>
        )}

        <h3 style={{ marginTop: 24 }}>Vernacular blurb</h3>
        <div className="desk-lang-row">
          {(vernacular?.supported_langs ?? ["en", "hi", "ta"]).map((l) => (
            <button
              key={l}
              type="button"
              className={`btn ghost small ${lang === l ? "active-lang" : ""}`}
              onClick={() => setLang(l)}
            >
              {l}
            </button>
          ))}
        </div>
        {vernacular && <blockquote className="desk-blurb">{vernacular.text}</blockquote>}
        <Disclaimer compact />
      </div>

      <p className="muted dossier-footer">
        <Link to="/desk" className="inline-link">
          Open One-Stop desk
        </Link>{" "}
        for PIT API, AlphaHunter import, vernacular badge, CSM.
      </p>
    </section>
  );
}
