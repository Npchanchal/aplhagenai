import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import { useI18n } from "../i18n";
import {
  postPasswordResetConfirm,
  postPasswordResetRequest,
  postVerifyEmailConfirm,
} from "../lib/api";
import { LEGAL_ENTITY } from "../lib/legal";

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await postPasswordResetRequest(email);
      setMsg(
        res.dev_token
          ? t("ui.AuthRecoveryPages.devQueued", { token: res.dev_token })
          : t("ui.AuthRecoveryPages.resetSent"),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("ui.AuthRecoveryPages.requestFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page" data-testid="forgot-password-page">
      <p className="page-kicker">{t("common.account")}</p>
      <h1>{t("ui.AuthRecoveryPages.resetTitle")}</h1>
      <p className="muted lede">
        {t("ui.AuthRecoveryPages.resetLede", { entity: LEGAL_ENTITY })}
      </p>
      <form className="auth-form panel" onSubmit={onSubmit}>
        <label>
          {t("auth.email")}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="forgot-email"
          />
        </label>
        {error && <p className="error">{error}</p>}
        {msg && <p className="muted">{msg}</p>}
        <button type="submit" className="btn-primary" disabled={busy}>
          {t("ui.AuthRecoveryPages.sendLink")}
        </button>
        <p className="muted">
          <Link to="/login">{t("ui.AuthRecoveryPages.backToLogin")}</Link>
        </p>
      </form>
      <Disclaimer />
    </section>
  );
}

export function ResetPasswordPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(params.get("token") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await postPasswordResetConfirm(token, password);
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("ui.AuthRecoveryPages.resetFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page" data-testid="reset-password-page">
      <p className="page-kicker">{t("common.account")}</p>
      <h1>{t("ui.AuthRecoveryPages.newPasswordTitle")}</h1>
      <form className="auth-form panel" onSubmit={onSubmit}>
        <label>
          {t("ui.AuthRecoveryPages.resetToken")}
          <input
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            data-testid="reset-token"
          />
        </label>
        <label>
          {t("ui.AuthRecoveryPages.newPassword")}
          <input
            type="password"
            required
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="reset-password"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={busy}>
          {t("ui.AuthRecoveryPages.updatePassword")}
        </button>
      </form>
      <Disclaimer />
    </section>
  );
}

export function VerifyEmailPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<string>(() => t("ui.AuthRecoveryPages.verifying"));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus(t("ui.AuthRecoveryPages.missingToken"));
      setError(t("ui.AuthRecoveryPages.openLink"));
      return;
    }
    void postVerifyEmailConfirm(token)
      .then(() => setStatus(t("ui.AuthRecoveryPages.verified")))
      .catch((err) => {
        setStatus(t("ui.AuthRecoveryPages.verifyFailed"));
        setError(err instanceof Error ? err.message : t("ui.AuthRecoveryPages.invalidToken"));
      });
  }, [params]);

  return (
    <section className="auth-page" data-testid="verify-email-page">
      <p className="page-kicker">{t("common.account")}</p>
      <h1>{t("ui.AuthRecoveryPages.verifyTitle")}</h1>
      <p className="panel">{status}</p>
      {error && <p className="error">{error}</p>}
      <p className="muted">
        <Link to="/tracker">{t("ui.AuthRecoveryPages.goTracker")}</Link> · <Link to="/login">{t("common.login")}</Link>
      </p>
      <Disclaimer />
    </section>
  );
}
