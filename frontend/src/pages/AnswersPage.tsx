import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import { SEO_STRUCTURED } from "../lib/seoJsonLd";
import { copyrightLine, LEGAL_ENTITY, PRODUCT_NAME } from "../lib/legal";

/** Voice- and AEO-friendly FAQ hub with answer-first structure. */
export default function AnswersPage() {
  return (
    <section className="page answers-page" data-testid="answers-page">
      <p className="page-kicker">{LEGAL_ENTITY}</p>
      <h1 className="seo-speakable">{PRODUCT_NAME} Answers</h1>
      <p className="muted seo-speakable">
        Short answers about the Guidance Credibility Index (GCI) for Indian equity desks. Factual
        research — not investment advice.
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
          Full GCI definition
        </Link>
        <Link to="/pilot" className="btn">
          Request a pilot
        </Link>
      </div>

      <Disclaimer />
      <p className="muted">{copyrightLine()}</p>
    </section>
  );
}
