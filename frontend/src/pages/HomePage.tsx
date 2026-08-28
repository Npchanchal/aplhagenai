import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChangeTriple } from "../components/ChangeChip";
import { LineChart } from "../components/Charts";
import Disclaimer from "../components/Disclaimer";
import InfoTip from "../components/InfoTip";
import QualityBadge from "../components/QualityBadge";
import SectorLeaderboard from "../components/SectorLeaderboard";
import Skeleton from "../components/Skeleton";
import TabBar from "../components/TabBar";
import WatchlistToggle from "../components/WatchlistToggle";
import { useAuth } from "../lib/auth";
import { useI18n } from "../i18n";
import {
  fetchAlerts,
  fetchCompanies,
  fetchCompaniesCount,
  fetchMarketHistory,
  fetchMarketIndexes,
  fetchMarkets,
  searchCompanies,
  type AlertItem,
  type CompanySummary,
  type IndexHistory,
  type Market,
  type MarketIndex,
} from "../lib/api";
import { formatScore, scoreClass } from "../lib/score";

const GCI_DEEP = new Set(["IN"]);
const PAGE_SIZE = 100;

type SortKey = "name" | "gci" | "delta" | "sector" | "peer";
type HomeTab = "universe" | "sectors";

const HOME_TABS: { id: HomeTab; label: string; title: string }[] = [
  {
    id: "universe",
    label: "Universe",
    title: "Screen companies by GCI level and Δ",
  },
  {
    id: "sectors",
    label: "Sectors",
    title: "Sector credibility leaderboard — average GCI by sector",
  },
];

