import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import PilotRequestForm from "../components/PilotRequestForm";
import { useI18n } from "../i18n";
import { trackEvent } from "../lib/analytics";
import { useAuth } from "../lib/auth";
import { copyrightLine, LEGAL_ENTITY, PRODUCT_NAME } from "../lib/legal";
import { showArchitecturePage } from "../lib/siteFlags";

const SURFACES = [
  {
    titleKey: "landing.surface.tracker.title",
    textKey: "landing.surface.tracker.text",
    to: "/tracker",
  },
  {
    titleKey: "landing.surface.desk.title",
    textKey: "landing.surface.desk.text",
    to: "/desk",
  },
  {
    titleKey: "landing.surface.research.title",
    textKey: "landing.surface.research.text",
    to: "/research",
  },
  {
    titleKey: "landing.surface.sights.title",
    textKey: "landing.surface.sights.text",
    to: "/sights",
  },
] as const;

/** Public marketing home — citealpha.com apex. */
export default function LandingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && user.kind !== "guest") {
      navigate("/tracker", { replace: true });
    }
  }, [loading, user, navigate]);

  return (
    <section className="landing-page" data-testid="landing-page">
      <div className="landing-hero panel">
        <p className="landing-kicker">{LEGAL_ENTITY}</p>
        <h1>{t("landing.title")}</h1>
        <p className="muted landing-lede">
          {t("landing.lede", { product: PRODUCT_NAME })}
        </p>
        <div className="landing-cta">
          <Link to="/tracker" className="btn primary" data-testid="landing-cta-tracker">
            {t("landing.ctaTracker")}
          </Link>
          <Link
            to="/pilot"
            className="btn"
            onClick={() => trackEvent("pilot_cta", { source: "landing-hero", type: "form" })}
          >
            {t("landing.ctaPilot")}
          </Link>
        </div>
      </div>

      <div className="landing-grid">
        {SURFACES.map((s) => (
          <Link key={s.to} to={s.to} className="panel landing-card">
            <h2>{t(s.titleKey)}</h2>
            <p className="muted">{t(s.textKey)}</p>
            <span className="landing-card-link">{t("landing.open")}</span>
          </Link>
        ))}
      </div>

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
          <Link to="/rankings">{t("footer.rankings")}</Link>
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
      </div>

      <Disclaimer />
      <p className="muted landing-copy">{copyrightLine()}</p>
      <p className="muted landing-entity">
        {t("landing.entity", { product: PRODUCT_NAME, entity: LEGAL_ENTITY })}
      </p>
    </section>
  );
}
