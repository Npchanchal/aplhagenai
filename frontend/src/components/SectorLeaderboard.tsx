import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import InfoTip from "./InfoTip";
import {
  fetchSectorBenchmark,
  fetchSectorLeaderboard,
  type CompanySummary,
} from "../lib/api";
import { formatScore, scoreClass } from "../lib/score";

type SectorRow = {
  sector: string;
  avg: number | null;
  count: number;
  best: {
    id: string;
    ticker: string;
    name: string;
    gci_score: number | null;
  } | null;
};

type Props = {
  market?: string;
  index?: string;
  limit?: number;
  compact?: boolean;
};

/** Sector credibility leaderboard — shared across Tracker / Desk / Research. */
export default function SectorLeaderboard({
  market = "IN",
  index = "SENSEX",
  limit = 40,
  compact = false,
}: Props) {
  const [rows, setRows] = useState<SectorRow[]>([]);
  const [openSector, setOpenSector] = useState<string | null>(null);
  const [peers, setPeers] = useState<CompanySummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSectorLeaderboard({ market, index, limit })
      .then((r) => {
        if (!cancelled) {
          setRows((r.sectors || []) as SectorRow[]);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [market, index, limit]);

  function toggleSector(sector: string) {
    if (openSector === sector) {
      setOpenSector(null);
      setPeers([]);
      return;
    }
    setOpenSector(sector);
    setPeers([]);
    fetchSectorBenchmark(sector)
      .then((b) => setPeers(b.companies || []))
      .catch(() => setPeers([]));
  }

  if (error) {
    return (
      <div className="panel" data-testid="sector-leaderboard">
        <p className="muted">Leaderboard unavailable: {error}</p>
      </div>
    );
  }
  if (!rows.length) return null;

  return (
    <div className="panel" data-testid="sector-leaderboard">
      <div className="panel-head">
        <h2>
          Sector credibility leaderboard <InfoTip termId="sector_avg" />
        </h2>
        {!compact && (
          <span className="muted" style={{ fontSize: 13 }}>
            which sectors keep their word
          </span>
        )}
      </div>
      {!compact && (
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          Sectors ranked by average GCI across the selected India cohort — delivery
          screen, not sentiment.
        </p>
      )}
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Sector</th>
              <th>Avg GCI</th>
              <th>Names</th>
              <th>Most credible</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => (
              <tr
                key={s.sector}
                className="row-link"
                onClick={() => toggleSector(s.sector)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleSector(s.sector);
                  }
                }}
                tabIndex={0}
                style={{ cursor: "pointer" }}
                data-testid={`sector-row-${s.sector}`}
              >
                <td>{i + 1}</td>
                <td>
                  <strong>{s.sector}</strong>{" "}
                  <span className="muted" style={{ fontSize: 12 }}>
                    {openSector === s.sector ? "▾" : "▸"}
                  </span>
                </td>
                <td className={`score ${scoreClass(s.avg)}`}>{formatScore(s.avg)}</td>
                <td>{s.count}</td>
                <td>
                  {s.best ? (
                    <>
                      <Link to={`/companies/${s.best.id}`} onClick={(e) => e.stopPropagation()}>
                        {s.best.ticker}
                      </Link>{" "}
                      <span className={`score ${scoreClass(s.best.gci_score)}`}>
                        {formatScore(s.best.gci_score)}
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {openSector && (
        <div className="sector-peers" data-testid="sector-peers">
          <h3 style={{ fontSize: 14 }}>{openSector} — peer ranking</h3>
          <ul className="peer-list">
            {peers.slice(0, compact ? 8 : 15).map((c) => (
              <li key={c.id}>
                <Link to={`/companies/${c.id}`}>
                  {c.ticker} · {c.name}
                </Link>{" "}
                <span className={`score ${scoreClass(c.gci_score)}`}>
                  {formatScore(c.gci_score)}
                </span>
              </li>
            ))}
            {peers.length === 0 && <li className="muted">Loading peers…</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
