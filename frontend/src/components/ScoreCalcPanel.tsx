import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import type { CompanyGCIDetail } from "../lib/api";
import { formatCompanyScore, formatScore, metricDisplayName } from "../lib/score";

type Props = {
  detail: CompanyGCIDetail;
  testId?: string;
  /** Homepage worked example keeps the methodology link. */
  showMethodLink?: boolean;
};

/** Shared “how this score is calculated” block (homepage + dossier, plan W3.5). */
export default function ScoreCalcPanel({
  detail,
  testId = "example-calc",
  showMethodLink = false,
}: Props) {
  const { t } = useI18n();
  const closed = (detail.outcomes ?? []).filter((o) => o.actual_value != null);
  const pending = (detail.outcomes ?? []).filter((o) => o.label === "pending").length;
  const deduction = detail.audit_deduction ?? 0;

  return (
    <div className="landing-example-calc" data-testid={testId}>
      <strong>
        {t("landing.example.calcTitle", { score: formatCompanyScore(detail.gci_score) })}
      </strong>
      <ul>
        {Object.entries(detail.by_metric).map(([m, s]) => (
          <li key={m}>
            {metricDisplayName(m)}: <strong>{formatScore(s)}</strong>{" "}
            <span className="muted">
              {t("landing.example.calcMetric", {
                n: detail.periods_by_metric?.[m] ?? closed.filter((o) => o.metric === m).length,
                w: detail.composite_weights?.[m] ?? 1,
              })}
            </span>
          </li>
        ))}
        {Object.entries(detail.context_metrics ?? {}).map(([m, s]) => (
          <li key={m} className="muted" data-testid="example-context-metric">
            {metricDisplayName(m)}: {formatScore(s)}{" "}
            {t("landing.example.calcContext", {
              n: detail.periods_by_metric?.[m] ?? 1,
            })}
          </li>
        ))}
      </ul>
      <p className="muted">
        {t(deduction > 0 ? "landing.example.calcTotalDeduction" : "landing.example.calcTotal", {
          deduction,
          score: formatCompanyScore(detail.gci_score),
        })}
        {pending > 0 ? ` ${t("landing.example.calcPending", { n: pending })}` : ""}
        {showMethodLink ? (
          <>
            {" "}
            <Link to="/methodology">{t("landing.example.methodLink")}</Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
