import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import { useI18n } from "../i18n";
import { SEO_STRUCTURED } from "../lib/seoJsonLd";
import { copyrightLine, LEGAL_ENTITY, PRODUCT_NAME } from "../lib/legal";

/** Voice- and AEO-friendly FAQ hub with answer-first structure. */
export default function AnswersPage() {
  const { t } = useI18n();
  return (
    <section className="page answers-page" data-testid="answers-page">
      <p className="page-kicker">{LEGAL_ENTITY}</p>
      <h1 className="seo-speakable">{t("ui.AnswersPage.title", { product: PRODUCT_NAME })}</h1>
      <p className="muted seo-speakable">
        {t("ui.AnswersPage.lede")}
      </p>

      <dl className="glossary landing-faq">
        {SEO_STRUCTURED.faq.map((item) => (
          <div className="glossary-row" key={item.question}>
            <dt>{item.question}</dt>
            <dd className="seo-speakable">{item.answer}</dd>
          </div>
        ))}
      </dl>

      <div className="landing-cta">
        <Link to="/blog/what-is-guidance-credibility-index" className="btn primary">
          {t("ui.AnswersPage.fullDefinition")}
        </Link>
        <Link to="/pilot" className="btn">
          {t("footer.pilot")}
        </Link>
      </div>

      <Disclaimer />
      <p className="muted">{copyrightLine()}</p>
    </section>
  );
}
