import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import { useI18n } from "../i18n";
import { CONTACT_EMAIL, copyrightLine, LEGAL_ENTITY, PRODUCT_NAME } from "../lib/legal";

/** Public press / brand page for ORM and media citations. */
export default function PressPage() {
  const { t } = useI18n();
  return (
    <section className="page press-page" data-testid="press-page">
      <p className="page-kicker">{LEGAL_ENTITY}</p>
      <h1>{t("ui.PressPage.title", { product: PRODUCT_NAME })}</h1>
      <p className="muted">
        {t("ui.PressPage.lede", { product: PRODUCT_NAME })}
      </p>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>{t("ui.PressPage.boilerplateTitle")}</h2>
        <p className="seo-speakable">
          {t("ui.PressPage.boilerplate", { product: PRODUCT_NAME, entity: LEGAL_ENTITY })}
        </p>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>{t("ui.PressPage.linksTitle")}</h2>
        <ul>
          <li>
            <Link to="/blog/what-is-guidance-credibility-index">{t("ui.PressPage.gciDefinition")}</Link>
          </li>
          <li>
            <Link to="/trust">{t("footer.trust")}</Link>
          </li>
          <li>
            <Link to="/answers">{t("ui.PressPage.faq")}</Link>
          </li>
          <li>
            <a href="/llms.txt">llms.txt</a> · <a href="/ai.txt">{t("ui.PressPage.aiPolicy")}</a>
          </li>
        </ul>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>{t("ui.PressPage.contactTitle")}</h2>
        <p>
          {t("ui.PressPage.inquiries")}{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </div>

      <Disclaimer />
      <p className="muted">{copyrightLine()}</p>
    </section>
  );
}
