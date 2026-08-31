/**
 * CiteAlpha Desk Console — multi-pane ops surface inspired by institutional
 * terminal density. Content is GCI / guidance / evidence only (not a quote OMS).
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import ChangeChip from "./ChangeChip";
import { LineChart } from "./Charts";
import QualityBadge from "./QualityBadge";
import ScoreReveal from "./ScoreReveal";
import {
  fetchAlerts,
  fetchCompanies,
  fetchCompanyGci,
  fetchExtractPending,
  fetchHistory,
  fetchLabelingQueue,
  fetchSectorLeaderboard,
  type AlertItem,
  type CompanyGCIDetail,
  type CompanySummary,
  type LabelingQueueItem,
  type PendingExtractBatch,
} from "../lib/api";
import { formatScore } from "../lib/score";

type Props = {
  companyId: string;
  onSelectCompany: (id: string) => void;
  onJumpTab?: (tab: string) => void;
};

function gciTone(score: number | null | undefined): "up" | "down" | "flat" {
  if (score == null) return "flat";
  if (score >= 75) return "up";
  if (score < 55) return "down";
  return "flat";
}

function severityClass(sev: string): string {
  const s = (sev || "").toLowerCase();
  if (s.includes("high") || s.includes("crit")) return "ilc-tag ilc-tag-high";
  if (s.includes("med") || s.includes("warn")) return "ilc-tag ilc-tag-med";
  return "ilc-tag ilc-tag-low";
}

export default function DeskConsole({ companyId, onSelectCompany, onJumpTab }: Props) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<CompanySummary[]>([]);
  const [detail, setDetail] = useState<CompanyGCIDetail | null>(null);
  const [history, setHistory] = useState<{ as_of: string; gci_score: number | null }[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [sectors, setSectors] = useState<
    Array<{ sector: string; avg: number | null; count: number }>
  >([]);
  const [pending, setPending] = useState<PendingExtractBatch[]>([]);
  const [labelQ, setLabelQ] = useState<LabelingQueueItem[]>([]);
  const [clock, setClock] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [cos, al, sec, ext, lq] = await Promise.all([
          fetchCompanies({ market: "IN", index: "SENSEX", limit: 40 }),
          fetchAlerts().catch(() => [] as AlertItem[]),
          fetchSectorLeaderboard({ market: "IN", index: "SENSEX", limit: 40 }),
          fetchExtractPending().catch(() => ({ count: 0, batches: [] as PendingExtractBatch[] })),
          fetchLabelingQueue().catch(() => ({ count: 0, items: [] as LabelingQueueItem[] })),
        ]);
        if (cancelled) return;
        setRows(cos);
        setAlerts(al.slice(0, 24));
        setSectors(sec.sectors || []);
        setPending((ext.batches || []).slice(0, 12));
        setLabelQ((lq.items || []).slice(0, 12));
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Console load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, h] = await Promise.all([
          fetchCompanyGci(companyId),
          fetchHistory(companyId).catch(() => []),
        ]);
        if (cancelled) return;
        setDetail(d);
        setHistory(h);
      } catch {
        if (!cancelled) setDetail(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.ticker.toLowerCase().includes(needle) ||
        r.name.toLowerCase().includes(needle) ||
        r.id.toLowerCase().includes(needle) ||
        (r.sector || "").toLowerCase().includes(needle)
    );
  }, [rows, q]);

  const selected = rows.find((r) => r.id === companyId) || null;
  const peers = useMemo(() => {
    if (!selected) return rows.slice(0, 6);
    return rows
      .filter((r) => r.sector === selected.sector && r.id !== selected.id)
      .slice(0, 6);
  }, [rows, selected]);

  const chartPts = useMemo(
    () =>
      history
        .filter((p) => p.gci_score != null)
        .map((p) => ({ label: p.as_of, value: p.gci_score })),
    [history]
  );

  const outcomes = (detail?.outcomes || []).slice(0, 14);
  const byMetric = detail?.by_metric || {};
  const metricBars = Object.entries(byMetric)
    .slice(0, 8)
    .map(([metric, score]) => ({ metric, score: score as number }));

  const maxSectorCount = Math.max(1, ...sectors.map((s) => s.count || 1));
  const hlCount = rows.filter((r) => r.data_quality === "hand_labeled").length;
  const scored = rows.filter((r) => r.gci_score != null).length;

  function runCommand(raw: string) {
    const s = raw.trim();
    if (!s) return;
    if (s.startsWith("/")) {
      const cmd = s.slice(1).toLowerCase();
      if (cmd.startsWith("tab ")) onJumpTab?.(cmd.slice(4).trim());
      else if (["review", "evidence", "tracker", "corpus", "pit"].includes(cmd))
        onJumpTab?.(cmd);
      return;
    }
    const hit = rows.find(
      (r) =>
        r.ticker.toLowerCase() === s.toLowerCase() ||
        r.id.toLowerCase() === s.toLowerCase()
    );
    if (hit) onSelectCompany(hit.id);
    else setQ(s);
  }

  return (
    <div className="il-console" data-testid="desk-console">
      <header className="ilc-top">
        <div className="ilc-brand" aria-label="CiteAlpha Console">
          <BrandLogo variant="header" link={false} className="ilc-logo-wordmark" />
          <span className="ilc-product">GCI Console</span>
        </div>
        <form
          className="ilc-cmd"
          onSubmit={(e) => {
            e.preventDefault();
            runCommand(q);
          }}
        >
          <span className="ilc-cmd-prompt" aria-hidden>
            ⌘
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ticker / name · or /review /evidence /pit"
            aria-label="Console command"
            data-testid="desk-console-cmd"
          />
        </form>
        <div className="ilc-top-meta">
          <span className="ilc-pill">Sensex · {scored}/{rows.length}</span>
          <span className="ilc-pill ilc-pill-ok">HL {hlCount}</span>
          <time dateTime={clock.toISOString()}>
            {clock.toLocaleTimeString("en-IN", { hour12: false })}
          </time>
        </div>
      </header>

      <nav className="ilc-nav" aria-label="Console jumps">
        <Link className="ilc-nav-btn" to="/tracker">
          Monitor
        </Link>
        <Link className="ilc-nav-btn" to={`/companies/${companyId}`}>
          Evidence
        </Link>
        <button type="button" className="ilc-nav-btn" onClick={() => onJumpTab?.("review")}>
          Review
        </button>
        <button type="button" className="ilc-nav-btn" onClick={() => onJumpTab?.("corpus")}>
          Corpus
        </button>
        <button type="button" className="ilc-nav-btn" onClick={() => onJumpTab?.("pit")}>
          PIT
        </button>
        <Link className="ilc-nav-btn" to="/tracker?tab=sectors">
          Sectors
        </Link>
        <Link className="ilc-nav-btn" to={`/companies/${companyId}`}>
          Dossier
        </Link>
        <Link className="ilc-nav-btn" to="/research">
          Research
        </Link>
      </nav>

      {err && <p className="ilc-error">{err}</p>}
      {loading && <p className="ilc-muted">Loading console panels…</p>}

      <div className="ilc-grid">
        {/* GCI Monitor */}
        <section className="ilc-panel ilc-span-monitor" aria-label="GCI monitor">
          <header className="ilc-panel-h">
            <h3>GCI Monitor</h3>
            <span className="ilc-muted">Sensex · live seed</span>
          </header>
          <div className="ilc-table-wrap">
            <table className="ilc-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>GCI</th>
                  <th>Δ</th>
                  <th>Quality</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 16).map((r) => (
                  <tr
                    key={r.id}
                    className={r.id === companyId ? "is-active" : undefined}
                    onClick={() => onSelectCompany(r.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSelectCompany(r.id);
                    }}
                    tabIndex={0}
                    role="button"
                  >
                    <td>
                      <strong>{r.ticker}</strong>
                      <div className="ilc-sub">{r.sector}</div>
                    </td>
                    <td className={`ilc-num tone-${gciTone(r.gci_score)}`}>
                      {formatScore(r.gci_score)}
                    </td>
                    <td>
                      <ChangeChip value={r.gci_change_pct} horizon={r.gci_change_horizon} />
                    </td>
                    <td>
                      <QualityBadge quality={r.data_quality} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Main GCI chart */}
        <section className="ilc-panel ilc-span-chart" aria-label="GCI trend">
          <header className="ilc-panel-h">
            <div>
              <h3>
                {selected?.ticker || companyId} · Guidance Credibility
              </h3>
              <p className="ilc-sub">
                {selected?.name || detail?.name || "—"} · factual GCI (not price)
              </p>
            </div>
            <div className="ilc-score-block">
              <ScoreReveal score={detail?.gci_score ?? selected?.gci_score} size="md" />
              <ChangeChip
                value={detail?.gci_change_pct ?? selected?.gci_change_pct}
                horizon={detail?.gci_change_horizon ?? selected?.gci_change_horizon}
              />
            </div>
          </header>
          <div className="ilc-chart">
            {chartPts.length >= 2 ? (
              <LineChart
                points={chartPts}
                height={220}
                color="#3dff9a"
                yDomain={[0, 100]}
                ariaLabel="GCI history"
              />
            ) : (
              <p className="ilc-muted">Not enough PIT points — open dossier for evidence.</p>
            )}
          </div>
        </section>

        {/* Outcomes strip */}
        <section className="ilc-panel ilc-span-chain" aria-label="Guidance outcomes">
          <header className="ilc-panel-h">
            <h3>Outcomes</h3>
            <span className="ilc-muted">band vs actual</span>
          </header>
          <div className="ilc-table-wrap">
            <table className="ilc-table ilc-compact">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Metric</th>
                  <th>Label</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {outcomes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="ilc-muted">
                      No outcomes loaded
                    </td>
                  </tr>
                )}
                {outcomes.map((o, i) => (
                  <tr key={`${o.period}-${o.metric}-${i}`}>
                    <td>{o.period}</td>
                    <td className="ilc-mono">{o.metric.replace(/_/g, " ")}</td>
                    <td>
                      <span className={`ilc-tag label-${o.label}`}>{o.label}</span>
                    </td>
                    <td className="ilc-num">{formatScore(o.contribution_score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Alerts feed */}
        <section className="ilc-panel ilc-span-news" aria-label="Alerts">
          <header className="ilc-panel-h">
            <h3>Desk alerts</h3>
            <span className="ilc-muted">misses · drift · docs</span>
          </header>
          <ul className="ilc-feed">
            {alerts.length === 0 && <li className="ilc-muted">No open alerts</li>}
            {alerts.map((a, i) => (
              <li key={`${a.company_id}-${a.kind}-${i}`}>
                <button
                  type="button"
                  className="ilc-feed-row"
                  onClick={() => onSelectCompany(a.company_id)}
                >
                  <span className={severityClass(a.severity)}>{a.severity || a.kind}</span>
                  <span className="ilc-feed-ticker">{a.ticker}</span>
                  <span className="ilc-feed-msg">{a.message}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Peer quick view */}
        <section className="ilc-panel ilc-span-peers" aria-label="Sector peers">
          <header className="ilc-panel-h">
            <h3>Peers · {selected?.sector || "Sector"}</h3>
          </header>
          <div className="ilc-peer-grid">
            {peers.map((p) => (
              <button
                key={p.id}
                type="button"
                className="ilc-peer"
                onClick={() => onSelectCompany(p.id)}
              >
                <strong>{p.ticker}</strong>
                <span className={`ilc-num tone-${gciTone(p.gci_score)}`}>
                  {formatScore(p.gci_score)}
                </span>
                <ChangeChip value={p.gci_change_pct} horizon={p.gci_change_horizon} />
              </button>
            ))}
            {peers.length === 0 && <p className="ilc-muted">No peers in sector</p>}
          </div>
        </section>

        {/* Queue screener */}
        <section className="ilc-panel ilc-span-screen" aria-label="Queues">
          <header className="ilc-panel-h">
            <h3>Queues</h3>
            <button type="button" className="ilc-linkish" onClick={() => onJumpTab?.("review")}>
              Open review →
            </button>
          </header>
          <div className="ilc-queue-cols">
            <div>
              <h4>Extract pending</h4>
              <ul>
                {(pending.length ? pending : []).slice(0, 5).map((b) => (
                  <li key={b.id}>
                    <button type="button" onClick={() => onSelectCompany(b.company_id)}>
                      {b.company_id} · {b.statements?.length || 0} stmts
                    </button>
                  </li>
                ))}
                {!pending.length && <li className="ilc-muted">Clear</li>}
              </ul>
            </div>
            <div>
              <h4>Labeling</h4>
              <ul>
                {labelQ.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => item.company_id && onSelectCompany(item.company_id)}
                    >
                      {item.company_id} · {item.status || "queued"}
                    </button>
                  </li>
                ))}
                {!labelQ.length && <li className="ilc-muted">Empty</li>}
              </ul>
            </div>
          </div>
        </section>

        {/* Sector heatmap */}
        <section className="ilc-panel ilc-span-heat" aria-label="Sector GCI heatmap">
          <header className="ilc-panel-h">
            <h3>Sector GCI map</h3>
            <span className="ilc-muted">avg credibility · box ∝ names</span>
          </header>
          <div className="ilc-heat">
            {sectors.map((s) => {
              const avg = s.avg ?? 50;
              const flex = Math.max(0.6, (s.count || 1) / maxSectorCount);
              const tone = gciTone(avg);
              return (
                <div
                  key={s.sector}
                  className={`ilc-heat-cell tone-${tone}`}
                  style={{ flexGrow: flex, flexBasis: `${flex * 80}px` }}
                  title={`${s.sector}: avg ${formatScore(s.avg)} · n=${s.count}`}
                >
                  <strong>{s.sector}</strong>
                  <span>{formatScore(s.avg)}</span>
                  <em>n={s.count}</em>
                </div>
              );
            })}
            {!sectors.length && <p className="ilc-muted">No sector data</p>}
          </div>
        </section>

        {/* Metric breakdown */}
        <section className="ilc-panel ilc-span-metric" aria-label="Metric GCI">
          <header className="ilc-panel-h">
            <h3>By metric</h3>
            <span className="ilc-muted">{selected?.ticker || companyId}</span>
          </header>
          <ul className="ilc-bars">
            {metricBars.map(({ metric, score }) => (
              <li key={metric}>
                <span className="ilc-bar-label">{metric.replace(/_/g, " ")}</span>
                <span className="ilc-bar-track">
                  <span
                    className={`ilc-bar-fill tone-${gciTone(score)}`}
                    style={{ width: `${Math.max(4, Math.min(100, score))}%` }}
                  />
                </span>
                <span className="ilc-num">{formatScore(score)}</span>
              </li>
            ))}
            {!metricBars.length && <li className="ilc-muted">Select a scored name</li>}
          </ul>
        </section>
      </div>

      <footer className="ilc-status">
        <span>India GCI desk · not a price terminal</span>
        <span>NSE / BSE coverage via Sensex deep GCI</span>
        <span>No Buy / Hold / Sell</span>
        <span>
          Peer rank {detail?.peer_rank_in_sector ?? "—"} · sector avg{" "}
          {formatScore(detail?.sector_avg_gci)}
        </span>
      </footer>
    </div>
  );
}
