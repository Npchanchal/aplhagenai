import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import PilotRequestForm from "../components/PilotRequestForm";
import { trackEvent } from "../lib/analytics";
import { useAuth } from "../lib/auth";
import { copyrightLine, LEGAL_ENTITY, PRODUCT_NAME } from "../lib/legal";
import { showArchitecturePage } from "../lib/siteFlags";

const SURFACES = [
  {
    title: "GCI Tracker",
    to: "/tracker",
    text: "Screen Sensex → Nifty names by guidance credibility. Every score links to evidence.",
  },
  {
    title: "Desk",
    to: "/desk",
    text: "Ops console — review queue, corpus, PIT/API, reports, and CSM.",
  },
  {
    title: "Research",
    to: "/research",
    text: "Search filings and transcripts. Cite-only chat — no hallucinated actuals.",
  },
  {
    title: "Sights",
    to: "/sights",
    text: "India disclosure research — search, cite-only answers, boards, and desk agents.",
  },
] as const;

/** Public marketing home — citealpha.com apex. */
export default function LandingPage() {
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
        <h1>A credit score for management guidance</h1>
        <p className="muted landing-lede">
          {PRODUCT_NAME} delivers the <strong>Guidance Credibility Index (GCI)</strong> —
          evidence-linked scores of whether Indian listed management delivered on quantified
          guidance. Keep your market terminal for prices; use {PRODUCT_NAME} for delivery.
        </p>
        <div className="landing-cta">
          <Link to="/tracker" className="btn primary" data-testid="landing-cta-tracker">
            Open GCI Tracker
          </Link>
          <Link
            to="/pilot"
            className="btn"
            onClick={() => trackEvent("pilot_cta", { source: "landing-hero", type: "form" })}
          >
            Request a pilot
          </Link>
        </div>
      </div>

      <div className="landing-grid">
        {SURFACES.map((s) => (
          <Link key={s.to} to={s.to} className="panel landing-card">
            <h2>{s.title}</h2>
            <p className="muted">{s.text}</p>
            <span className="landing-card-link">Open →</span>
          </Link>
        ))}
      </div>

      <div className="panel landing-pilot" id="pilot-request">
        <h2 style={{ marginTop: 0 }}>Request a pilot</h2>
        <p className="muted">
          Time-boxed evaluation for Indian equity desks — Sensex hand-labeled evidence, Desk console,
          and Research Terminal. Not investment advice.
        </p>
        <PilotRequestForm source="landing" />
        <div className="landing-cta" style={{ marginTop: "1rem" }}>
          <Link
            to="/package"
            className="btn"
            onClick={() => trackEvent("pilot_cta", { source: "landing", type: "package" })}
          >
            View packages
          </Link>
        </div>
      </div>

      <div className="panel landing-trust">
        <h2 style={{ marginTop: 0 }}>Built for institutional desks</h2>
        <ul className="about-list">
          <li>India beachhead — Sensex hand-labeled evidence, NSE/BSE universe navigation</li>
          <li>Every citeable point → period, metric, guided band, actual, label, source</li>
          <li>API-ready for quant / platform embed — not a retail tips product</li>
        </ul>
        <p className="muted">
          <Link to="/about">About {PRODUCT_NAME}</Link>
          {" · "}
          <Link to="/rankings">GCI Rankings</Link>
          {" · "}
          <Link to="/trust">Trust Center</Link>
          {showArchitecturePage ? (
            <>
              {" · "}
              <Link to="/about/architecture">Architecture</Link>
            </>
          ) : null}
          {" · "}
          <Link to="/login">Log in</Link>
        </p>
      </div>

      <Disclaimer />
      <p className="muted landing-copy">{copyrightLine()}</p>
      <p className="muted landing-entity">
        {PRODUCT_NAME} is owned and operated by {LEGAL_ENTITY}.
      </p>
    </section>
  );
}
