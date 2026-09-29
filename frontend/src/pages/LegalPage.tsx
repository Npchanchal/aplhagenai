import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import { useI18n } from "../i18n";
import Skeleton from "../components/Skeleton";
import { CounselStatusBanner } from "../components/TermsAccept";
import { fetchLegalPrivacy, fetchLegalTerms, type LegalDocument } from "../lib/api";
import { CONTACT_EMAIL, LEGAL_ENTITY, PRODUCT_NAME } from "../lib/legal";

export default function LegalPage() {
  const { t } = useI18n();
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
          setError(err instanceof Error ? err.message : t("ui.LegalPage.loadError"));
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
      <p className="page-kicker">{t("ui.LegalPage.kicker")}</p>
      <h1>{doc?.title ?? (kind === "privacy" ? t("footer.privacy") : t("footer.terms"))}</h1>
      <p className="muted lede">
        {t("ui.LegalPage.productOf", { product: PRODUCT_NAME })} <strong>{LEGAL_ENTITY}</strong>
        {t("ui.LegalPage.meta", { version: doc?.version ?? "…", date: doc?.effective_date ?? "…" })}{" "}
        <a href={`mailto:${contact}`}>{contact}</a>.
      </p>
      <CounselStatusBanner status={doc?.counsel_status} />
      {error && <p className="error">{error}</p>}
      {!doc && !error && <Skeleton rows={8} label={t("ui.LegalPage.loading")} />}
      {doc && (
        <>
          <nav className="about-toc legal-toc" aria-label={t("ui.LegalPage.toc")}>
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
            {t("ui.LegalPage.seeAlso")} <Link to="/terms">{t("footer.terms")}</Link>
          </>
        ) : (
          <>
            {t("ui.LegalPage.seeAlso")} <Link to="/privacy">{t("footer.privacy")}</Link>
          </>
        )}
        {" · "}
        <Link to="/trust">{t("footer.trust")}</Link>
        {" · "}
        <Link to="/help">{t("footer.help")}</Link>.
      </p>
      <Disclaimer />
    </section>
  );
}
