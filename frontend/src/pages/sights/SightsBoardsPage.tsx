import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WatchlistToggle from "../../components/WatchlistToggle";
import { fetchCompanies, fetchResearchWatchlist, type CompanySummary, type WatchlistItem } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n";

const SAVED_KEY = "citealpha_sights_saved_queries";

export default function SightsBoardsPage() {
  const { t } = useI18n();
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
      <h2>{t("ui.SightsBoardsPage.title")}</h2>
      <p className="muted">{t("ui.SightsBoardsPage.subtitle")}</p>

      <h3>{t("ui.SightsBoardsPage.watchlist")}</h3>
      {(!preferences?.watchlist || preferences.watchlist.length === 0) && (
        <p className="muted">{t("ui.SightsBoardsPage.watchlistEmpty")}</p>
      )}
      <ul className="doc-list">
        {watch.map((w) => (
          <li key={w.company_id}>
            <Link to={`/companies/${w.company_id}`}>{w.ticker}</Link>{" "}
            {t("ui.SightsBoardsPage.gciValue", { score: w.gci_score ?? "n/a" })}
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

      <h3>{t("ui.SightsBoardsPage.savedQueries")}</h3>
      <div className="row gap">
        <input
          className="input"
          value={queryDraft}
          onChange={(e) => setQueryDraft(e.target.value)}
          placeholder={t("ui.SightsBoardsPage.placeholder")}
          aria-label={t("ui.SightsBoardsPage.savedQueryAria")}
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
          {t("ui.SightsBoardsPage.save")}
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
              {t("ui.SightsBoardsPage.remove")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
