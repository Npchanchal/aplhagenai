import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import { useI18n } from "../i18n";
import { fetchProductMeta, type FilingToScoreSla } from "../lib/api";
import { CONTACT_EMAIL, LEGAL_ENTITY, PRODUCT_NAME } from "../lib/legal";

/** Public, plain-language GCI methodology. Numbers mirror backend/app/services/gci_scoring.py. */
export default function MethodologyPage() {
  const { t } = useI18n();
  const [sla, setSla] = useState<FilingToScoreSla | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchProductMeta()
      .then((meta) => {
        if (!cancelled) setSla(meta.filing_to_score ?? null);
      })
      .catch(() => {
        if (!cancelled) setSla(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const labeled = (key: string) => (
    <li>
      <strong>{t(`${key}.label`)}</strong> {t(`${key}.text`)}
    </li>
  );

  return (
    <section className="page methodology-page" data-testid="methodology-page">
      <p className="page-kicker">{LEGAL_ENTITY}</p>
      <h1>{t("method.page.title")}</h1>
      <p className="muted lede">{t("method.page.lede")}</p>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>{t("method.page.guidance.title")}</h2>
        <ul className="about-list">
          <li>{t("method.page.guidance.i1")}</li>
          <li>{t("method.page.guidance.i2")}</li>
          <li>{t("method.page.guidance.i3")}</li>
        </ul>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>{t("method.page.review.title")}</h2>
        <ul className="about-list">
          <li>{t("method.page.review.i1")}</li>
          <li>{t("method.page.review.i2")}</li>
          <li>{t("method.page.review.i3")}</li>
          <li>{t("method.page.review.i4")}</li>
        </ul>
      </div>

      <div className="panel" data-testid="methodology-sla">
        <h2 style={{ marginTop: 0 }}>{t("method.page.sla.title")}</h2>
        <p>
          {t("method.page.sla.target", {
            days: sla?.target_business_days ?? 5,
            since: sla?.instrumentation_date ?? "2026-09-29",
          })}
        </p>
        {sla?.live && sla.live.n > 0 && sla.live.median_business_days != null ? (
          <p data-testid="methodology-sla-live">
            {t("method.page.sla.live", {
              median: sla.live.median_business_days,
              n: sla.live.n,
            })}
          </p>
        ) : (
          <p data-testid="methodology-sla-live">
            {t("method.page.sla.liveEmpty", {
              since: sla?.instrumentation_date ?? "2026-09-29",
            })}
          </p>
        )}
        {sla?.backfill && sla.backfill.n > 0 && sla.backfill.median_business_days != null ? (
          <p className="muted" data-testid="methodology-sla-median">
            {t("method.page.sla.backfill", {
              n: sla.backfill.n,
              median: sla.backfill.median_business_days,
              reviewedOn: sla.backfill.reviewed_on ?? "2026-09-29",
            })}
          </p>
        ) : null}
      </div>

      <div className="panel" data-testid="methodology-revisions">
        <h2 style={{ marginTop: 0 }}>{t("method.page.revisions.title")}</h2>
        <p>{t("method.page.revisions.p1")}</p>
        <p>{t("method.page.revisions.p2")}</p>
        <p className="muted">
          {t("method.page.revisions.example")}{" "}
          <Link to="/companies/infy">{t("method.page.revisions.exampleLink")}</Link>
        </p>
      </div>

      <div className="panel" data-testid="methodology-formula">
        <h2 style={{ marginTop: 0 }}>{t("method.page.formula.title")}</h2>
        <p>{t("method.page.formula.intro")}</p>
        <p>{t("method.page.formula.philosophy")}</p>
        <ul className="about-list">
          {labeled("method.page.formula.inside")}
          <li>
            <strong>{t("method.page.formula.outside.label")}</strong>{" "}
            {t("method.page.formula.outside.text1")} e<sup>−0.35·δ<sup>1.25</sup></sup>
            {t("method.page.formula.outside.text2")}
          </li>
          {labeled("method.page.formula.beats")}
          {labeled("method.page.formula.misses")}
        </ul>
        <p>
          <strong>{t("method.page.formula.floor.label")}</strong> {t("method.page.formula.floor.text")}
        </p>
        <p className="muted">{t("method.page.formula.example")}</p>
        <p>
          <strong>{t("method.page.formula.constants.label")}</strong>{" "}
          {t("method.page.formula.constants.text")}
        </p>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>{t("method.page.company.title")}</h2>
        <ul className="about-list">
          {labeled("method.page.company.metric")}
          {labeled("method.page.company.company")}
          {labeled("method.page.company.deductions")}
          {labeled("method.page.company.comparable")}
          {labeled("method.page.company.open")}
          <li>{t("method.page.company.history")}</li>
        </ul>
        <p className="muted">{t("method.page.company.record")}</p>
        <p className="muted">
          {t("method.page.company.changelog")}{" "}
          <Link to="/changelog">{t("footer.changelog")}</Link>
          . Every restatement is a new ledger row; earlier levels are not overwritten.
        </p>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>{t("method.page.independence.title")}</h2>
        <p>{t("method.page.independence.text", { product: PRODUCT_NAME })}</p>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>{t("method.page.errors.title")}</h2>
        <p>
          {t("method.page.errors.before")}{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> {t("method.page.errors.after")}
        </p>
      </div>

      <p className="muted">
        <Link to="/">{t("method.page.back")}</Link>
        {" · "}
        <Link to="/trust">{t("footer.trust")}</Link>
        {" · "}
        <Link to="/answers">{t("footer.answers")}</Link>
      </p>
      <Disclaimer />
    </section>
  );
}
