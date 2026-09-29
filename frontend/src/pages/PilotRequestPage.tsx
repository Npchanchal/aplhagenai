import Disclaimer from "../components/Disclaimer";
import { useI18n } from "../i18n";
import PilotRequestForm from "../components/PilotRequestForm";
import { copyrightLine, LEGAL_ENTITY, PRODUCT_NAME } from "../lib/legal";

/** Dedicated pilot intake page — public, no auth required. */
export default function PilotRequestPage() {
  const { t } = useI18n();
  return (
    <section className="landing-page pilot-page" data-testid="pilot-request-page">
      <div className="panel landing-pilot">
        <p className="landing-kicker">{LEGAL_ENTITY}</p>
        <h1 style={{ marginTop: 0 }}>{t("ui.PilotRequestPage.title", { product: PRODUCT_NAME })}</h1>
        <p className="muted landing-lede">
          {t("ui.PilotRequestPage.lede")}
        </p>
        <PilotRequestForm source="pilot-page" />
      </div>
      <Disclaimer />
      <p className="muted landing-copy">{copyrightLine()}</p>
    </section>
  );
}
