/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  /** Plausible site domain, e.g. citealpha.com — omit to disable analytics. */
  readonly VITE_PLAUSIBLE_DOMAIN?: string;
  /** GA4 measurement ID (G-…). Loaded only after DPDP consent. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /** Google Search Console HTML verification token. */
  readonly VITE_GSC_VERIFICATION?: string;
  /** Bing Webmaster HTML verification token (msvalidate.01 content value). */
  readonly VITE_BING_VERIFICATION?: string;
  /** Twitter @handle for twitter:site card attribution, e.g. citealpha */
  readonly VITE_TWITTER_SITE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
