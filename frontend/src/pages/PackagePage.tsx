import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import { useAuth } from "../lib/auth";
import { useI18n } from "../i18n";
import { CONTACT_EMAIL } from "../lib/legal";

/** Three buyer plans. Quote only until a payment processor is live (W7.1 / W8.8). */
export default function PackagePage() {
  const { t } = useI18n();
  const { token, user } = useAuth();
  const signedIn = Boolean(token && user?.kind !== "guest");

  const plans = [
    {
      id: "pilot",
      name: t("package.plan.pilot.name"),
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
      name: t("package.plan.desk.name"),
      price: t("package.plan.desk.price"),
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
      name: t("package.plan.enterprise.name"),
      price: t("package.plan.enterprise.price"),
      period: t("package.plan.enterprise.period"),
      best: t("package.plan.enterprise.best"),
      includes: [
        t("package.plan.enterprise.i1"),
        t("package.plan.enterprise.i2"),
        t("package.plan.enterprise.i3"),
        t("package.plan.enterprise.i4"),
      ],
    },
  ];

  return (
    <section className="package-page" data-testid="package-page">
      <p className="page-kicker">{t("package.kicker")}</p>
      <h1>{t("package.title")}</h1>
      <p className="muted lede">{t("package.lede")}</p>
      <aside className="disclaimer" role="note" data-testid="retail-marketing-gate">
        {t("package.retailGate")}
      </aside>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>{t("package.plans.title")}</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          {t("package.plans.lede")}
        </p>
        <div className="plan-grid">
          {plans.map((plan) => (
            <div key={plan.id} className="plan" data-testid={`plan-${plan.id}`}>
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">{plan.price}</div>
              <div className="plan-period muted">{plan.period}</div>
              <p className="plan-best">{plan.best}</p>
              <ul>
                {plan.includes.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p style={{ marginTop: 16 }}>
                <Link className="btn" to="/pilot" data-testid={`quote-${plan.id}`}>
                  {t("package.quoteCta")}
                </Link>
              </p>
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 16 }} data-testid="package-independence">
          {t("landing.trust.item4")}
        </p>
        <p className="cta-line">
          {t("package.buy.contact")}{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        {signedIn ? (
          <p className="muted">
            <Link to="/billing">{t("package.orderFormLink")}</Link>
          </p>
        ) : null}
      </div>
      <Disclaimer />
    </section>
  );
}
