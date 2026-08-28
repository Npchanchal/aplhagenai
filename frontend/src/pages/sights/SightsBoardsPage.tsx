import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WatchlistToggle from "../../components/WatchlistToggle";
import { fetchCompanies, fetchResearchWatchlist, type CompanySummary, type WatchlistItem } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const SAVED_KEY = "citealpha_sights_saved_queries";

export default function SightsBoardsPage() {
  const { preferences, updatePreferences, token } = useAuth();
  const [watch, setWatch] = useState<WatchlistItem[]>([]);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [queryDraft, setQueryDraft] = useState("");
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [w, cos] = await Promise.all([
        fetchResearchWatchlist({
          companyIds: preferences?.watchlist?.length ? preferences.watchlist : undefined,
          token: token || undefined,
        }),
        fetchCompanies({ limit: 8 }),
      ]);
      if (!cancelled) {
        setWatch(w.items || []);
        setCompanies(cos);
      }
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [preferences?.watchlist, token]);

  function persistSaved(next: string[]) {
    setSaved(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    if (token) {
      void updatePreferences({ saved_queries: next });
    }
  }

  return (
    <section className="sights-panel" data-testid="sights-boards">
      <h2>Sights Boards</h2>
      <p className="muted">Watchlist + saved queries for India equity coverage.</p>

      <h3>Watchlist</h3>
      {(!preferences?.watchlist || preferences.watchlist.length === 0) && (
        <p className="muted">Star names below or on Tracker to build a board.</p>
      )}
      <ul className="doc-list">
        {watch.map((w) => (
          <li key={w.company_id}>
            <Link to={`/companies/${w.company_id}`}>{w.ticker}</Link> — GCI {w.gci_score ?? "n/a"}
          </li>
        ))}
      </ul>
      <div className="row gap wrap">
        {companies.slice(0, 6).map((c) => (
          <span key={c.id} className="row gap">
            {c.ticker}
            <WatchlistToggle companyId={c.id} />
          </span>
        ))}
      </div>

      <h3>Saved queries</h3>
      <div className="row gap">
        <input
          className="input"
          value={queryDraft}
          onChange={(e) => setQueryDraft(e.target.value)}
          placeholder="e.g. capex guidance"
          aria-label="Saved query"
        />
        <button
          type="button"
          className="btn"
          onClick={() => {
            const q = queryDraft.trim();
            if (!q) return;
            persistSaved([...saved.filter((x) => x !== q), q].slice(-20));
            setQueryDraft("");
          }}
        >
          Save
        </button>
      </div>
      <ul>
        {saved.map((q) => (
          <li key={q}>
            <Link to={`/sights/search`}>{q}</Link>{" "}
            <button
              type="button"
              className="btn-text"
              onClick={() => persistSaved(saved.filter((x) => x !== q))}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
