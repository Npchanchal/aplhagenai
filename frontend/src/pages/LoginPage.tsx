import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import { useAuth } from "../lib/auth";
import { useI18n } from "../i18n";

export default function LoginPage() {
  const { login, continueAsGuest } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page" data-testid="login-page">
      <p className="page-kicker">{t("common.account")}</p>
      <h1>{t("auth.loginTitle")}</h1>
      <p className="muted lede">
        Sign in for preferences sync. Guest works for Tracker, Desk Corpus, and Research —
        GCI remains factual delivery research, not advice. {t("auth.ssoSoon")}
      </p>
      <form className="auth-form panel" onSubmit={onSubmit}>
        <label>
          {t("auth.email")}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="login-email"
            autoComplete="email"
          />
        </label>
        <label>
          {t("auth.password")}
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="login-password"
            autoComplete="current-password"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={busy} data-testid="login-submit">
          {t("common.login")}
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={busy}
          onClick={() => {
            void continueAsGuest().then(() => navigate("/"));
          }}
          data-testid="guest-continue"
        >
          {t("common.guest")}
        </button>
        <p className="muted">
          {t("auth.noAccount")}{" "}
          <Link to="/register">{t("common.register")}</Link>
        </p>
      </form>
      <Disclaimer />
    </section>
  );
}
