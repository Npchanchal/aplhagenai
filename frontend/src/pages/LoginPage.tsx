import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import TermsAccept from "../components/TermsAccept";
import AbuseChallengeField from "../components/AbuseChallengeField";
import { useAuth } from "../lib/auth";
import { fetchSsoLogin, fetchSsoStatus } from "../lib/api";
import { useAbuseChallenge } from "../lib/useAbuseChallenge";
import { useI18n } from "../i18n";
import { LEGAL_ENTITY } from "../lib/legal";

export default function LoginPage() {
  const { login, continueAsGuest } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as { from?: string } | null)?.from?.startsWith("/") === true
      ? (location.state as { from: string }).from
      : "/tracker";
  const abuse = useAbuseChallenge();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ssoHint, setSsoHint] = useState<string | null>(null);
  const [ssoReady, setSsoReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const st = await fetchSsoStatus();
        if (cancelled) return;
        if (st.ready) {
          setSsoReady(true);
          setSsoHint(null);
        } else if (st.enabled && !st.configured) {
          setSsoHint(t("auth.ssoConfig"));
        } else {
          setSsoHint(null);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      navigate(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function onSso() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchSsoLogin();
      if (res.authorize_url) {
        window.location.assign(res.authorize_url);
        return;
      }
      setError(res.message || t("auth.ssoConfig"));
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
    if (!abuse.ready || !abuse.answer.trim()) {
      setError("Complete the verification check to continue as guest.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await continueAsGuest(true, {
        challengeId: abuse.challengeId,
        challengeAnswer: abuse.answer,
      });
      navigate(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
      void abuse.refresh();
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
        GCI remains factual delivery research, not advice.{" "}
        <span className="legal-entity">© {LEGAL_ENTITY}.</span>
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
        <p className="muted">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
        <button
          type="button"
          className="btn-ghost"
          disabled={busy || !ssoReady}
          onClick={() => void onSso()}
          data-testid="sso-continue"
        >
          {t("auth.ssoLogin")}
        </button>
        {ssoHint && <p className="muted">{ssoHint}</p>}
        <TermsAccept
          checked={acceptTerms}
          onChange={setAcceptTerms}
          id="guest-accept-terms"
        />
        <AbuseChallengeField
          prompt={abuse.prompt}
          answer={abuse.answer}
          onAnswerChange={abuse.setAnswer}
          loadError={abuse.loadError}
          id="guest-abuse-challenge"
          testId="guest-abuse-challenge"
          required={false}
        />
        <button
          type="button"
          className="btn-ghost"
          disabled={busy || !acceptTerms || !abuse.ready || !abuse.answer.trim()}
          onClick={() => void onGuest()}
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
