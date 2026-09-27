import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import InfoTip from "../components/InfoTip";
import LandingProofPanel from "../components/LandingProofPanel";
import LandingWorkedExample, { EXAMPLE_COMPANY_ID } from "../components/LandingWorkedExample";
import PilotRequestForm from "../components/PilotRequestForm";
import { useI18n } from "../i18n";
import { trackEvent } from "../lib/analytics";
import { fetchProductMeta, type ProductMeta } from "../lib/api";
import { useAuth } from "../lib/auth";
import { copyrightLine, LEGAL_ENTITY, PRODUCT_NAME } from "../lib/legal";
import { SEO_STRUCTURED } from "../lib/seoJsonLd";
import { showArchitecturePage } from "../lib/siteFlags";

const PERSONAS = [
  { labelKey: "landing.persona.buy", to: "/products#desk-buy-side" },
  { labelKey: "landing.persona.sell", to: "/products#desk-sell-side" },
  { labelKey: "landing.persona.quant", to: "/products#desk-quant" },
  { labelKey: "landing.persona.ir", to: "/products#desk-ir-compliance" },
] as const;

const OUTCOME_LABELS = ["met", "exceeded", "missed", "dropped", "pending"] as const;

const METHOD_STEPS = [
  { titleKey: "landing.method.sources.title", textKey: "landing.method.sources.text" },
  { titleKey: "landing.method.guidance.title", textKey: "landing.method.guidance.text" },
  { titleKey: "landing.method.review.title", textKey: "landing.method.review.text" },
  { titleKey: "landing.method.score.title", textKey: "landing.method.score.text" },
] as const;

const SURFACES = [
  { titleKey: "landing.next.tracker.title", textKey: "landing.next.tracker.text", to: "/tracker" },
  { titleKey: "landing.next.research.title", textKey: "landing.next.research.text", to: "/research" },
  { titleKey: "landing.next.sights.title", textKey: "landing.next.sights.text", to: "/sights" },
  { titleKey: "landing.next.rankings.title", textKey: "landing.next.rankings.text", to: "/rankings" },
] as const;

