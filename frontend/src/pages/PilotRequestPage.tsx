import Disclaimer from "../components/Disclaimer";
import PilotRequestForm from "../components/PilotRequestForm";
import { copyrightLine, LEGAL_ENTITY, PRODUCT_NAME } from "../lib/legal";

/** Dedicated pilot intake page — public, no auth required. */
export default function PilotRequestPage() {
  return (
    <section className="landing-page pilot-page" data-testid="pilot-request-page">
      <div className="panel landing-pilot">
        <p className="landing-kicker">{LEGAL_ENTITY}</p>
        <h1 style={{ marginTop: 0 }}>Request a {PRODUCT_NAME} pilot</h1>
        <p className="muted landing-lede">
          Time-boxed evaluation for Indian equity desks — Sensex hand-labeled evidence, Desk console,
          and Research Terminal. Share your firm details and we will follow up within one business day.
        </p>
        <PilotRequestForm source="pilot-page" />
      </div>
      <Disclaimer />
      <p className="muted landing-copy">{copyrightLine()}</p>
    </section>
  );
}
