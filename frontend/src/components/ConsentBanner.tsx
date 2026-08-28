import { useEffect, useState } from "react";
import {
  analyticsConfigured,
  initAnalytics,
  readAnalyticsConsent,
  writeAnalyticsConsent,
} from "../lib/analytics";
import { useAuth } from "../lib/auth";

/** DPDP cookie banner — GA4/Plausible stay unloaded until Accept. */
export default function ConsentBanner() {
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
    <div className="consent-banner" data-testid="consent-banner" role="dialog" aria-label="Analytics cookies">
      <p>
        CiteAlpha uses optional analytics (Google Analytics / Plausible) to understand funnel
        traffic. No emails or evidence quotes are sent. You can decline.
      </p>
      <div className="consent-actions">
        <button type="button" className="btn-ghost" onClick={() => void choose(false)}>
          Decline
        </button>
        <button type="button" className="btn-primary" onClick={() => void choose(true)}>
          Accept analytics
        </button>
      </div>
    </div>
  );
}
