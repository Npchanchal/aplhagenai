import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import { fetchProductMeta, type ProductMeta } from "../lib/api";

/** Live cohort stats from /api/meta — honest proof, not marketing over-claim. */
export default function LandingProofPanel() {
  const { t } = useI18n();
  const [meta, setMeta] = useState<ProductMeta | null>(null);

  useEffect(() => {
    fetchProductMeta()
      .then(setMeta)
      .catch(() => setMeta(null));
  }, []);

  return (
    <div className="panel landing-proof" data-testid="landing-proof">
      <h2 style={{ marginTop: 0 }}>{t("landing.proof.title")}</h2>
      <p className="muted">{t("landing.proof.lede")}</p>
      {meta ? (
        <ul className="about-list landing-proof-stats">
          <li>
            {t("landing.proof.handLabeled", { count: meta.hand_labeled_count })}
          </li>
          <li>
            {t("landing.proof.scored", { count: meta.gci_scored_count })}
          </li>
          <li>
            {t("landing.proof.listings", { count: meta.gci_listing_scored_count })}
          </li>
          <li>{t("landing.proof.algorithm", { algo: meta.gci_algorithm })}</li>
        </ul>
      ) : (
        <p className="muted">{t("landing.proof.loading")}</p>
      )}
      <p className="muted">
        {t("landing.proof.badges")}{" "}
        <Link to="/blog/hand-labeled-vs-demo-data">{t("landing.proof.badgesLink")}</Link>.
      </p>
      <p className="muted landing-proof-links">
        <Link to="/rankings">{t("footer.rankings")}</Link>
        {" · "}
        <Link to="/blog/sensex-pilot-evidence-trail">{t("landing.proof.pilotArticle")}</Link>
        {" · "}
        <Link to="/trust">{t("footer.trust")}</Link>
      </p>
    </div>
  );
}
