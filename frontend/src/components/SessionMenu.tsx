import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import LanguageSelect from "./LanguageSelect";
import { useAuth } from "../lib/auth";
import { useI18n } from "../i18n";
import {
  fetchMarketIndexes,
  fetchMarkets,
  type Market,
  type MarketIndex,
} from "../lib/api";
import type { LangCode } from "../i18n/languages";

export default function SessionMenu() {
  const { user, logout, updatePreferences, preferences, continueAsGuest, loading } =
    useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [indexes, setIndexes] = useState<MarketIndex[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const market = preferences?.default_market ?? "IN";
  const index = preferences?.default_index ?? "SENSEX";

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
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (loading) return null;

  const label = user
    ? user.kind === "guest"
      ? t("common.guest").replace("Continue as ", "") || "Guest"
      : user.email ?? user.name
    : t("common.account");

  return (
    <div className="session-menu" ref={ref}>
      <LanguageSelect
        onChange={(code: LangCode) => {
          void updatePreferences({ language: code });
        }}
      />
      <button
        type="button"
        className="session-trigger"
        data-testid="session-menu"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <div className="session-dropdown" role="menu">
          {!user && (
            <>
              <Link to="/login" role="menuitem" onClick={() => setOpen(false)}>
                {t("common.login")}
              </Link>
              <Link to="/register" role="menuitem" onClick={() => setOpen(false)}>
                {t("common.register")}
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  void continueAsGuest().then(() => setOpen(false));
                }}
              >
                {t("common.guest")}
              </button>
            </>
          )}
          {user && (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => setPrefsOpen((v) => !v)}
              >
                {t("common.preferences")}
              </button>
              {prefsOpen && (
                <div className="session-prefs">
                  <label>
                    {t("common.market")}
                    <select
                      value={market}
                      onChange={(e) => {
                        const m = e.target.value;
                        void fetchMarketIndexes(m).then((r) => {
                          setIndexes(r.indexes);
                          const nextIx = r.indexes[0]?.id;
                          void updatePreferences({
                            default_market: m,
                            ...(nextIx ? { default_index: nextIx } : {}),
                          });
                        });
                      }}
                      data-testid="pref-market"
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
                      onChange={(e) =>
                        void updatePreferences({ default_index: e.target.value })
                      }
                      data-testid="pref-index"
                    >
                      {indexes.map((ix) => (
                        <option key={ix.id} value={ix.id}>
                          {ix.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  void logout().then(() => setOpen(false));
                }}
              >
                {t("common.logout")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
