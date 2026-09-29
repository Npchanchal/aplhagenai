import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import TierBadge from "../components/TierBadge";
import { useI18n } from "../i18n";
import { fetchPublicGciRankings, type SnapshotRecordRow } from "../lib/api";
import { formatDossierDate, formatScore, scoreClass } from "../lib/score";

type Rankings = Awaited<ReturnType<typeof fetchPublicGciRankings>>;

function recordsToCsv(rows: SnapshotRecordRow[], asOf: string): string {
  const header = ["ticker", "name", "tier", "met", "exceeded", "missed", "as_of", "gci"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.ticker,
        `"${(r.name || "").replace(/"/g, '""')}"`,
        r.confidence_tier || "",
        r.met,
        r.exceeded,
        r.missed,
        r.as_of || asOf,
        r.gci_score ?? "",
      ].join(","),
    );
  }
  return lines.join("\n");
}

export default function RankingsPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const [data, setData] = useState<Rankings | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicGciRankings({ limit: 30, index: "NIFTY50" })
      .then(setData)
      .catch((e) => setErr((e as Error).message));
  }, []);

  const recordMode = (data?.mode || "record") !== "ranked" || (data?.universe_n ?? 0) < 20;
  const permalinkAsOf = params.get("as_of") || data?.as_of;

  const downloadCsv = () => {
    if (!data?.records?.length) return;
    const blob = new Blob([recordsToCsv(data.records, data.as_of)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gci-snapshot-${data.as_of}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="page" data-testid="gci-rankings-page">
      <header className="page-header">
        <p className="eyebrow">{t("rankings.kicker")}</p>
        <h1>{t("rankings.title")}</h1>
        <p className="lede">{t("rankings.lede")}</p>
      </header>

      {err && <p className="error">{err}</p>}
      {!data && !err && <p className="muted">{t("rankings.loading")}</p>}

      {data && (
        <>
          <p className="muted" style={{ fontSize: 13 }} data-testid="rankings-as-of">
            {t("ui.RankingsPage.asOf", {
              asOf: permalinkAsOf || data.as_of,
              n: data.universe_n,
              methodology: data.methodology,
            })}
          </p>
          {recordMode ? (
            <div className="panel">
              <h2>{t("rankings.recordMode.title")}</h2>
              <p className="muted">{t("rankings.recordMode")}</p>
              <div className="table-scroll">
                <table className="table" data-testid="rankings-record-table">
                  <thead>
                    <tr>
                      <th>{t("ui.RankingsPage.th.name")}</th>
                      <th>{t("common.confidence")}</th>
                      <th>{t("rankings.record.met")}</th>
                      <th>{t("rankings.record.exceeded")}</th>
                      <th>{t("rankings.record.missed")}</th>
                      <th>{t("rankings.record.lastFiling")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.records || []).length === 0 && (
                      <tr>
                        <td colSpan={6} className="muted" data-testid="rankings-empty">
                          {t("rankings.noneRankable")}
                        </td>
                      </tr>
                    )}
                    {(data.records || []).map((r) => (
                      <tr key={r.company_id}>
                        <td>
                          <Link to={`/companies/${r.company_id}`}>
                            <strong>{r.ticker}</strong> {r.name}
                          </Link>
                        </td>
                        <td>
                          <TierBadge
                            tier={r.confidence_tier}
                            testId={`rank-tier-${r.company_id}`}
                          />
                        </td>
                        <td>{r.met}</td>
                        <td>{r.exceeded}</td>
                        <td>{r.missed}</td>
                        <td>{r.as_of ? formatDossierDate(r.as_of) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="queue-ingest-row" style={{ marginTop: 12 }}>
                <button type="button" className="btn" data-testid="rankings-csv" onClick={downloadCsv}>
                  {t("rankings.exportCsv")}
                </button>
                <Link
                  className="btn ghost"
                  to={`/rankings?as_of=${encodeURIComponent(data.as_of)}`}
                >
                  {t("rankings.permalink")}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="panel">
                <h2>{t("rankings.topGci")}</h2>
                <div className="table-scroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t("ui.RankingsPage.th.name")}</th>
                        <th>{t("ui.RankingsPage.th.sector")}</th>
                        <th>GCI</th>
                        <th>{t("common.confidence")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top.map((r) => (
                        <tr key={r.company_id}>
                          <td>{r.rank}</td>
                          <td>
                            <Link to={`/companies/${r.company_id}`}>
                              <strong>{r.ticker}</strong> {r.name}
                            </Link>
                          </td>
                          <td>{r.sector}</td>
                          <td className={scoreClass(r.gci_score)}>{formatScore(r.gci_score)}</td>
                          <td>
                            <TierBadge
                              tier={r.confidence_tier}
                              testId={`rank-tier-${r.company_id}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          <p className="muted" style={{ fontSize: 12 }}>
            {data.legal} · <Link to="/changelog">{t("footer.changelog")}</Link>
          </p>
          <Disclaimer />
        </>
      )}
    </section>
  );
}
