import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import InfoTip from "../components/InfoTip";
import { useI18n } from "../i18n";

const PLANS = [
  {
    id: "pilot",
    name: "Pilot",
    price: "Complimentary",
    period: "30–60 days",
    best: "Evaluate on Sensex with your desk",
    includes: [
      "Up to 5 named users",
      "GCI Tracker + evidence dossiers",
      "Desk console + Research Terminal",
      "Read API + Help glossary",
    ],
  },
  {
    id: "desk",
    name: "Desk",
    price: "₹45,000",
    period: "per seat / year",
    best: "Primary ARR for research teams",
    includes: [
      "5–25 seats (volume above)",
      "Alerts, review, vernacular, MoM/QoQ/YoY",
      "Parameter catalog + charts",
      "2h onboarding workshop",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise API",
    price: "₹25–80L",
    period: "per year",
    best: "Quant / platform embed",
    includes: [
      "PIT history + EM factor JSON export",
      "Actuals / consensus import paths",
      "Contracted SLA · optional SSO/VPC (MSA)",
      "Named CSM",
    ],
  },
  {
    id: "onestop",
    name: "One-Stop Platform",
    price: "₹40L–1.2Cr",
    period: "per year",
    best: "Single vendor for guidance accountability",
    includes: [
      "Desk + API + Facts JSON import + corpus Wordmap",
      "Up to 40 seats + badge endpoints + labeling queue",
      "Dedicated labeling priority + QBRs (process)",
      "SSO OIDC when configured · VPC scoped in MSA",
    ],
    highlight: true,
  },
];

const INCLUDED = [
  {
    title: "GCI 0–100",
    tip: "gci",
    text: "Guidance vs delivery score with evidence",
  },
  {
    title: "Tier 1 corpus",
    tip: "tier1",
    text: "Auto ingest, period docs, citeable citation ids",
  },
  {
    title: "Parameters (~16)",
    tip: "gci_parameter",
    text: "Catalog metrics only — growth, margin, capital, sector",
  },
  {
    title: "Evidence trail",
    tip: "evidence",
    text: "Band, actual, Δ, label, source, citation_id",
  },
  {
    title: "MoM / QoQ / YoY",
    tip: "change_trend",
    text: "Honest horizons from PIT — null when no series",
  },
  {
    title: "Granger analytics",
    tip: "granger",
    text: "LASSO → F-test · experimental; may use non-citeable PIT scaffold",
  },
  {
    title: "Charts",
    tip: "charts",
    text: "GCI path, metric Δ, GCI↔price (India EOD may be demo without vendor key)",
  },
  {
    title: "Source policy",
    tip: "source_policy",
    text: "Text / ASR→text in; technicals & shenanigans out",
  },
  {
    title: "API + PIT",
    tip: "pit",
    text: "REST, point-in-time history, org seats (soft limits / SSO = roadmap)",
  },
  {
    title: "Research Terminal",
    tip: "research_terminal",
    text: "Search, cite-only chat, snapshot; tape/estimates often demo-labeled",
  },
  {
    title: "One-Stop Desk",
    tip: "desk_sku",
    text: "Corpus, Reports, Facts JSON import, vernacular, labeling queue; CSM = commercial",
  },
];

const SURFACES = [
  {
    to: "/",
    title: "Guidance Credibility Index",
    tip: "tracker",
    blurb: "Screen Sensex GCI, Δ, quality, peers, alerts → open evidence.",
  },
  {
    to: "/desk",
    title: "Desk",
    tip: "desk_sku",
    blurb: "Corpus foundation, cite-only Reports, PIT, AlphaHunter, Parameters, CSM.",
  },
  {
    to: "/research",
    title: "Research",
    tip: "research_terminal",
    blurb: "Search, cite-only chat, desk snapshot with MoM/QoQ/YoY.",
  },
];

export default function PackagePage() {
  const { t } = useI18n();
  return (
    <section className="package-page" data-testid="package-page">
      <p className="page-kicker">{t("package.kicker")}</p>
      <h1>
        {t("package.title")} <InfoTip termId="one_stop" />
      </h1>
      <p className="muted lede">{t("package.lede")}</p>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Product map</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Three primary surfaces — open any to evaluate in Pilot.
        </p>
        <div className="package-surfaces">
          {SURFACES.map((s) => (
            <div key={s.to} className="package-surface">
              <strong>
                <Link to={s.to} style={{ color: "inherit", fontWeight: 600 }}>
                  {s.title}
                </Link>{" "}
                <InfoTip termId={s.tip} />
              </strong>
              <span className="muted">{s.blurb}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>What’s included</h2>
        <ul className="package-includes">
          {INCLUDED.map((item) => (
            <li key={item.title}>
              <strong>
                {item.title} <InfoTip termId={item.tip} />
              </strong>
              <span className="muted">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel one-stop-callout" data-testid="one-stop-panel">
        <h2 style={{ marginTop: 0 }}>
          If you want a one-stop solution <InfoTip termId="one_stop" />
        </h2>
        <p className="muted">
          Choose <strong>One-Stop Platform</strong>: one contract for Tracker + evidence +
          API/PIT + AlphaHunter JSON import <InfoTip termId="alphahunter" /> + Wordmap context
          (stub until corpus-derived) + vernacular + CSM <InfoTip termId="csm" />. Quotes and
          consensus stay on your market terminal; IntelLens owns guidance accountability.
        </p>
        <p style={{ marginTop: 12 }}>
          <Link className="btn" to="/desk">
            Open One-Stop desk →
          </Link>{" "}
          <Link className="btn ghost" to="/help" style={{ marginLeft: 8 }}>
            Read glossary →
          </Link>
        </p>
        <Disclaimer compact />
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Plans</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Illustrative INR pricing for India GTM. Final quotes via order form.
        </p>
        <div className="plan-grid">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`plan ${plan.highlight ? "plan-highlight" : ""}`}
              data-testid={`plan-${plan.id}`}
            >
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">{plan.price}</div>
              <div className="plan-period muted">{plan.period}</div>
              <p className="plan-best">{plan.best}</p>
              <ul>
                {plan.includes.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>How to buy</h2>
        <ol className="package-steps">
          <li>
            Start a <strong>Pilot</strong> — open{" "}
            <Link to="/" style={{ color: "var(--accent)", fontWeight: 600 }}>
              Guidance Credibility Index
            </Link>
            , try{" "}
            <Link to="/desk" style={{ color: "var(--accent)", fontWeight: 600 }}>
              Desk → Parameters
            </Link>
            , and skim{" "}
            <Link to="/about" style={{ color: "var(--accent)", fontWeight: 600 }}>
              About
            </Link>{" "}
            /{" "}
            <Link to="/help" style={{ color: "var(--accent)", fontWeight: 600 }}>
              Help
            </Link>
            .
          </li>
          <li>
            Integrate reads with <code className="inline-code">X-API-Key</code> — OpenAPI
            at <code className="inline-code">/docs</code>; metrics at{" "}
            <code className="inline-code">/api/metrics</code>.
          </li>
          <li>
            Convert with <strong>Desk</strong>, <strong>Enterprise API</strong>, or{" "}
            <strong>One-Stop Platform</strong> via{" "}
            <code className="inline-code">docs/customer/ORDER_FORM.md</code>.
          </li>
        </ol>
        <p className="cta-line">
          Contact: <strong>sales@intellens.example</strong> · ask for org id + API key
        </p>
      </div>
    </section>
  );
}
