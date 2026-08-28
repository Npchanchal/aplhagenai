import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import Skeleton from "../components/Skeleton";
import { CounselStatusBanner } from "../components/TermsAccept";
import { fetchTrustCenter, type TrustCenterPayload } from "../lib/api";
import { CONTACT_EMAIL, copyrightLine, LEGAL_ENTITY, PRODUCT_NAME } from "../lib/legal";

/** Procurement / security Trust Center — honest status, not marketing. */
export default function TrustPage() {
  const [data, setData] = useState<TrustCenterPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await fetchTrustCenter();
        if (!cancelled) setData(next);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load Trust Center");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const counsel = data?.compliance.counsel_status ?? data?.copyright?.counsel_status;

  return (
    <section className="trust-page" data-testid="trust-page">
      <p className="page-kicker">Trust Center</p>
      <h1>{PRODUCT_NAME} Trust Center</h1>
      <p className="muted lede">
        Security, legal, and citation posture for desks evaluating {PRODUCT_NAME} (
        {LEGAL_ENTITY}). Honest status — not marketing claims.
      </p>
      <CounselStatusBanner status={counsel} />

      {error && <p className="error">{error}</p>}
      {!data && !error && <Skeleton rows={8} label="Loading Trust Center" />}

      {data && (
        <div className="trust-grid">
          <article className="panel">
            <h2 style={{ marginTop: 0 }}>Product &amp; entity</h2>
            <ul className="about-list">
              <li>
                Product: <strong>{data.product}</strong>
              </li>
              <li>Legal entity: {data.legal_entity}</li>
              <li>
                Domain:{" "}
                <a href={`https://${data.domain}`} rel="noreferrer" target="_blank">
                  {data.domain}
                </a>
              </li>
              <li>{data.data.gci}</li>
              <li>Beachhead: {data.data.beachhead}</li>
              <li>
                Invented actuals:{" "}
                {data.data.invent_actuals
                  ? "yes (bug)"
                  : "never — seed/fixtures or labeled evidence only"}
              </li>
              {data.data.quality_badges ? <li>{data.data.quality_badges}</li> : null}
            </ul>
          </article>

          <article className="panel" data-testid="trust-counsel">
            <h2 style={{ marginTop: 0 }}>Counsel &amp; legal</h2>
            <ul className="about-list">
              <li>Counsel status: {counsel ?? "—"}</li>
              <li>
                Terms v{data.compliance.terms_version ?? "—"} · Privacy v
                {data.compliance.privacy_version ?? "—"}
              </li>
              <li>
                Contact:{" "}
                <a href={`mailto:${data.compliance.contact_email || CONTACT_EMAIL}`}>
                  {data.compliance.contact_email || CONTACT_EMAIL}
                </a>
              </li>
            </ul>
            <p>
              <Link to="/terms">Terms of Use</Link>
              {" · "}
              <Link to="/privacy">Privacy Notice</Link>
              {" · "}
              <Link to="/help">Help</Link>
              {" · "}
              <Link to="/about">About</Link>
            </p>
          </article>

          <article className="panel">
            <h2 style={{ marginTop: 0 }}>Data residency</h2>
            {data.residency ? (
              <ul className="about-list">
                <li>
                  Region: <code>{data.residency.region}</code> ({data.residency.provider})
                </li>
              </ul>
            ) : (
              <p className="muted">Residency details unavailable.</p>
            )}
            <p className="muted">{data.residency?.note}</p>
          </article>

          <article className="panel">
            <h2 style={{ marginTop: 0 }}>Tenancy</h2>
            {data.tenancy ? (
              <ul className="about-list">
                <li>{data.tenancy.model}</li>
                <li>Auth: {data.tenancy.auth}</li>
              </ul>
            ) : (
              <p className="muted">org_id isolation for reviews, seats, and API keys.</p>
            )}
          </article>

          <article className="panel">
            <h2 style={{ marginTop: 0 }}>Security</h2>
            <ul className="about-list">
              <li>Force HTTPS: {data.security.force_https ? "on" : "off (env)"}</li>
              <li>HSTS: {data.security.hsts ? "on" : "off (env)"}</li>
              <li>Auth modes: {data.security.auth_modes.join(", ")}</li>
            </ul>
            <p className="muted" style={{ fontSize: 13 }}>
              Response headers include: {data.security.headers.join("; ")}
            </p>
            {data.security.csp ? (
              <p className="muted" style={{ fontSize: 13 }}>
                {data.security.csp}
              </p>
            ) : null}
            {data.security.backups ? (
              <p className="muted" style={{ fontSize: 13 }}>
                {data.security.backups}
              </p>
            ) : null}
          </article>

          <article className="panel">
            <h2 style={{ marginTop: 0 }}>Enterprise SSO</h2>
            <ul className="about-list">
              <li>Enabled: {data.sso.enabled ? "yes" : "no"}</li>
              <li>OIDC configured: {data.sso.configured ? "yes" : "no"}</li>
              <li>Production-ready: {data.sso.production_ready ? "yes" : "not yet"}</li>
            </ul>
            <p className="muted">{data.sso.note}</p>
          </article>

          <article className="panel" data-testid="trust-llm">
            <h2 style={{ marginTop: 0 }}>Optional AI extract</h2>
            <ul className="about-list">
              <li>
                Model configured: {data.llm?.configured ? "yes" : "no (heuristic fallback)"}
              </li>
              <li>
                Extract prefer LLM:{" "}
                {data.feature_flags_public?.INTELLENS_LLM_EXTRACT ? "on" : "off"}
              </li>
              <li>
                API embeddings:{" "}
                {data.feature_flags_public?.INTELLENS_EMBEDDINGS ? "on" : "off"}
              </li>
            </ul>
            <p className="muted" style={{ fontSize: 13 }}>
              {data.llm?.note ??
                "Optional extract model with heuristic fallback. Customer extract text may be sent to a contracted processor when enabled."}
            </p>
          </article>

          <article className="panel" data-testid="trust-labeling">
            <h2 style={{ marginTop: 0 }}>Labeling governance</h2>
            {data.labeling_governance ? (
              <>
                <ul className="about-list">
                  <li>
                    Two-person review:{" "}
                    {data.labeling_governance.two_person_review ? "required" : "not set"}
                  </li>
                  <li>
                    Drafts {data.labeling_governance.drafts ?? 0} · submitted{" "}
                    {data.labeling_governance.submitted ?? 0} · accepted{" "}
                    {data.labeling_governance.accepted ?? 0}
                  </li>
                </ul>
                <p className="muted" style={{ fontSize: 13 }}>
                  {data.labeling_governance.note}
                </p>
                {data.labeling_governance.recent && data.labeling_governance.recent.length > 0 ? (
                  <ul className="about-list">
                    {data.labeling_governance.recent.slice(0, 8).map((row) => (
                      <li key={row.id || `${row.company_id}-${row.updated_at}`}>
                        {row.company_id} {row.period} {row.metric} — {row.status}
                        {row.submitter_id ? ` · submitter ${row.submitter_id}` : ""}
                        {row.reviewer_id ? ` · reviewer ${row.reviewer_id}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="muted">Two-person accept is required before hand_labeled promotion.</p>
            )}
          </article>

          <article className="panel">
            <h2 style={{ marginTop: 0 }}>Citations</h2>
            <p>{data.citations.model}</p>
            <p className="muted">{data.citations.research_chat}</p>
            <ul className="about-list">
              {data.citations.endpoints.map((ep) => (
                <li key={ep}>
                  <code>{ep}</code>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <h2 style={{ marginTop: 0 }}>Compliance</h2>
            <p>{data.compliance.posture}</p>
            <p className="muted">{data.compliance.sebi}</p>
            <p>
              <Link to="/package">Package</Link>
            </p>
          </article>

          <article className="panel" data-testid="trust-subprocessors">
            <h2 style={{ marginTop: 0 }}>Subprocessors</h2>
            {data.subprocessors && data.subprocessors.length > 0 ? (
              <ul className="about-list">
                {data.subprocessors.map((p) => (
                  <li key={p.name}>
                    {p.name} — {p.role}
                    {p.optional ? " (optional)" : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Hosting plus optional email, SSO, LLM, and analytics.</p>
            )}
          </article>

          <article className="panel">
            <h2 style={{ marginTop: 0 }}>Incident &amp; DPA</h2>
            <p>
              Contact{" "}
              <a href={`mailto:${data.incident?.contact || CONTACT_EMAIL}`}>
                {data.incident?.contact || CONTACT_EMAIL}
              </a>
              .
            </p>
            <p className="muted">{data.incident?.note}</p>
          </article>
        </div>
      )}

      <Disclaimer />
      <p className="muted">{copyrightLine()}</p>
    </section>
  );
}
