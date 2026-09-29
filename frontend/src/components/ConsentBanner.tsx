import { useEffect, useState } from "react";
import {
  analyticsConfigured,
  initAnalytics,
  readAnalyticsConsent,
  writeAnalyticsConsent,
} from "../lib/analytics";
import { useAuth } from "../lib/auth";
import { useI18n } from "../i18n";

/** DPDP cookie banner — GA4/Plausible stay unloaded until Accept. */
export default function ConsentBanner() {
  const { t } = useI18n();
  const { user, updatePreferences, preferences } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!analyticsConfigured()) return;
    const stored = readAnalyticsConsent();
    const fromPrefs = preferences?.analytics_consent;
    if (fromPrefs === true || stored === true) {
      writeAnalyticsConsent(true);
      initAnalytics();
      setOpen(false);
      return;
    }
    if (fromPrefs === false || stored === false) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [preferences?.analytics_consent]);

  if (!open || !analyticsConfigured()) return null;

  async function choose(granted: boolean) {
    writeAnalyticsConsent(granted);
    if (granted) initAnalytics();
    if (user && user.kind !== "guest") {
      try {
        await updatePreferences({ analytics_consent: granted });
      } catch {
        /* local flag still set */
      }
    }
    setOpen(false);
  }

  return (
    <div className="consent-banner" data-testid="consent-banner" role="dialog" aria-label={t("ui.ConsentBanner.ariaLabel")}>
      <p>{t("ui.ConsentBanner.body")}</p>
      <div className="consent-actions">
        <button type="button" className="btn-ghost" onClick={() => void choose(false)}>
          {t("ui.ConsentBanner.decline")}
        </button>
        <button type="button" className="btn-primary" onClick={() => void choose(true)}>
          {t("ui.ConsentBanner.accept")}
        </button>
      </div>
    </div>
  );
}
