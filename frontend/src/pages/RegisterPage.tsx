import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import { useAuth } from "../lib/auth";
import { useI18n } from "../i18n";

export default function RegisterPage() {
  const { register, continueAsGuest } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(email, password, name);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page" data-testid="register-page">
      <p className="page-kicker">{t("common.account")}</p>
      <h1>{t("auth.registerTitle")}</h1>
      <p className="muted lede">
        Create a desk identity to keep language, market, and watchlist. Citeable GCI still
        requires hand-labeled evidence — registration is not an advice entitlement.{" "}
        {t("auth.ssoSoon")}
      </p>
      <form className="auth-form panel" onSubmit={onSubmit}>
        <label>
          {t("auth.name")}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="register-name"
            autoComplete="name"
          />
        </label>
        <label>
          {t("auth.email")}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="register-email"
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
            data-testid="register-password"
            autoComplete="new-password"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button
          type="submit"
          className="btn-primary"
          disabled={busy}
          data-testid="register-submit"
        >
          {t("common.register")}
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={busy}
          onClick={() => {
            void continueAsGuest().then(() => navigate("/"));
          }}
        >
          {t("common.guest")}
        </button>
        <p className="muted">
          {t("auth.hasAccount")}{" "}
          <Link to="/login">{t("common.login")}</Link>
        </p>
      </form>
      <Disclaimer />
    </section>
  );
}
