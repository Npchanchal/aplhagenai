import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import InfoTip from "../components/InfoTip";
import { useI18n } from "../i18n";

const INCLUDED = [
  { tip: "gci", titleKey: "package.inc.gci.title", textKey: "package.inc.gci.text" },
  { tip: "tier1", titleKey: "package.inc.tier1.title", textKey: "package.inc.tier1.text" },
  { tip: "gci_parameter", titleKey: "package.inc.params.title", textKey: "package.inc.params.text" },
  { tip: "evidence", titleKey: "package.inc.evidence.title", textKey: "package.inc.evidence.text" },
  { tip: "change_trend", titleKey: "package.inc.change.title", textKey: "package.inc.change.text" },
  { tip: "granger", titleKey: "package.inc.granger.title", textKey: "package.inc.granger.text" },
  { tip: "charts", titleKey: "package.inc.charts.title", textKey: "package.inc.charts.text" },
  { tip: "source_policy", titleKey: "package.inc.source.title", textKey: "package.inc.source.text" },
  { tip: "pit", titleKey: "package.inc.api.title", textKey: "package.inc.api.text" },
  {
    tip: "research_terminal",
    titleKey: "package.inc.research.title",
    textKey: "package.inc.research.text",
  },
  { tip: "desk_sku", titleKey: "package.inc.desk.title", textKey: "package.inc.desk.text" },
] as const;

const SURFACES = [
  {
    to: "/tracker",
    tip: "tracker",
    titleKey: "nav.tracker",
    blurbKey: "package.surface.tracker.blurb",
  },
  {
    to: "/desk",
    tip: "desk_sku",
    titleKey: "nav.desk",
    blurbKey: "package.surface.desk.blurb",
  },
  {
    to: "/research",
    tip: "research_terminal",
    titleKey: "nav.research",
    blurbKey: "package.surface.research.blurb",
  },
] as const;

export default function PackagePage() {
  const { t } = useI18n();

  const plans = [
    {
      id: "pilot",
      name: "Pilot",
      price: t("package.plan.pilot.price"),
      period: t("package.plan.pilot.period"),
      best: t("package.plan.pilot.best"),
      includes: [
        t("package.plan.pilot.i1"),
        t("package.plan.pilot.i2"),
        t("package.plan.pilot.i3"),
        t("package.plan.pilot.i4"),
      ],
    },
    {
      id: "desk",
      name: "Desk",
      price: "₹45,000",
      period: t("package.plan.desk.period"),
      best: t("package.plan.desk.best"),
      includes: [
        t("package.plan.desk.i1"),
        t("package.plan.desk.i2"),
        t("package.plan.desk.i3"),
        t("package.plan.desk.i4"),
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise API",
      price: "₹25–80L",
      period: t("package.plan.enterprise.period"),
      best: t("package.plan.enterprise.best"),
      includes: [
        t("package.plan.enterprise.i1"),
        t("package.plan.enterprise.i2"),
        t("package.plan.enterprise.i3"),
        t("package.plan.enterprise.i4"),
      ],
    },
    {
      id: "onestop",
      name: "One-Stop Platform",
      price: "₹40L–1.2Cr",
      period: t("package.plan.onestop.period"),
      best: t("package.plan.onestop.best"),
      includes: [
        t("package.plan.onestop.i1"),
        t("package.plan.onestop.i2"),
        t("package.plan.onestop.i3"),
        t("package.plan.onestop.i4"),
      ],
      highlight: true as const,
    },
  ];

  return (
    <section className="package-page" data-testid="package-page">
      <p className="page-kicker">{t("package.kicker")}</p>
      <h1>
        {t("package.title")} <InfoTip termId="one_stop" />
      </h1>
      <p className="muted lede">{t("package.lede")}</p>
      <aside className="disclaimer" role="note" data-testid="retail-marketing-gate">
        {t("package.retailGate")}{" "}
        <Link to="/billing">{t("nav.billing")}</Link>.
      </aside>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>{t("package.map.title")}</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {t("package.map.lede")}{" "}
          <Link to="/products">{t("nav.products")}</Link>.
        </p>
        <div className="package-surfaces">
          {SURFACES.map((s) => (
            <div key={s.to} className="package-surface">
              <strong>
                <Link to={s.to} style={{ color: "inherit", fontWeight: 600 }}>
                  {t(s.titleKey)}
                </Link>{" "}
                <InfoTip termId={s.tip} />
              </strong>
              <span className="muted">{t(s.blurbKey)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel" data-testid="portfolio-skus">
        <h2 style={{ marginTop: 0 }}>{t("package.parallel.title")}</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {t("package.parallel.lede")}
        </p>
        <ul className="package-includes">
          <li>
            <strong>Score</strong>
            <span className="muted">{t("package.sku.score")}</span>
          </li>
          <li>
            <strong>Cite</strong>
            <span className="muted">{t("package.sku.cite")}</span>
          </li>
          <li>
            <strong>Radar</strong>
            <span className="muted">{t("package.sku.radar")}</span>
          </li>
          <li>
            <strong>Ledger</strong>
            <span className="muted">{t("package.sku.ledger")}</span>
          </li>
          <li>
            <strong>Data</strong>
            <span className="muted">{t("package.sku.data")}</span>
          </li>
        </ul>
        <p style={{ marginTop: 12 }}>
          <Link className="btn" to="/products">
            {t("package.openProducts")}
          </Link>
        </p>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>{t("package.included.title")}</h2>
        <ul className="package-includes">
          {INCLUDED.map((item) => (
            <li key={item.titleKey}>
              <strong>
                {t(item.titleKey)} <InfoTip termId={item.tip} />
              </strong>
              <span className="muted">{t(item.textKey)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel one-stop-callout" data-testid="one-stop-panel">
        <h2 style={{ marginTop: 0 }}>
          {t("package.onestop.title")} <InfoTip termId="one_stop" />
        </h2>
        <p className="muted">
          {t("package.onestop.lede")} <InfoTip termId="alphahunter" />{" "}
          <InfoTip termId="csm" />
        </p>
        <p style={{ marginTop: 12 }}>
          <Link className="btn" to="/desk">
            {t("package.onestop.openDesk")}
          </Link>{" "}
          <Link className="btn ghost" to="/help" style={{ marginLeft: 8 }}>
            {t("package.onestop.glossary")}
          </Link>
        </p>
        <Disclaimer compact />
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>{t("package.plans.title")}</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          {t("package.plans.lede")}
        </p>
        <div className="plan-grid">
          {plans.map((plan) => (
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
        <h2 style={{ marginTop: 0 }}>{t("package.buy.title")}</h2>
        <ol className="package-steps">
          <li>
            {t("package.buy.s1")}{" "}
            <Link to="/desk?tab=csm" style={{ color: "var(--accent)", fontWeight: 600 }}>
              Desk → CSM
            </Link>
            {" · "}
            <Link to="/rankings" style={{ color: "var(--accent)", fontWeight: 600 }}>
              {t("nav.rankings")}
            </Link>
            .
          </li>
          <li>{t("package.buy.s2")}</li>
          <li>
            {t("package.buy.s3")}{" "}
            <Link to="/billing" style={{ color: "var(--accent)", fontWeight: 600 }}>
              {t("nav.billing")}
            </Link>
            .
          </li>
        </ol>
        <p className="cta-line">{t("package.buy.contact")}</p>
      </div>
    </section>
  );
}
