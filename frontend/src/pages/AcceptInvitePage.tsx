import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import { useI18n } from "../i18n";
import TermsAccept from "../components/TermsAccept";
import { postAcceptInvite } from "../lib/api";
import { useAuth } from "../lib/auth";
import { LEGAL_ENTITY } from "../lib/legal";

export default function AcceptInvitePage() {
  const { t } = useI18n();
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
      setError(t("ui.AcceptInvitePage.acceptTerms"));
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
      setError(err instanceof Error ? err.message : t("ui.AcceptInvitePage.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page" data-testid="accept-invite-page">
      <p className="page-kicker">{t("ui.AcceptInvitePage.kicker")}</p>
      <h1>{t("ui.AcceptInvitePage.title")}</h1>
      <p className="muted lede">
        {t("ui.AcceptInvitePage.lede", { entity: LEGAL_ENTITY })}
      </p>
      <form className="auth-form panel" onSubmit={onSubmit}>
        <label>
          {t("ui.AcceptInvitePage.token")}
          <input
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            data-testid="invite-token"
          />
        </label>
        <label>
          {t("auth.name")}
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          {t("auth.password")}
          <input
            type="password"
            required
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="invite-password"
          />
        </label>
        <TermsAccept checked={acceptTerms} onChange={setAcceptTerms} id="invite-terms" />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={busy || !acceptTerms}>
          {t("ui.AcceptInvitePage.submit")}
        </button>
        <p className="muted">
          <Link to="/login">{t("ui.AcceptInvitePage.haveAccount")}</Link>
        </p>
      </form>
      <Disclaimer />
    </section>
  );
}
