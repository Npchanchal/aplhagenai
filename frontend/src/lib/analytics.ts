/** Plausible + GA4. Scripts load only after DPDP analytics consent. */

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> },
    ) => void;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN?.trim() || "";
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || "";
const CONSENT_KEY = "intellens.analytics_consent";

let gaBootstrapped = false;
let initialized = false;

export function analyticsConfigured(): boolean {
  return PLAUSIBLE_DOMAIN.length > 0 || GA_ID.length > 0;
}

export function readAnalyticsConsent(): boolean | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (raw === "granted") return true;
    if (raw === "denied") return false;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeAnalyticsConsent(granted: boolean): void {
  try {
    localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
  } catch {
    /* ignore */
  }
}

export function analyticsEnabled(): boolean {
  return analyticsConfigured() && readAnalyticsConsent() === true;
}

function bootstrapGa4(): void {
  if (!GA_ID || typeof document === "undefined" || gaBootstrapped) return;
  gaBootstrapped = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    wait_for_update: 500,
  });
  window.gtag("config", GA_ID, { anonymize_ip: true, send_page_view: false });
  const script = document.createElement("script");
  script.id = "ga4-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);
}

function activateGa4(): void {
  if (!GA_ID) return;
  window.gtag?.("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
  });
}

/** Load GA stub (consent denied) so Google can verify the tag; Plausible stays off. */
export function ensureAnalyticsBootstrap(): void {
  if (!analyticsConfigured() || typeof document === "undefined") return;
  bootstrapGa4();
}

function loadPlausible(): void {
  if (!PLAUSIBLE_DOMAIN || typeof document === "undefined") return;
  if (document.getElementById("plausible-script")) return;
  const script = document.createElement("script");
  script.id = "plausible-script";
  script.defer = true;
  script.dataset.domain = PLAUSIBLE_DOMAIN;
  script.src = "https://plausible.io/js/script.js";
  document.head.appendChild(script);
}

function loadGa4(): void {
  bootstrapGa4();
  activateGa4();
}

/** Load tags once after the visitor grants analytics cookies. */
export function initAnalytics(): void {
  ensureAnalyticsBootstrap();
  if (typeof document === "undefined") return;
  if (readAnalyticsConsent() !== true) return;
  if (!analyticsConfigured()) return;
  if (!initialized) {
    loadPlausible();
    loadGa4();
    initialized = true;
  }
  trackPageview();
}

export function trackPageview(): void {
  if (!analyticsEnabled()) return;
  window.plausible?.("pageview");
  window.gtag?.("event", "page_view");
}

/** Funnel events — never include email, quotes, or other PII. */
export function trackEvent(name: string, props?: Record<string, string>): void {
  if (!analyticsEnabled()) return;
  const safe = props ? { ...props } : undefined;
  if (safe) {
    delete safe.email;
    delete safe.quote;
    delete safe.quote_span;
  }
  window.plausible?.(name, safe ? { props: safe } : undefined);
  window.gtag?.("event", name, safe);
}
