import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import type { ProductMeta } from "../lib/api";

/** Live coverage counts, stated at the precision a research head will check. */
export default function LandingProofPanel({ meta }: { meta: ProductMeta | null }) {
  const { t } = useI18n();

  return (
    <div className="panel landing-proof" data-testid="landing-proof">
      <h2 style={{ marginTop: 0 }}>{t("landing.coverage.title")}</h2>
      <p className="muted">{t("landing.coverage.lede")}</p>
      {meta ? (
        <ul className="about-list landing-proof-stats">
          <li data-testid="coverage-hand-labeled">
            <strong>
              {t("landing.coverage.handLabeled", { count: meta.hand_labeled_count })}
            </strong>
          </li>
          <li data-testid="coverage-demo">
            {t("landing.coverage.demo", { count: meta.demo_structured_count })}
          </li>
          <li data-testid="coverage-listings">
            {t("landing.coverage.listings", { count: meta.gci_listing_scored_count })}
          </li>
          <li>{t("landing.coverage.next")}</li>
          <li data-testid="coverage-pit">{t("landing.coverage.pit")}</li>
        </ul>
      ) : (
        <p className="muted">{t("landing.coverage.loading")}</p>
      )}
      <p className="muted landing-proof-links">
        <Link to="/blog/hand-labeled-vs-demo-data">{t("landing.coverage.badgesLink")}</Link>
        {" · "}
        <Link to="/trust">{t("footer.trust")}</Link>
      </p>
    </div>
  );
}
