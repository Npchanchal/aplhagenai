import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import { copyrightLine, LEGAL_ENTITY, PRODUCT_NAME } from "../lib/legal";
import { showArchitecturePage } from "../lib/siteFlags";

/** Persistent copyright + legal links — Ocotillo Innovation Private Limited. */
export default function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="site-footer" data-testid="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-copy">{copyrightLine()}</p>
        <nav className="site-footer-links" aria-label="Legal">
          <Link to="/terms">{t("footer.terms")}</Link>
          <Link to="/privacy">{t("footer.privacy")}</Link>
          <Link to="/trust">{t("footer.trust")}</Link>
          <Link to="/help">{t("footer.help")}</Link>
          <Link to="/rankings">{t("footer.rankings")}</Link>
          <Link to="/blog">{t("footer.blog")}</Link>
          <Link to="/billing">{t("footer.billing")}</Link>
          <Link to="/package">{t("footer.package")}</Link>
          <Link to="/about">{t("footer.about")}</Link>
          {showArchitecturePage ? (
            <Link to="/about/architecture">{t("footer.architecture")}</Link>
          ) : null}
        </nav>
        <p className="muted site-footer-note">
          {t("footer.note", { product: PRODUCT_NAME, entity: LEGAL_ENTITY })}
        </p>
      </div>
    </footer>
  );
}
