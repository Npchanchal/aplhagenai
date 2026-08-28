import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import TermsAccept from "../components/TermsAccept";
import { useAuth } from "../lib/auth";
import { useI18n } from "../i18n";
import { LEGAL_ENTITY } from "../lib/legal";

export default function RegisterPage() {
  const { register, continueAsGuest } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"retail" | "b2b">("retail");
  const [orgName, setOrgName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!acceptTerms) {
      setError(t("auth.termsRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register(email, password, name, {
        acceptTerms: true,
        accountType,
        orgName: accountType === "b2b" ? orgName : undefined,
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function onGuest() {
    if (!acceptTerms) {
      setError(t("auth.termsRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await continueAsGuest(true);
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
        Create a retail (B2C) or business (B2B) account. Citeable GCI still requires
        hand-labeled evidence — registration is not an advice entitlement. Product of{" "}
        {LEGAL_ENTITY}. {t("auth.ssoSoon")}
      </p>
      <form className="auth-form panel" onSubmit={onSubmit}>
        <fieldset className="account-type-fieldset">
          <legend>{t("auth.accountType")}</legend>
          <label className="radio-row">
            <input
              type="radio"
              name="account_type"
              checked={accountType === "retail"}
              onChange={() => setAccountType("retail")}
              data-testid="register-type-retail"
            />
            {t("auth.retail")}
          </label>
          <label className="radio-row">
            <input
              type="radio"
              name="account_type"
              checked={accountType === "b2b"}
              onChange={() => setAccountType("b2b")}
              data-testid="register-type-b2b"
            />
            {t("auth.b2b")}
          </label>
        </fieldset>
        {accountType === "b2b" && (
          <label>
            {t("auth.orgName")}
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              data-testid="register-org-name"
              autoComplete="organization"
              placeholder="Desk / firm name"
            />
          </label>
        )}
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
        <TermsAccept checked={acceptTerms} onChange={setAcceptTerms} />
        {error && <p className="error">{error}</p>}
        <button
          type="submit"
          className="btn-primary"
          disabled={busy || !acceptTerms}
          data-testid="register-submit"
        >
          {t("common.register")}
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={busy || !acceptTerms}
          onClick={() => void onGuest()}
          data-testid="register-guest"
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
