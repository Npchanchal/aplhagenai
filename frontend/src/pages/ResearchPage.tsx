import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ChangeChip, { ChangeTriple } from "../components/ChangeChip";
import { LineChart, Sparkline } from "../components/Charts";
import CompanyPicker from "../components/CompanyPicker";
import Disclaimer from "../components/Disclaimer";
import InfoTip from "../components/InfoTip";
import QualityBadge from "../components/QualityBadge";
import ScoreReveal from "../components/ScoreReveal";
import SectorLeaderboard from "../components/SectorLeaderboard";
import TabBar from "../components/TabBar";
import CitationCard from "../components/CitationCard";
import CitedAnswer from "../components/CitedAnswer";
import WatchlistToggle from "../components/WatchlistToggle";
import PlanAccessGate from "../components/PlanAccessGate";
import {
  fetchCompanies,
  fetchResearchBrief,
  fetchResearchChat,
  fetchResearchEstimates,
  fetchResearchNews,
  fetchResearchSearch,
  fetchResearchSnapshot,
  fetchResearchTranscripts,
  fetchResearchWatchlist,
  type CompanySummary,
  type PromiseBrief,
  type ResearchDoc,
  type CitationRecord,
  type ResearchEstimateRow,
  type ResearchSnapshot,
  type WatchlistItem,
} from "../lib/api";
import { formatScore, scoreClass } from "../lib/score";
import { tipText } from "../lib/glossary";
import { useAuth } from "../lib/auth";
import { useI18n } from "../i18n";
import { useSourceViewer } from "../lib/SourceViewerContext";
import { withTextHighlight } from "../lib/sourceHighlight";

type Tab = "search" | "chat" | "desk" | "sectors" | "news" | "watch";

const TABS: { id: Tab; label: string; title: string }[] = [
  {
    id: "search",
    label: "Search",
    title: "Primary-source document search over filings, transcripts, and guidance.",
  },
  {
    id: "chat",
    label: "AI Chat",
    title: "Cite-only answers from the document store. Refuses when evidence is missing.",
  },
  {
    id: "desk",
    label: "Desk snapshot",
    title: tipText("research_terminal"),
  },
  {
    id: "sectors",
    label: "Sectors",
    title: "Sector credibility leaderboard — average GCI by sector",
  },
  {
    id: "news",
    label: "News & filings",
    title: "Chronological news and filings feed for the focus name or universe.",
  },
  {
    id: "watch",
    label: "Watchlist",
    title: "Watchlist tape with MoM/QoQ/YoY and GCI Δ — click through to desk snapshot.",
  },
];

const DOC_TYPES = ["all", "guidance", "transcript", "filing", "news", "expert"] as const;

