import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LanguageSelect from "../components/LanguageSelect";
import {
  fetchCompanies,
  fetchMarkets,
  fetchMarketIndexes,
  type CompanySummary,
  type Market,
  type MarketIndex,
} from "../lib/api";
import { analyticsConfigured, writeAnalyticsConsent, initAnalytics } from "../lib/analytics";
import { useAuth } from "../lib/auth";
import { useI18n } from "../i18n";
import type { LangCode } from "../i18n/languages";

/** Unified account + preferences — syncs via `/api/auth/preferences`. */
export default function AccountSettingsPage() {
  const { t } = useI18n();
  const { user, preferences, updatePreferences, loading } = useAuth();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [indexes, setIndexes] = useState<MarketIndex[]>([]);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [addId, setAddId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const market = preferences?.default_market ?? "IN";
  const index = preferences?.default_index ?? "SENSEX";
  const watchlist = preferences?.watchlist ?? [];
  const density = preferences?.density ?? "comfortable";
  const showDemoTape = preferences?.show_demo_tape ?? true;
  const analyticsConsent = preferences?.analytics_consent;

  useEffect(() => {
    fetchMarkets()
      .then((r) => setMarkets(r.markets))
      .catch(() => setMarkets([]));
  }, []);

  useEffect(() => {
    fetchMarketIndexes(market)
      .then((r) => setIndexes(r.indexes))
      .catch(() => setIndexes([]));
  }, [market]);

  useEffect(() => {
    fetchCompanies({ market, index, limit: 500 })
      .then(setCompanies)
      .catch(() => setCompanies([]));
  }, [market, index]);

  const companyById = useMemo(() => {
    const map = new Map<string, CompanySummary>();
    for (const c of companies) map.set(c.id, c);
    return map;
  }, [companies]);

  const addCandidates = companies.filter((c) => !watchlist.includes(c.id));

  async function patch(p: Parameters<typeof updatePreferences>[0]) {
    setMsg(null);
    try {
      await updatePreferences(p);
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function setAnalytics(granted: boolean) {
    writeAnalyticsConsent(granted);
    if (granted && analyticsConfigured()) initAnalytics();
    await patch({ analytics_consent: granted });
  }

  if (loading) {
    return (
      <section className="settings-page" data-testid="account-settings-page">
        <p className="muted">{t("common.loading")}</p>
      </section>
    );
  }

  return (
    <section className="settings-page" data-testid="account-settings-page">
      <p className="page-kicker">{t("common.account")}</p>
      <h1>{t("prefs.title")}</h1>
      <p className="muted lede">
        Language, default universe, watchlist, and display options sync when you are signed in.
        Guests keep prefs in this browser only.
      </p>

      <div className="settings-grid">
        <div className="panel settings-panel">
          <h2 style={{ marginTop: 0 }}>Profile</h2>
          {!user ? (
            <p className="muted">
              <Link to="/login" state={{ from: "/account" }}>
                Log in
              </Link>{" "}
              or{" "}
              <Link to="/register">register</Link> to sync preferences across devices.
            </p>
          ) : (
            <dl className="settings-dl">
              <div>
                <dt>Name</dt>
                <dd>{user.name || "—"}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{user.email || "—"}</dd>
              </div>
              <div>
                <dt>Account</dt>
                <dd>
                  {user.kind === "guest" ? "Guest" : user.account_type ?? "registered"} · role{" "}
                  <code>{user.role ?? "—"}</code>
                </dd>
              </div>
              {user.org_id && (
                <div>
                  <dt>Organization</dt>
                  <dd>
                    <code>{user.org_id}</code>{" "}
                    {(user.role === "owner" || user.role === "admin") && (
                      <Link to="/org/settings">Org settings →</Link>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          )}
          {user && user.kind !== "guest" && (
            <p style={{ marginTop: 12 }}>
              <Link to="/billing" className="btn">
                Billing
              </Link>
            </p>
          )}
        </div>

        <div className="panel settings-panel">
          <h2 style={{ marginTop: 0 }}>Locale &amp; universe</h2>
          <div className="auth-form settings-form">
            <label>
              {t("common.language")}
              <LanguageSelect
                onChange={(code: LangCode) => {
                  void patch({ language: code });
                }}
              />
            </label>
            <label>
              {t("common.market")}
              <select
                value={market}
                onChange={(e) => {
                  const m = e.target.value;
                  void fetchMarketIndexes(m).then((r) => {
                    setIndexes(r.indexes);
                    const nextIx = r.indexes[0]?.id;
                    void patch({
                      default_market: m,
                      ...(nextIx ? { default_index: nextIx } : {}),
                    });
                  });
                }}
                data-testid="account-pref-market"
              >
                {markets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("common.index")}
              <select
                value={index}
                onChange={(e) => void patch({ default_index: e.target.value })}
                data-testid="account-pref-index"
              >
                {indexes.map((ix) => (
                  <option key={ix.id} value={ix.id}>
                    {ix.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="panel settings-panel">
          <h2 style={{ marginTop: 0 }}>Display</h2>
          <div className="auth-form settings-form">
            <label>
              {t("prefs.density")}
              <select
                value={density}
                onChange={(e) =>
                  void patch({ density: e.target.value as "comfortable" | "compact" })
                }
                data-testid="account-pref-density"
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </label>
            <label className="settings-check">
              <input
                type="checkbox"
                checked={showDemoTape}
                onChange={(e) => void patch({ show_demo_tape: e.target.checked })}
                data-testid="account-pref-demo-tape"
              />
              {t("prefs.demoTape")}
            </label>
          </div>
        </div>

        <div className="panel settings-panel">
          <h2 style={{ marginTop: 0 }}>Watchlist</h2>
          <p className="muted" style={{ fontSize: 13 }}>
            Used on Research and Sights boards. Add names from your default index.
          </p>
          {watchlist.length === 0 ? (
            <p className="muted">No companies on your watchlist yet.</p>
          ) : (
            <ul className="settings-watchlist" data-testid="account-watchlist">
              {watchlist.map((id) => {
                const c = companyById.get(id);
                return (
                  <li key={id}>
                    <span>
                      {c ? `${c.ticker} — ${c.name}` : id}
                    </span>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() =>
                        void patch({ watchlist: watchlist.filter((x) => x !== id) })
                      }
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {addCandidates.length > 0 && (
            <div className="settings-add-row">
              <select
                value={addId || addCandidates[0]?.id || ""}
                onChange={(e) => setAddId(e.target.value)}
                aria-label="Add company to watchlist"
              >
                {addCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ticker} — {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn"
                data-testid="account-watchlist-add"
                onClick={() => {
                  const id = addId || addCandidates[0]?.id;
                  if (!id || watchlist.includes(id)) return;
                  void patch({ watchlist: [...watchlist, id] });
                  setAddId("");
                }}
              >
                Add
              </button>
            </div>
          )}
          {watchlist.length > 0 && (
            <button
              type="button"
              className="btn-ghost"
              style={{ marginTop: 8 }}
              onClick={() => void patch({ watchlist: [] })}
            >
              Clear watchlist
            </button>
          )}
        </div>

        {analyticsConfigured() && (
          <div className="panel settings-panel">
            <h2 style={{ marginTop: 0 }}>Analytics</h2>
            <p className="muted" style={{ fontSize: 13 }}>
              Optional funnel analytics (GA4 / Plausible). No evidence quotes or emails are sent.
            </p>
            <p>
              Current:{" "}
              <strong>
                {analyticsConsent === true
                  ? "Accepted"
                  : analyticsConsent === false
                    ? "Declined"
                    : "Not set"}
              </strong>
            </p>
            <div className="row gap">
              <button type="button" className="btn-primary" onClick={() => void setAnalytics(true)}>
                Accept analytics
              </button>
              <button type="button" className="btn-ghost" onClick={() => void setAnalytics(false)}>
                Decline
              </button>
            </div>
          </div>
        )}
      </div>

      {msg && (
        <p className="muted" style={{ marginTop: 16 }} data-testid="account-settings-msg">
          {msg}
        </p>
      )}
    </section>
  );
}
