import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import { fetchPublicGciRankings } from "../lib/api";
import { formatScore, scoreClass } from "../lib/score";

type Rankings = Awaited<ReturnType<typeof fetchPublicGciRankings>>;

export default function RankingsPage() {
  const [data, setData] = useState<Rankings | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [md, setMd] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicGciRankings({ limit: 10 })
      .then(setData)
      .catch((e) => setErr((e as Error).message));
  }, []);

  return (
    <section className="page" data-testid="gci-rankings-page">
      <header className="page-header">
        <p className="eyebrow">Public · citeable only</p>
        <h1>Guidance Credibility Quarterly</h1>
        <p className="lede">
          Top and bottom management delivery scores on Sensex hand-labeled / citeable
          GCI — content for desks, not a Buy/Hold list.
        </p>
      </header>

      {err && <p className="error">{err}</p>}
      {!data && !err && <p className="muted">Loading rankings…</p>}

      {data && (
        <>
          <p className="muted" style={{ fontSize: 13 }}>
            As of {data.as_of} · n={data.universe_n} citeable · {data.methodology}
          </p>
          <div className="workbench">
            <div className="workbench-main">
              <div className="panel">
                <h2>Top GCI</h2>
                <div className="table-scroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Sector</th>
                        <th>GCI</th>
                        <th>Citeable</th>
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
                          <td className={scoreClass(r.gci_score)}>
                            {formatScore(r.gci_score)}
                          </td>
                          <td>{r.citeable_outcomes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="panel">
                <h2>Lowest GCI (same universe)</h2>
                <div className="table-scroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Sector</th>
                        <th>GCI</th>
                        <th>Citeable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.bottom.map((r) => (
                        <tr key={`b-${r.company_id}`}>
                          <td>{r.rank}</td>
                          <td>
                            <Link to={`/companies/${r.company_id}`}>
                              <strong>{r.ticker}</strong> {r.name}
                            </Link>
                          </td>
                          <td>{r.sector}</td>
                          <td className={scoreClass(r.gci_score)}>
                            {formatScore(r.gci_score)}
                          </td>
                          <td>{r.citeable_outcomes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="queue-ingest-row">
                <button
                  type="button"
                  className="btn"
                  onClick={async () => {
                    const pack = await fetchPublicGciRankings({
                      limit: 10,
                      format: "markdown",
                    });
                    setMd(pack.markdown || "");
                  }}
                >
                  Export Markdown
                </button>
                <Link className="btn ghost" to="/package">
                  Pilot / Desk packaging
                </Link>
              </div>
              {md && (
                <pre
                  className="api-out"
                  style={{ whiteSpace: "pre-wrap", maxHeight: 360, overflow: "auto" }}
                >
                  {md}
                </pre>
              )}
              <Disclaimer />
            </div>
          </div>
          <p className="muted" style={{ fontSize: 12 }}>
            {data.legal}
          </p>
        </>
      )}
    </section>
  );
}
