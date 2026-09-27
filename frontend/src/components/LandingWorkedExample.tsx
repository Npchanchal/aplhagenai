import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import { fetchCompanyGci, type CompanyGCIDetail, type OutcomeView } from "../lib/api";
import { formatScore, scoreClass } from "../lib/score";

export const EXAMPLE_COMPANY_ID = "infy";
const EXAMPLE_THREAD_ID = "infy-rev-cc";

function band(o: OutcomeView): string {
  const low = o.guided_low ?? o.guided_value;
  const high = o.guided_high ?? o.guided_value;
  return low === high ? `${low}%` : `${low}–${high}%`;
}

function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** One real, cited guidance thread — proof before definition. */
export default function LandingWorkedExample() {
  const { t } = useI18n();
  const [detail, setDetail] = useState<CompanyGCIDetail | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchCompanyGci(EXAMPLE_COMPANY_ID)
      .then(setDetail)
      .catch(() => setFailed(true));
  }, []);

  const rows = (detail?.outcomes ?? [])
    .filter((o) => o.thread_id === EXAMPLE_THREAD_ID && o.actual_value != null)
    .sort((a, b) => a.period.localeCompare(b.period));

  return (
    <div className="panel landing-example" data-testid="landing-worked-example">
      <p className="landing-kicker">{t("landing.example.kicker")}</p>
      {failed ? (
        <p className="muted">{t("landing.example.error")}</p>
      ) : !detail ? (
        <p className="muted">{t("landing.example.loading")}</p>
      ) : (
        <>
          <div className="landing-example-head">
            <h2>{t("landing.example.title", { name: detail.name })}</h2>
            <span className="landing-example-gci">
              {t("landing.example.companyGci")}{" "}
              <strong className={`score ${scoreClass(detail.gci_score)}`}>
                {formatScore(detail.gci_score)}
              </strong>
            </span>
          </div>
          <p className="muted">{t("landing.example.lede")}</p>
          <ol className="landing-example-rows">
            {rows.map((o) => (
              <li key={`${o.period}-${o.metric}`} className="landing-example-row">
                <span className="landing-example-period">{o.period}</span>
                <span>
                  <span className="muted">{t("landing.example.guided")}</span> {band(o)}
                </span>
                <span>
                  <span className="muted">{t("landing.example.actual")}</span> {o.actual_value}%
                </span>
                <span className={`pill ${o.label}`} data-testid={`example-label-${o.period}`}>
                  {o.label}
                </span>
                <span className="muted">
                  {o.contribution_score != null
                    ? t("landing.example.points", { points: o.contribution_score })
                    : "—"}
                </span>
                {o.source_url ? (
                  <a
                    className="landing-example-source"
                    href={o.source_url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {t("landing.example.source")}: {sourceHost(o.source_url)}
                    {o.as_of ? ` · ${t("landing.example.reported", { date: o.as_of })}` : ""}
                  </a>
                ) : null}
              </li>
            ))}
          </ol>
          <div className="landing-example-why">
            <strong>{t("landing.example.whyTitle")}</strong> {t("landing.example.why")}
          </div>
          <p>
            <Link to={`/companies/${EXAMPLE_COMPANY_ID}`}>
              {t("landing.example.open", { name: detail.name })}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
