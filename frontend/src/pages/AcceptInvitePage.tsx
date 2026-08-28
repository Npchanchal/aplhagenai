import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import TermsAccept from "../components/TermsAccept";
import { postAcceptInvite } from "../lib/api";
import { useAuth } from "../lib/auth";
import { LEGAL_ENTITY } from "../lib/legal";

export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { adoptToken } = useAuth();
  const [token, setToken] = useState(params.get("token") || "");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!acceptTerms) {
      setError("Accept Terms to join the desk.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await postAcceptInvite({
        token,
        password,
        name,
        accept_terms: true,
      });
      await adoptToken(res.token);
      navigate("/desk");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page" data-testid="accept-invite-page">
      <p className="page-kicker">B2B invite</p>
      <h1>Join your desk</h1>
      <p className="muted lede">
        Accept a seat invite from your organization. Product of {LEGAL_ENTITY}.
      </p>
      <form className="auth-form panel" onSubmit={onSubmit}>
        <label>
          Invite token
          <input
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            data-testid="invite-token"
          />
        </label>
        <label>
          Display name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="invite-password"
          />
        </label>
        <TermsAccept checked={acceptTerms} onChange={setAcceptTerms} id="invite-terms" />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={busy || !acceptTerms}>
          Join desk
        </button>
        <p className="muted">
          <Link to="/login">Already have an account?</Link>
        </p>
      </form>
      <Disclaimer />
    </section>
  );
}
