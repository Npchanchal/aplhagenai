import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import Skeleton from "../components/Skeleton";
import { CounselStatusBanner } from "../components/TermsAccept";
import { fetchLegalPrivacy, fetchLegalTerms, type LegalDocument } from "../lib/api";
import { CONTACT_EMAIL, LEGAL_ENTITY, PRODUCT_NAME } from "../lib/legal";

export default function LegalPage() {
  const location = useLocation();
  const kind = location.pathname.includes("privacy") ? "privacy" : "terms";
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = kind === "privacy" ? await fetchLegalPrivacy() : await fetchLegalTerms();
        if (!cancelled) setDoc(next);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load legal document");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const contact = doc?.contact_email || CONTACT_EMAIL;

  return (
    <section className="legal-page" data-testid={`legal-${kind}-page`}>
      <p className="page-kicker">Legal</p>
      <h1>{doc?.title ?? (kind === "privacy" ? "Privacy Notice" : "Terms of Use")}</h1>
      <p className="muted lede">
        {PRODUCT_NAME} is a product of <strong>{LEGAL_ENTITY}</strong>. Version{" "}
        {doc?.version ?? "…"}. Effective {doc?.effective_date ?? "…"}. Contact{" "}
        <a href={`mailto:${contact}`}>{contact}</a>.
      </p>
      <CounselStatusBanner status={doc?.counsel_status} />
      {error && <p className="error">{error}</p>}
      {!doc && !error && <Skeleton rows={8} label="Loading legal document" />}
      {doc && (
        <>
          <nav className="about-toc legal-toc" aria-label="On this page">
            {doc.sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                {s.heading}
              </a>
            ))}
          </nav>
          <div className="panel legal-body">
            {doc.sections.map((s) => (
              <article key={s.id} id={s.id} className="legal-section">
                <h2>{s.heading}</h2>
                <p>{s.body}</p>
              </article>
            ))}
            <p className="muted legal-copyright">{doc.copyright}</p>
          </div>
        </>
      )}
      <p className="muted">
        {kind === "privacy" ? (
          <>
            See also <Link to="/terms">Terms of Use</Link>
          </>
        ) : (
          <>
            See also <Link to="/privacy">Privacy Notice</Link>
          </>
        )}
        {" · "}
        <Link to="/trust">Trust Center</Link>
        {" · "}
        <Link to="/help">Help</Link>.
      </p>
      <Disclaimer />
    </section>
  );
}