export default function ResearchPage() {
  const { preferences, token, updatePreferences } = useAuth();
  const { t } = useI18n();
  const { openSource } = useSourceViewer();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: Tab = TABS.some((x) => x.id === tabParam)
    ? (tabParam as Tab)
    : "search";
  const setTab = (id: Tab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", id);
        return next;
      },
      { replace: true }
    );
  };
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [companyId, setCompanyId] = useState("infy");
  const [q, setQ] = useState("guidance margin");
  const [docType, setDocType] = useState<(typeof DOC_TYPES)[number]>("all");
  const [results, setResults] = useState<ResearchDoc[]>([]);
  const [question, setQuestion] = useState(
    "How credible is management guidance on revenue growth?"
  );
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<CitationRecord[]>([]);
  const [snapshot, setSnapshot] = useState<ResearchSnapshot | null>(null);
  const [brief, setBrief] = useState<PromiseBrief | null>(null);
  const [estimates, setEstimates] = useState<ResearchEstimateRow[]>([]);
  const [news, setNews] = useState<ResearchDoc[]>([]);
  const [watch, setWatch] = useState<WatchlistItem[]>([]);
  const [transcripts, setTranscripts] = useState<ResearchDoc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const market = preferences?.default_market ?? "IN";
  const index = preferences?.default_index ?? "SENSEX";

  useEffect(() => {
    fetchCompanies({ market, index, limit: 200 })
      .then((c) => {
        setCompanies(c);
        if (!c.find((r) => r.id === companyId) && c[0]) setCompanyId(c[0].id);
      })
      .catch((e: Error) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, index]);

  useEffect(() => {
    if (tab === "desk") {
      Promise.all([
        fetchResearchSnapshot(companyId),
        fetchResearchEstimates(companyId),
        fetchResearchTranscripts(companyId),
        fetchResearchBrief(companyId).catch(() => null),
      ])
        .then(([s, e, t, b]) => {
          setSnapshot(s);
          setEstimates(e.estimates);
          setTranscripts(t.transcripts);
          setBrief(b);
        })
        .catch((err: Error) => setError(err.message));
    }
    if (tab === "news") {
      fetchResearchNews(companyId)
        .then((n) => setNews(n.items))
        .catch((err: Error) => setError(err.message));
    }
    if (tab === "watch") {
      const ids = preferences?.watchlist?.length ? preferences.watchlist : undefined;
      fetchResearchWatchlist({ companyIds: ids, token })
        .then((w) => setWatch(w.items))
        .catch((err: Error) => setError(err.message));
    }
  }, [tab, companyId, preferences?.watchlist, token]);

  const filteredResults = useMemo(() => {
    if (docType === "all") return results;
    return results.filter((r) => r.doc_type === docType);
  }, [results, docType]);

  const runSearch = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchResearchSearch(q, companyId || undefined);
      setResults(res.results);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const runChat = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchResearchChat(question, companyId || undefined);
      setAnswer(res.answer);
      setCitations(res.citations || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PlanAccessGate
      feature="research"
      title={t("research.title")}
      kicker={t("research.kicker")}
      description={`${t("research.lede")} Pilot and retail plans unlock the full Research Terminal.`}
      returnTo="/research"
      testId="research-access-gate"
    >
    <section className="research-page" data-testid="research-page">
      <p className="page-kicker">{t("research.kicker")}</p>
      <h1>
        {t("research.title")} <InfoTip termId="research_terminal" />
      </h1>
      <p className="muted lede">
        {t("research.lede")} Answers cite document snippets only — not provisional GCI
        shells. Prefer Hand-labeled dossiers for guidance delivery claims.{" "}
        <InfoTip termId="citability" />
      </p>

      <div className="panel research-toolbar research-sticky">
        <CompanyPicker
          companies={companies}
          value={companyId}
          onChange={setCompanyId}
          label={t("research.focus")}
          testId="research-company"
        />
        <TabBar
          tabs={TABS}
          active={tab}
          onChange={(id) => setTab(id as Tab)}
          ariaLabel="Research modes"
        />
      </div>

      {error && <p className="error">{error}</p>}

      {tab === "sectors" && (
        <div data-testid="research-sectors-tab">
          <SectorLeaderboard market="IN" index="SENSEX" limit={40} />
          <Disclaimer />
        </div>
      )}

      {tab === "search" && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Document search</h2>
          <p className="muted">Guidance quotes, transcripts, filings, expert notes.</p>
          <div className="chip-row" role="group" aria-label="Document type">
            {DOC_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                className={`type-chip ${docType === t ? "active" : ""}`}
                onClick={() => setDocType(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="search-row">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. margin guidance FY26"
              data-testid="research-query"
              onKeyDown={(e) => {
                if (e.key === "Enter") void runSearch();
              }}
            />
            <button type="button" className="btn" onClick={runSearch} disabled={busy}>
              Search
            </button>
          </div>
          <ul className="doc-list">
            {filteredResults.map((r) => (
              <li key={r.id}>
                <div className="doc-meta">
                  <span className={`pill ${r.doc_type}`}>{r.doc_type}</span>
                  <strong>{r.ticker}</strong>
                  <span className="muted">{r.date}</span>
                  {r.source && <span className="muted">{r.source}</span>}
                </div>
                <div>{r.title}</div>
                <p className="muted">{r.snippet}</p>
                <button
                  type="button"
                  className="linkish"
                  onClick={() =>
                    openSource({
                      doc_id: r.id,
                      title: r.title,
                      source_url: r.url,
                      highlight_url: withTextHighlight(r.url, r.snippet),
                      quote: r.snippet,
                      document_text: r.body,
                      company_id: r.company_id,
                    })
                  }
                >
                  Open source →
                </button>
              </li>
            ))}
            {results.length > 0 && filteredResults.length === 0 && (
              <li className="muted">No documents for type “{docType}”.</li>
            )}
          </ul>
        </div>
      )}

      {tab === "chat" && (
        <PlanAccessGate
          feature="research_chat"
          variant="panel"
          title="Research chat"
          description="Cite-only answers from the document store. Refuses when evidence is missing — Pilot+ plans required."
          returnTo="/research?tab=chat"
          testId="research-chat-gate"
        >
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Research chat</h2>
          <p className="muted">
            Cite-only answers. Refuses when no evidence is indexed for the question.
          </p>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            data-testid="research-question"
          />
          <button
            type="button"
            className="btn"
            onClick={runChat}
            disabled={busy}
            style={{ marginTop: 8 }}
          >
            Ask
          </button>
          {answer && (
            <div className="chat-answer" data-testid="research-answer">
              <CitedAnswer text={answer} citations={citations} />
              {citations.length > 0 ? (
                <>
                  <h3>Citations</h3>
                  <div className="citation-stack">
                    {citations.map((c, idx) => (
                      <CitationCard
                        key={c.citation_id || c.doc_id || String(idx)}
                        citation={c}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <p className="muted">No citations returned.</p>
              )}
            </div>
          )}
        </div>
        </PlanAccessGate>
      )}

      {tab === "desk" && snapshot && (
        <div className="panel">
          <div className="dossier-hero" style={{ borderBottom: "1px solid var(--line)" }}>
            <div>
              <p className="page-kicker">Desk snapshot</p>
              <h2 style={{ marginTop: 0 }}>
                {snapshot.ticker} · {snapshot.name}
              </h2>
              <div className="dossier-meta">
                <span>{snapshot.sector}</span>
                <QualityBadge quality={snapshot.gci.data_quality} />
                <span className="pill warn">Demo tape</span>
              </div>
            </div>
            <div className="dossier-score-block">
              <span className="field-label">GCI</span>
              <ScoreReveal score={snapshot.gci.score} size="md" />
              <div style={{ marginTop: 6 }}>
                <ChangeChip
                  value={snapshot.gci.change_pct}
                  horizon={snapshot.gci.change_horizon}
                />
              </div>
            </div>
          </div>
          <p className="muted" style={{ fontSize: 13 }}>
            Levels plus MoM / QoQ / YoY — increments are the desk primary signal.{" "}
            <InfoTip termId="change_trend" />
          </p>
          {snapshot.gci.trend && snapshot.gci.trend.length >= 2 && (
            <div className="chart-block">
              <h3 className="chart-title">GCI path</h3>
              <LineChart
                points={snapshot.gci.trend.map((t) => ({
                  label: t.period,
                  value: t.gci_score,
                }))}
                yDomain={[0, 100]}
                ariaLabel="Research desk GCI trend"
              />
            </div>
          )}
          <div className="metrics">
            <div className="metric">
              <div className="label">Last (demo)</div>
              <div className="value">{snapshot.market.last}</div>
              <ChangeTriple
                mom={snapshot.market.mom_pct}
                qoq={snapshot.market.qoq_pct}
                yoy={snapshot.market.yoy_pct}
                pop={snapshot.market.change_pct}
              />
            </div>
            <div className="metric">
              <div className="label">Mkt cap (Cr)</div>
              <div className="value" style={{ fontSize: 22 }}>
                {snapshot.market.mkt_cap_cr}
              </div>
            </div>
            <div className="metric">
              <div className="label">Volume</div>
              <div className="value" style={{ fontSize: 22 }}>
                {snapshot.market.volume.toLocaleString()}
              </div>
            </div>
          </div>
          <p className="muted">{snapshot.market.note}</p>

          {brief && (
            <div className="brief-card" data-testid="promise-brief">
              <div className="brief-head">
                <div>
                  <h2 style={{ margin: 0 }}>Pre-earnings promise brief</h2>
                  <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                    {brief.note}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => window.print()}
                >
                  Print brief
                </button>
              </div>
              {brief.promises.length === 0 ? (
                <p className="muted">
                  No open (pending) guidance for {brief.ticker} — nothing on the line
                  this reporting cycle.
                </p>
              ) : (
                <ul className="brief-list">
                  {brief.promises.map((p) => (
                    <li key={`${p.period}-${p.metric}`} className="brief-item">
                      <div className="brief-item-head">
                        <strong style={{ textTransform: "capitalize" }}>
                          {p.metric.replaceAll("_", " ")}
                        </strong>
                        <span className="muted">{p.period}</span>
                        <span className="queue-band">
                          {p.guided_band[0] != null && p.guided_band[1] != null
                            ? `${p.guided_band[0]}–${p.guided_band[1]}`
                            : p.guided_value}
                        </span>
                        <span className="muted">street {p.street_consensus}</span>
                      </div>
                      <p className="muted brief-quote">
                        “{p.guided_text}” — {p.speaker}
                      </p>
                      <p className="brief-hitrate">
                        {p.history.closed > 0 ? (
                          <>
                            Kept this kind of promise{" "}
                            <strong>
                              {p.history.kept} of {p.history.closed}
                            </strong>{" "}
                            times ({p.history.hit_rate_pct}%)
                            {p.history.missed > 0 && ` · ${p.history.missed} missed`}
                            {p.history.dropped > 0 && ` · ${p.history.dropped} dropped`}
                          </>
                        ) : (
                          "No closed history on this metric yet."
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <p className="muted" style={{ fontSize: 12 }}>
                {brief.disclaimer}
              </p>
            </div>
          )}

          <h2>Fundamentals (level + change)</h2>
          <p className="muted">
            Context only — reported levels with MoM/QoQ/YoY.{" "}
            <strong>Not part of GCI</strong> (GCI is guidance vs actuals).
          </p>
          <div className="metrics">
            {Object.entries(snapshot.fundamentals_demo).map(([k, v]) => {
              const bundle =
                typeof v === "number"
                  ? {
                      value: v,
                      mom_pct: null,
                      qoq_pct: null,
                      yoy_pct: null,
                      pop_pct: null,
                    }
                  : v;
              return (
                <div className="metric" key={k}>
                  <div className="label">{k.replaceAll("_", " ")}</div>
                  <div className="value" style={{ fontSize: 22 }}>
                    {bundle.value ?? "—"}
                  </div>
                  {typeof v !== "number" && v.history && v.history.length >= 2 && (
                    <Sparkline values={v.history.map((h) => h.value)} />
                  )}
                  <ChangeTriple
                    mom={bundle.mom_pct}
                    qoq={bundle.qoq_pct}
                    yoy={bundle.yoy_pct}
                    pop={bundle.pop_pct}
                    popHorizon={typeof v === "object" ? v.pop_horizon : null}
                  />
                </div>
              );
            })}
          </div>

          <h2>Street vs guidance vs actual</h2>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Metric</th>
                  <th>Street</th>
                  <th>Δ Street</th>
                  <th>Guidance</th>
                  <th>Δ Guide</th>
                  <th>Actual</th>
                  <th>Δ Actual</th>
                  <th>Label</th>
                </tr>
              </thead>
              <tbody>
                {estimates.map((e) => (
                  <tr key={`${e.period}-${e.metric}`}>
                    <td>{e.period}</td>
                    <td>{e.metric}</td>
                    <td>
                      {e.street_consensus ?? "—"}
                      {e.street_source ? (
                        <span className="muted" style={{ marginLeft: 6, fontSize: 11 }}>
                          ({e.street_source})
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <ChangeChip
                        value={e.street_consensus_change_pct}
                        horizon={e.street_consensus_change_horizon}
                      />
                    </td>
                    <td>{e.management_guidance}</td>
                    <td>
                      <ChangeChip
                        value={e.management_guidance_change_pct}
                        horizon={e.management_guidance_change_horizon}
                      />
                    </td>
                    <td>{e.actual ?? "—"}</td>
                    <td>
                      <ChangeChip
                        value={e.actual_change_pct}
                        horizon={e.actual_change_horizon}
                      />
                    </td>
                    <td>
                      <span className={`pill ${e.gci_label}`}>{e.gci_label}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 style={{ marginTop: 24 }}>Transcripts</h2>
          <ul className="doc-list">
            {transcripts.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="linkish"
                  onClick={() =>
                    openSource({
                      doc_id: t.id,
                      title: t.title,
                      source_url: t.url,
                      highlight_url: withTextHighlight(t.url, t.snippet || t.body?.slice(0, 80)),
                      quote: t.snippet,
                      document_text: t.body,
                      company_id: t.company_id,
                    })
                  }
                >
                  <strong>{t.title}</strong>
                </button>
                <p className="muted">{t.body}</p>
              </li>
            ))}
            {transcripts.length === 0 && (
              <li className="muted">No sample transcript for this name yet.</li>
            )}
          </ul>
          <p style={{ marginTop: 12 }}>
            <Link
              to={`/companies/${companyId}`}
              style={{ color: "var(--accent)", fontWeight: 600 }}
            >
              Open GCI evidence trail →
            </Link>
          </p>
          <Disclaimer />
        </div>
      )}

      {tab === "news" && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>News &amp; filings feed</h2>
          <ul className="doc-list">
            {news.map((n) => (
              <li key={n.id}>
                <div className="doc-meta">
                  <span className={`pill ${n.doc_type}`}>{n.doc_type}</span>
                  <strong>{n.ticker}</strong>
                  <span className="muted">{n.date}</span>
                </div>
                <div>{n.title}</div>
                <p className="muted">{n.snippet}</p>
                <button
                  type="button"
                  className="linkish"
                  onClick={() =>
                    openSource({
                      doc_id: n.id,
                      title: n.title,
                      source_url: n.url,
                      highlight_url: withTextHighlight(n.url, n.snippet),
                      quote: n.snippet,
                      document_text: n.body,
                      company_id: n.company_id,
                    })
                  }
                >
                  Open source →
                </button>
              </li>
            ))}
            {news.length === 0 && <li className="muted">No items yet.</li>}
          </ul>
        </div>
      )}

      {tab === "watch" && (
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Watchlist</h2>
          <p className="muted" style={{ fontSize: 13 }}>
            Star names on the Tracker or dossier to customize this list. Empty prefs → default
            universe slice. Last + MoM/QoQ/YoY, GCI + Δ. Click ticker for desk snapshot.
          </p>
          {(!preferences?.watchlist || preferences.watchlist.length === 0) && (
            <p className="muted" style={{ fontSize: 13 }}>
              Showing default names. Add tickers via ★ on{" "}
              <Link to="/tracker">GCI Tracker</Link>.
            </p>
          )}
          <div className="table-scroll">
            <table className="table" data-testid="research-watchlist">
              <thead>
                <tr>
                  <th aria-label="Watchlist" />
                  <th>Ticker</th>
                  <th>Name</th>
                  <th>Last</th>
                  <th>MoM/QoQ/YoY</th>
                  <th>GCI</th>
                  <th>Δ GCI</th>
                </tr>
              </thead>
              <tbody>
                {watch.map((w) => (
                  <tr key={w.company_id} className="row-link">
                    <td>
                      <WatchlistToggle companyId={w.company_id} compact />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => {
                          setCompanyId(w.company_id);
                          setTab("desk");
                        }}
                      >
                        {w.ticker}
                      </button>
                    </td>
                    <td>{w.name}</td>
                    <td>{w.last}</td>
                    <td>
                      <ChangeTriple
                        mom={w.mom_pct}
                        qoq={w.qoq_pct}
                        yoy={w.yoy_pct}
                        pop={w.change_pct}
                      />
                    </td>
                    <td className={`score ${scoreClass(w.gci_score)}`}>
                      {formatScore(w.gci_score)}
                    </td>
                    <td>
                      <ChangeChip
                        value={w.gci_change_pct}
                        horizon={w.gci_change_horizon}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {watch.length > 0 && preferences?.watchlist && preferences.watchlist.length > 0 && (
            <p style={{ marginTop: 12 }}>
              <button
                type="button"
                className="btn ghost"
                onClick={() => void updatePreferences({ watchlist: [] })}
              >
                Reset to default list
              </button>
            </p>
          )}
        </div>
      )}
    </section>
    </PlanAccessGate>
  );
}