/** Public marketing home — citealpha.com apex. */
export default function LandingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [meta, setMeta] = useState<ProductMeta | null>(null);

  useEffect(() => {
    if (!loading && user && user.kind !== "guest") {
      navigate("/tracker", { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    fetchProductMeta()
      .then(setMeta)
      .catch(() => setMeta(null));
  }, []);

  return (
    <section className="landing-page" data-testid="landing-page">
      <div className="landing-hero panel">
        <p className="landing-kicker">{t("landing.hero.kicker")}</p>
        <h1>{t("landing.hero.title")}</h1>
        <p className="muted landing-lede">
          {t("landing.hero.lede", { product: PRODUCT_NAME })}
        </p>
        <div className="landing-cta">
          <Link
            to={`/companies/${EXAMPLE_COMPANY_ID}`}
            className="btn primary"
            data-testid="landing-cta-example"
            onClick={() => trackEvent("example_cta", { source: "landing-hero" })}
          >
            {t("landing.hero.ctaExample")}
          </Link>
          <Link
            to="/pilot"
            className="btn"
            data-testid="landing-cta-pilot"
            onClick={() => trackEvent("pilot_cta", { source: "landing-hero", type: "form" })}
          >
            {t("landing.ctaPilot")}
          </Link>
        </div>
        <p className="muted landing-personas" data-testid="landing-personas">
          {t("landing.persona.lead")}:{" "}
          {PERSONAS.map((p, i) => (
            <span key={p.to}>
              {i > 0 ? " · " : null}
              <Link to={p.to}>{t(p.labelKey)}</Link>
            </span>
          ))}
        </p>
      </div>

      <LandingWorkedExample />

      <div className="panel landing-explain" data-testid="landing-explain">
        <h2 style={{ marginTop: 0 }}>{t("landing.define.title")}</h2>
        <p>{t("landing.define.p1")}</p>
        <p>{t("landing.define.p2")}</p>
        <div className="landing-chips" data-testid="landing-outcome-chips">
          {OUTCOME_LABELS.map((label) => (
            <span key={label} className="landing-chip">
              <span className={`pill ${label}`}>{label}</span>
              <InfoTip termId={label} />
            </span>
          ))}
        </div>
      </div>

      <div className="panel landing-method" data-testid="landing-method">
        <h2 style={{ marginTop: 0 }}>{t("landing.method.title")}</h2>
        <ol className="landing-method-steps">
          {METHOD_STEPS.map((s) => (
            <li key={s.titleKey}>
              <strong>{t(s.titleKey)}</strong>
              <span className="muted">
                {t(s.textKey, { algo: meta?.gci_algorithm ?? "gci_scoring_v3" })}
              </span>
            </li>
          ))}
        </ol>
        <p className="muted landing-sources">
          <Link to="/about#how">{t("landing.method.more")}</Link>
          {" · "}
          {t("landing.sources")}:{" "}
          <a href="https://www.nseindia.com/" rel="noopener noreferrer" target="_blank">
            {t("landing.sources.nse")}
          </a>
          {" · "}
          <a href="https://www.bseindia.com/" rel="noopener noreferrer" target="_blank">
            {t("landing.sources.bse")}
          </a>
          {" · "}
          <a href="https://www.sebi.gov.in/" rel="noopener noreferrer" target="_blank">
            {t("landing.sources.sebi")}
          </a>
        </p>
      </div>

      <LandingProofPanel meta={meta} />

      <div className="panel landing-pilot" id="pilot-request">
        <h2 style={{ marginTop: 0 }}>{t("landing.pilot.title")}</h2>
        <p className="muted">{t("landing.pilot.lede")}</p>
        <PilotRequestForm source="landing" />
        <div className="landing-cta" style={{ marginTop: "1rem" }}>
          <Link
            to="/package"
            className="btn"
            onClick={() => trackEvent("pilot_cta", { source: "landing", type: "package" })}
          >
            {t("landing.viewPackages")}
          </Link>
        </div>
      </div>

      <div className="landing-next" data-testid="landing-surfaces">
        <h2>{t("landing.next.title")}</h2>
        <div className="landing-grid">
          {SURFACES.map((s) => (
            <Link key={s.to} to={s.to} className="panel landing-card">
              <h3>{t(s.titleKey)}</h3>
              <p className="muted">{t(s.textKey)}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="panel landing-faq-block" data-testid="landing-faq">
        <h2 style={{ marginTop: 0 }}>Common questions</h2>
        <dl className="glossary landing-faq">
          {SEO_STRUCTURED.faq.slice(0, 3).map((item) => (
            <div className="glossary-row" key={item.question}>
              <dt>{item.question}</dt>
              <dd className="seo-speakable">{item.answer}</dd>
            </div>
          ))}
        </dl>
        <p className="muted">
          <Link to="/answers">All FAQ answers</Link>
          {" · "}
          <Link to="/blog/what-is-guidance-credibility-index">Full GCI definition</Link>
        </p>
      </div>

      <div className="panel landing-trust">
        <h2 style={{ marginTop: 0 }}>{t("landing.trust.title")}</h2>
        <ul className="about-list">
          <li>{t("landing.trust.item1")}</li>
          <li>{t("landing.trust.item2")}</li>
          <li>{t("landing.trust.item3")}</li>
        </ul>
        <p className="muted">
          <Link to="/about">{t("landing.trust.about", { product: PRODUCT_NAME })}</Link>
          {" · "}
          <Link to="/blog">{t("nav.blog")}</Link>
          {" · "}
          <Link to="/trust">{t("footer.trust")}</Link>
          {showArchitecturePage ? (
            <>
              {" · "}
              <Link to="/about/architecture">{t("footer.architecture")}</Link>
            </>
          ) : null}
          {" · "}
          <Link to="/login">{t("common.login")}</Link>
        </p>
        <p className="muted landing-share">
          {t("landing.share")}:{" "}
          <a
            href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fcitealpha.com%2F"
            rel="noopener noreferrer"
            target="_blank"
          >
            {t("landing.share.linkedin")}
          </a>
          {" · "}
          <a
            href="https://twitter.com/intent/tweet?url=https%3A%2F%2Fcitealpha.com%2F&text=CiteAlpha%20Guidance%20Credibility%20Index"
            rel="noopener noreferrer"
            target="_blank"
          >
            {t("landing.share.x")}
          </a>
        </p>
      </div>

      <Disclaimer />
      <p className="muted landing-copy">{copyrightLine()}</p>
      <p className="muted landing-entity">
        {t("landing.entity", { product: PRODUCT_NAME, entity: LEGAL_ENTITY })}
      </p>
    </section>
  );
}