export default function HomePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { preferences, updatePreferences } = useAuth();
  const homeTab: HomeTab = searchParams.get("tab") === "sectors" ? "sectors" : "universe";
  const setHomeTab = (id: HomeTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id === "universe") next.delete("tab");
        else next.set("tab", id);
        return next;
      },
      { replace: true },
    );
  };
  const [rows, setRows] = useState<CompanySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [indexes, setIndexes] = useState<MarketIndex[]>([]);
  const [indexHistory, setIndexHistory] = useState<IndexHistory | null>(null);
  const [market, setMarket] = useState(preferences?.default_market ?? "IN");
  const [index, setIndex] = useState(preferences?.default_index ?? "SENSEX");
  const [query, setQuery] = useState("");
  const entityQuery = query;
  const [entityExchange, setEntityExchange] = useState("");
  const [entityQuality, setEntityQuality] = useState("");
  const [entityCorpus, setEntityCorpus] = useState("");
  const [entityHits, setEntityHits] = useState<
    Array<{
      id: string;
      name: string;
      ticker: string;
      gci_score: number | null;
      data_quality?: string;
      corpus_status?: string;
      citeable_outcomes?: number;
      doc_count?: number;
      exchange?: string;
      sector?: string;
    }>
  >([]);
  const [sortKey, setSortKey] = useState<SortKey>("gci");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [historyOpen, setHistoryOpen] = useState(false);
  const deep = GCI_DEEP.has(market) && index === "SENSEX";
  const showLeaderboard = GCI_DEEP.has(market);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.ticker.toLowerCase().includes(q) ||
          c.sector.toLowerCase().includes(q)
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const na = (v: number | null | undefined) =>
        v == null || Number.isNaN(v) ? -Infinity * dir : v;
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "sector":
          return a.sector.localeCompare(b.sector) * dir;
        case "delta":
          return (na(a.gci_change_pct) - na(b.gci_change_pct)) * dir;
        case "peer":
          return (na(a.peer_rank_in_sector) - na(b.peer_rank_in_sector)) * dir;
        case "gci":
        default:
          return (na(a.gci_score) - na(b.gci_score)) * dir;
      }
    });
  }, [rows, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "sector" || key === "peer" ? "asc" : "desc");
    }
  }

  function openCompany(c: CompanySummary) {
    navigate(`/companies/${c.id}`);
  }

  useEffect(() => {
    if (preferences?.default_market) setMarket(preferences.default_market);
    if (preferences?.default_index) setIndex(preferences.default_index);
  }, [preferences?.default_market, preferences?.default_index]);

  useEffect(() => {
    fetchMarkets()
      .then((r) => setMarkets(r.markets))
      .catch(() => setMarkets([]));
  }, []);

  useEffect(() => {
    fetchMarketIndexes(market)
      .then((r) => {
        setIndexes(r.indexes);
        if (!r.indexes.some((i) => i.id === index) && r.indexes[0]) {
          setIndex(r.indexes[0].id);
        }
      })
      .catch(() => setIndexes([]));
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market]);

  useEffect(() => {
    setError(null);
    setLoading(true);
    const offset = page * PAGE_SIZE;
    Promise.all([
      fetchCompanies({ market, index, limit: PAGE_SIZE, offset }),
      fetchCompaniesCount({ market, index }),
      fetchAlerts(),
      fetchMarketHistory(market, { index, years: 5 }),
    ])
      .then(([c, count, a, h]) => {
        setRows(c);
        setTotal(count.count);
        setAlerts(a.slice(0, 8));
        setIndexHistory(h.index);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [market, index, page]);

  useEffect(() => {
    const q = entityQuery.trim();
    if (q.length < 2) {
      setEntityHits([]);
      return;
    }
    const handle = window.setTimeout(() => {
      searchCompanies(q, 12, {
        exchange: entityExchange || undefined,
        data_quality: entityQuality || undefined,
        corpus_status: entityCorpus || undefined,
      })
        .then((r) => setEntityHits(r.results || []))
        .catch(() => setEntityHits([]));
    }, 220);
    return () => window.clearTimeout(handle);
  }, [entityQuery, entityExchange, entityQuality, entityCorpus]);

  function onMarketChange(m: string) {
    setMarket(m);
    setPage(0);
    void updatePreferences({ default_market: m });
  }

  function onIndexChange(ix: string) {
    setIndex(ix);
    setPage(0);
    void updatePreferences({ default_index: ix });
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sortMark = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <section>
      <p className="page-kicker">{deep ? t("home.kicker") : `${market} · ${index}`}</p>
      <h1>
        {t("home.title")} <InfoTip termId="tracker" />
      </h1>
      <p className="muted lede">
        {t("home.lede")} <InfoTip termId="gci" /> Prefer{" "}
        <strong>citeable</strong> corpus hits for external use.{" "}
        <InfoTip termId="corpus_status" />
      </p>

      <div className="universe-filters" data-testid="universe-filters">
        <label>
          {t("common.market")} <InfoTip termId="market" />
          <select
            value={market}
            onChange={(e) => onMarketChange(e.target.value)}
            data-testid="market-select"
          >
            {markets.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <div className="index-chips" role="group" aria-label={t("common.index")}>
          {indexes.map((ix) => (
            <button
              key={ix.id}
              type="button"
              className={ix.id === index ? "chip active" : "chip"}
              onClick={() => onIndexChange(ix.id)}
              data-testid={`index-chip-${ix.id}`}
            >
              {ix.name}
            </button>
          ))}
        </div>
        <label className="universe-search entity-search" data-testid="entity-search">
          Search <InfoTip termId="corpus_status" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, ticker, sector, or any NSE / BSE listing…"
            data-testid="universe-search"
            autoComplete="off"
          />
          <div className="entity-facets" data-testid="entity-facets">
            <select
              value={entityExchange}
              onChange={(e) => setEntityExchange(e.target.value)}
              aria-label="Exchange facet"
            >
              <option value="">All exchanges</option>
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </select>
            <select
              value={entityQuality}
              onChange={(e) => setEntityQuality(e.target.value)}
              aria-label="Quality facet"
            >
              <option value="">All quality</option>
              <option value="hand_labeled">Hand-labeled</option>
              <option value="demo_structured">Demo</option>
              <option value="listing_provisional">Provisional</option>
            </select>
            <select
              value={entityCorpus}
              onChange={(e) => setEntityCorpus(e.target.value)}
              aria-label="Corpus facet"
            >
              <option value="">All corpus</option>
              <option value="gci_citeable">Citeable</option>
              <option value="gci_available">In corpus</option>
              <option value="listed_not_in_corpus">Listed only</option>
            </select>
          </div>
          {entityHits.length > 0 && (
            <ul className="entity-search-results" data-testid="entity-search-results">
              {entityHits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/companies/${h.id}`)}
                  >
                    <strong>{h.ticker}</strong> {h.name}{" "}
                    <span className={`score ${scoreClass(h.gci_score)}`}>
                      {formatScore(h.gci_score)}
                    </span>
                    <span className="muted" style={{ fontSize: 11, marginLeft: 6 }}>
                      {h.exchange ? `${h.exchange} · ` : ""}
                      {h.corpus_status === "gci_citeable"
                        ? "citeable"
                        : h.corpus_status === "listed_not_in_corpus"
                          ? "listed · not in corpus"
                          : h.data_quality || ""}
                      {h.doc_count != null ? ` · ${h.doc_count} docs` : ""}
                      {h.citeable_outcomes != null && h.citeable_outcomes > 0
                        ? ` · ${h.citeable_outcomes} citeable`
                        : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>
      </div>

      {!deep && (
        <p className="scaffold-banner" data-testid="scaffold-banner">
          {index === "NSE_ALL" || index === "BSE_ALL" || index === "IN1000" ? (
            <>
              Full NSE/BSE equity masters scored with GCI v2. Sensex = hand-labeled;
              other names = Provisional (deterministic demo outcomes — not for
              citation). <InfoTip termId="nse_bse" />
            </>
          ) : (
            t("home.scaffold")
          )}
        </p>
      )}

      <TabBar
        tabs={HOME_TABS}
        active={homeTab}
        onChange={(id) => setHomeTab(id as HomeTab)}
        ariaLabel="GCI views"
      />

      {homeTab === "sectors" ? (
        <div className="workbench" data-testid="gci-sectors-tab">
          <div className="workbench-main">
            {showLeaderboard ? (
              <SectorLeaderboard market={market} index={index} limit={40} />
            ) : (
              <div className="panel">
                <p className="muted">
                  Sector credibility leaderboard is available for India markets. Switch
                  market to India to compare sector average GCI.
                </p>
              </div>
            )}
            <Disclaimer />
          </div>
        </div>
      ) : (
      <div className="workbench">
        <div className="workbench-main">
          <div className="panel">
            <div className="panel-head">
              <h2>{t("home.universe")}</h2>
              <span className="muted" style={{ fontSize: 13 }}>
                {loading
                  ? t("common.loading")
                  : total > 0
                    ? `${t("home.names", { n: total })} · ${page + 1}/${pageCount}`
                    : "—"}
              </span>
            </div>
            {error && <p className="error">{error}</p>}
            {loading && !error && <Skeleton rows={8} label={t("common.loading")} />}
            {!loading && !error && filtered.length === 0 && (
              <div className="empty">
                {query
                  ? `No names in this index match “${query}”. Try entity results above, or clear search.`
                  : "No companies in this index."}
              </div>
            )}
            {!loading && filtered.length > 0 && (
              <div className="table-scroll table-scroll-tall">
                <table className="table" data-testid="company-table">
                  <thead>
                    <tr>
                      <th aria-label="Watchlist" />
                      <th>
                        <button type="button" className="th-sort" onClick={() => toggleSort("name")}>
                          {t("common.company")}
                          {sortMark("name")}
                        </button>
                      </th>
                      <th>{t("common.ticker")}</th>
                      <th>
                        <button
                          type="button"
                          className="th-sort"
                          onClick={() => toggleSort("sector")}
                        >
                          {t("common.sector")}
                          {sortMark("sector")}
                        </button>
                      </th>
                      <th>
                        <button type="button" className="th-sort" onClick={() => toggleSort("gci")}>
                          GCI
                          {sortMark("gci")}
                        </button>{" "}
                        <InfoTip termId="gci" />
                      </th>
                      <th>
                        <button
                          type="button"
                          className="th-sort"
                          onClick={() => toggleSort("delta")}
                        >
                          Δ GCI
                          {sortMark("delta")}
                        </button>{" "}
                        <InfoTip termId="change_trend" />
                      </th>
                      <th>
                        {t("common.quality")} <InfoTip termId="data_quality" />
                      </th>
                      <th>
                        <button type="button" className="th-sort" onClick={() => toggleSort("peer")}>
                          {t("common.peer")}
                          {sortMark("peer")}
                        </button>{" "}
                        <InfoTip termId="peer_rank" />
                      </th>
                      <th>
                        {t("common.sectorAvg")} <InfoTip termId="sector_avg" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => {
                      return (
                        <tr
                          key={c.id}
                          className="row-link"
                          tabIndex={0}
                          onClick={() => openCompany(c)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openCompany(c);
                            }
                          }}
                          aria-label={`Open ${c.name} dossier`}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <WatchlistToggle companyId={c.id} compact />
                          </td>
                          <td>
                            <Link
                              to={`/companies/${c.id}`}
                              data-testid={`company-link-${c.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {c.name}
                            </Link>
                          </td>
                          <td>{c.ticker}</td>
                          <td>{c.sector}</td>
                          <td className={`score ${scoreClass(c.gci_score)}`}>
                            {formatScore(c.gci_score)}
                          </td>
                          <td>
                            <ChangeTriple
                              wow={c.wow_pct}
                              mom={c.mom_pct}
                              qoq={c.qoq_pct}
                              yoy={c.yoy_pct}
                              pop={c.gci_change_pct}
                              popHorizon={c.gci_change_horizon}
                            />
                          </td>
                          <td>
                            <QualityBadge
                              quality={c.data_quality}
                              testId={`quality-${c.id}`}
                            />
                          </td>
                          <td>{c.peer_rank_in_sector ?? "—"}</td>
                          <td>{c.sector_avg_gci ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {total > PAGE_SIZE && (
              <div className="pager" data-testid="universe-pager">
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  ← Prev
                </button>
                <span className="muted" style={{ fontSize: 13 }}>
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of{" "}
                  {total}
                </span>
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                >
                  Next →
                </button>
              </div>
            )}
            <Disclaimer />
          </div>

          {indexHistory && (
            <details
              className="panel history-panel"
              data-testid="index-history"
              open={historyOpen}
              onToggle={(e) => setHistoryOpen((e.target as HTMLDetailsElement).open)}
            >
              <summary className="panel-head history-summary">
                <h2>
                  {t("common.history")} · {indexHistory.name}
                </h2>
                <span className="muted" style={{ fontSize: 13 }}>
                  {t("common.demoTape")}
                  {indexHistory.change_pct != null
                    ? ` · 5Y ${indexHistory.change_pct > 0 ? "+" : ""}${indexHistory.change_pct}%`
                    : ""}
                </span>
              </summary>
              <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
                {t("home.historyNote")}
              </p>
              <LineChart
                points={indexHistory.points.map((p) => ({
                  label: p.date.slice(0, 7),
                  value: p.close,
                }))}
                height={140}
                ariaLabel={`${indexHistory.name} 5 year demo history`}
              />
            </details>
          )}
        </div>

        <aside className="workbench-rail">
          <div className="panel" data-testid="alerts-panel">
            <div className="panel-head">
              <h2>
                {t("common.alerts")} <InfoTip termId="alerts" />
              </h2>
            </div>
            {loading && alerts.length === 0 ? (
              <Skeleton rows={4} />
            ) : alerts.length === 0 ? (
              <p className="muted">{t("common.noAlerts")}</p>
            ) : (
              <ul className="alert-list">
                {alerts.map((a) => (
                  <li
                    key={`${a.company_id}-${a.kind}-${a.message}`}
                    className={`alert-item severity-${a.severity}`}
                  >
                    <Link
                      to={
                        a.kind === "docs_pending_review"
                          ? `/desk?tab=review`
                          : `/companies/${a.company_id}`
                      }
                    >
                      <span className="alert-kind">{a.kind.replace(/_/g, " ")}</span>
                      <strong>{a.ticker}</strong> — {a.message}
                    </Link>
                    <span className={`pill ${a.severity}`}>{a.severity}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
      )}
    </section>
  );
}
