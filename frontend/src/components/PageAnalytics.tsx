import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ensureAnalyticsBootstrap, initAnalytics, trackPageview } from "../lib/analytics";

/** Route-aware pageviews for SPA analytics (Plausible when configured). */
export default function PageAnalytics() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    ensureAnalyticsBootstrap();
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageview();
  }, [pathname, search]);

  return null;
}
