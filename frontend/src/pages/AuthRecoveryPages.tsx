import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import {
  postPasswordResetConfirm,
  postPasswordResetRequest,
  postVerifyEmailConfirm,
} from "../lib/api";
import { LEGAL_ENTITY } from "../lib/legal";

export function ForgotPasswordPage() {
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
          ? `Reset email queued (dev token: ${res.dev_token}). Open Reset with token below.`
          : "If that email exists, a reset link was sent.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page" data-testid="forgot-password-page">
      <p className="page-kicker">Account</p>
      <h1>Reset password</h1>
      <p className="muted lede">
        We email a one-time link. Product of {LEGAL_ENTITY}.
      </p>
      <form className="auth-form panel" onSubmit={onSubmit}>
        <label>
          Email
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
          Send reset link
        </button>
        <p className="muted">
          <Link to="/login">Back to login</Link>
        </p>
      </form>
      <Disclaimer />
    </section>
  );
}

export function ResetPasswordPage() {
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
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page" data-testid="reset-password-page">
      <p className="page-kicker">Account</p>
      <h1>Choose a new password</h1>
      <form className="auth-form panel" onSubmit={onSubmit}>
        <label>
          Reset token
          <input
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            data-testid="reset-token"
          />
        </label>
        <label>
          New password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="reset-password"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={busy}>
          Update password
        </button>
      </form>
      <Disclaimer />
    </section>
  );
}

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<string>("Verifying…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("Missing token");
      setError("Open the link from your verification email.");
      return;
    }
    void postVerifyEmailConfirm(token)
      .then(() => setStatus("Email verified. You can continue using CiteAlpha."))
      .catch((err) => {
        setStatus("Verification failed");
        setError(err instanceof Error ? err.message : "Invalid token");
      });
  }, [params]);

  return (
    <section className="auth-page" data-testid="verify-email-page">
      <p className="page-kicker">Account</p>
      <h1>Email verification</h1>
      <p className="panel">{status}</p>
      {error && <p className="error">{error}</p>}
      <p className="muted">
        <Link to="/tracker">Go to Tracker</Link> · <Link to="/login">Log in</Link>
      </p>
      <Disclaimer />
    </section>
  );
}
