import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import { CONTACT_EMAIL, copyrightLine, LEGAL_ENTITY, PRODUCT_NAME } from "../lib/legal";

/** Public press / brand page for ORM and media citations. */
export default function PressPage() {
  return (
    <section className="page press-page" data-testid="press-page">
      <p className="page-kicker">{LEGAL_ENTITY}</p>
      <h1>Press &amp; brand — {PRODUCT_NAME}</h1>
      <p className="muted">
        Media boilerplate and canonical links for journalists, analysts, and answer engines citing{" "}
        {PRODUCT_NAME}.
      </p>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Boilerplate</h2>
        <p className="seo-speakable">
          {PRODUCT_NAME} is a product of {LEGAL_ENTITY}. It publishes the Guidance Credibility Index
          (GCI) — an evidence-linked score of whether Indian listed management delivered on quantified
          guidance versus subsequent actuals, with primary sources attached. Factual research
          infrastructure for equity desks; not investment advice.
        </p>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Canonical links</h2>
        <ul>
          <li>
            <Link to="/blog/what-is-guidance-credibility-index">GCI definition (canonical)</Link>
          </li>
          <li>
            <Link to="/trust">Trust Center</Link>
          </li>
          <li>
            <Link to="/answers">FAQ answers</Link>
          </li>
          <li>
            <a href="/llms.txt">llms.txt</a> · <a href="/ai.txt">AI use policy</a>
          </li>
        </ul>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Contact</h2>
        <p>
          Media and partnership inquiries:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </div>

      <Disclaimer />
      <p className="muted">{copyrightLine()}</p>
    </section>
  );
}
