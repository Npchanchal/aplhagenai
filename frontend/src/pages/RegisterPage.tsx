import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import TermsAccept from "../components/TermsAccept";
import AbuseChallengeField from "../components/AbuseChallengeField";
import { useAuth } from "../lib/auth";
import { useAbuseChallenge } from "../lib/useAbuseChallenge";
import { useI18n } from "../i18n";
import { LEGAL_ENTITY } from "../lib/legal";

export default function RegisterPage() {
  const { register, continueAsGuest } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const abuse = useAbuseChallenge();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!acceptTerms) {
      setError(t("auth.termsRequired"));
      return;
    }
    if (!abuse.ready || !abuse.answer.trim()) {
      setError(t("ui.RegisterPage.challenge"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register(email, password, name, {
        acceptTerms: true,
        accountType: "b2b",
        orgName,
        challengeId: abuse.challengeId,
        challengeAnswer: abuse.answer,
      });
      navigate("/tracker");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
      void abuse.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onGuest() {
    if (!acceptTerms) {
      setError(t("auth.termsRequired"));
      return;
    }
    if (!abuse.ready || !abuse.answer.trim()) {
      setError(t("ui.LoginPage.guestChallenge"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await continueAsGuest(true, {
        challengeId: abuse.challengeId,
        challengeAnswer: abuse.answer,
      });
      navigate("/tracker");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
      void abuse.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page" data-testid="register-page">
      <p className="page-kicker">{t("common.account")}</p>
      <h1>{t("auth.registerTitle")}</h1>
      <p className="muted lede">
        {t("ui.RegisterPage.lede", { entity: LEGAL_ENTITY })} {t("auth.ssoSoon")}
      </p>
      <p className="muted">
        <Link to="/pilot">{t("footer.pilot")}</Link>
      </p>
      <form className="auth-form panel" onSubmit={onSubmit}>
        <label>
          {t("auth.orgName")}
          <input
            type="text"
            required
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            data-testid="register-org-name"
            autoComplete="organization"
            placeholder={t("ui.RegisterPage.orgPlaceholder")}
          />
        </label>
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
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="register-password"
            autoComplete="new-password"
          />
        </label>
        <TermsAccept checked={acceptTerms} onChange={setAcceptTerms} />
        <AbuseChallengeField
          prompt={abuse.prompt}
          answer={abuse.answer}
          onAnswerChange={abuse.setAnswer}
          loadError={abuse.loadError}
          id="register-abuse-challenge"
          testId="register-abuse-challenge"
        />
        {error && <p className="error">{error}</p>}
        <button
          type="submit"
          className="btn-primary"
          disabled={busy || !acceptTerms || !abuse.ready || !abuse.answer.trim()}
          data-testid="register-submit"
        >
          {t("common.register")}
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={busy || !acceptTerms || !abuse.ready || !abuse.answer.trim()}
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
