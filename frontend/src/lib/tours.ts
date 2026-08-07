/** Guided product tours — step catalogs keyed by surface. */

export type TourStep = {
  /** CSS selector; prefers [data-testid=…] */
  selector: string;
  title: string;
  body: string;
  /** Optional route to navigate before highlighting */
  route?: string;
  /** Optional query string including leading ? */
  search?: string;
  /** Wait for selector up to N ms (default 2500) */
  waitMs?: number;
  placement?: "auto" | "top" | "bottom" | "left" | "right";
};

export type TourId =
  | "tracker"
  | "dossier"
  | "desk"
  | "research"
  | "about_help";

export type TourDef = {
  id: TourId;
  title: string;
  blurb: string;
  /** Prefer this route when launching from Help hub */
  startRoute: string;
  steps: TourStep[];
};

export const TOURS: TourDef[] = [
  {
    id: "tracker",
    title: "Guidance Tracker",
    blurb: "Screen the Sensex / India universe, find citeable names, open a dossier.",
    startRoute: "/",
    steps: [
      {
        selector: ".brand",
        title: "Welcome to IntelLens",
        body: "Guidance Credibility Index (GCI) scores whether management delivered on quantified guidance — evidence-linked, not Buy/Hold.",
        route: "/",
      },
      {
        selector: '[data-testid="universe-filters"]',
        title: "Market & index",
        body: "Pick India then SENSEX for deep hand-labeled GCI. NSE_ALL / BSE_ALL list full masters with provisional scores (not for citation).",
      },
      {
        selector: '[data-testid="entity-search"]',
        title: "Entity search",
        body: "Search any NSE/BSE listing. Facets filter by exchange, quality, and corpus status — prefer “citeable” for external use.",
      },
      {
        selector: '[data-testid="company-table"]',
        title: "Universe table",
        body: "GCI, Δ, quality badge, and peer rank. Click a row to open the evidence dossier.",
      },
      {
        selector: '[data-testid="alerts-panel"]',
        title: "Alerts rail",
        body: "Drift, pending docs, and delivery alerts for the screened set — jump straight to review when needed.",
        placement: "left",
      },
    ],
  },
  {
    id: "dossier",
    title: "Company dossier",
    blurb: "Evidence-first trail, Tier 1 docs gate, descriptive analytics & Granger.",
    startRoute: "/companies/infy",
    steps: [
      {
        selector: '[data-testid="company-name"]',
        title: "Dossier header",
        body: "Company identity plus GCI score and quality badge. Hand-labeled names are citation-safe.",
        route: "/companies/infy",
      },
      {
        selector: '[data-testid="gci-score"]',
        title: "GCI score",
        body: "0–100 delivery score from closed guidance outcomes. Level + Δ appear when PIT history exists.",
      },
      {
        selector: ".dossier-toc",
        title: "Section TOC",
        body: "Jump between Evidence, Docs, Trend, Analytics, Notes, and Reports without losing context.",
      },
      {
        selector: '[data-testid="evidence-table"]',
        title: "Evidence trail",
        body: "Every row: period, metric, band, actual, label, quote, URL, citation_id. Non-citeable rows are badged.",
      },
      {
        selector: '[data-testid="period-docs"]',
        title: "Period documents",
        body: "Tier 1 matrix: transcript / results / IR per FY. Gate passes when types are complete and ≥95% outcomes are citeable.",
      },
      {
        selector: '[data-testid="gci-price-overlay"]',
        title: "GCI ↔ price (descriptive)",
        body: "Historical co-movement only — not a forecast or advice. N and window are disclosed from the PIT warehouse.",
      },
      {
        selector: '[data-testid="analytics-panel"]',
        title: "Analytics",
        body: "Granger panel (LASSO → F-test) shows statistical precedence when sample ≥12. Impact map uses FDR edges — not causation.",
      },
      {
        selector: '[data-testid="private-notes"]',
        title: "Private notes",
        body: "Session-scoped analyst notes — not mixed into org reports unless you export deliberately.",
      },
    ],
  },
  {
    id: "desk",
    title: "One-Stop Desk",
    blurb: "Review queue, corpus foundation, cite-only reports, PIT/API.",
    startRoute: "/desk?tab=review",
    steps: [
      {
        selector: '[data-testid="desk-page"] .tab-bar',
        title: "Desk tabs",
        body: "Sticky picker + URL ?tab= sync. Tracker jump, Evidence, Review, Corpus, Reports, PIT, and more.",
        route: "/desk",
        search: "?tab=review",
      },
      {
        selector: '[data-testid="crawl-bar"]',
        title: "Live IR refresh",
        body: "Primary ingest path — scheduled every 6h. Pending docs stay out of citeable GCI until Accept.",
        route: "/desk",
        search: "?tab=review",
      },
      {
        selector: '[data-testid="queue-paste"]',
        title: "Exception paste",
        body: "Use paste/URL only when a transcript is not yet in the corpus. Automatic crawl remains primary.",
        route: "/desk",
        search: "?tab=review",
      },
      {
        selector: '[data-testid="corpus-panel"]',
        title: "Tier 1 Corpus",
        body: "Build Sensex citation bindings + PIT warehouse (≥16 quarters) so analytics and horizons work honestly.",
        route: "/desk",
        search: "?tab=corpus",
        waitMs: 4000,
      },
      {
        selector: '[data-testid="reports-panel"]',
        title: "Role reports",
        body: "Markdown templates embed citeable outcomes only, with a citation appendix. Provisional rows are excluded.",
        route: "/desk",
        search: "?tab=reports",
        waitMs: 4000,
      },
      {
        selector: '[data-testid="gci-parameters-panel"]',
        title: "Parameters",
        body: "Catalog metrics that may enter GCI (~16+). Source policy: text/ASR in; technicals and shenanigans out.",
        route: "/desk",
        search: "?tab=parameters",
        waitMs: 4000,
      },
    ],
  },
  {
    id: "research",
    title: "Research Terminal",
    blurb: "Cite-only search & chat, desk snapshot, watchlist with MoM/QoQ/YoY.",
    startRoute: "/research?tab=search",
    steps: [
      {
        selector: '[data-testid="research-page"]',
        title: "Research Terminal",
        body: "Document search and cite-only chat over filings/transcripts. Complements GCI — not a price terminal.",
        route: "/research",
        search: "?tab=search",
      },
      {
        selector: '[data-testid="research-query"]',
        title: "Primary-source search",
        body: "Query IR / transcript / filing text. Prefer Hand-labeled companies when claiming guidance delivery.",
        route: "/research",
        search: "?tab=search",
      },
      {
        selector: '[data-testid="research-question"]',
        title: "Cite-only chat",
        body: "Answers must cite retrieved snippets. No invented quotes — provisional shells stay out.",
        route: "/research",
        search: "?tab=chat",
        waitMs: 4000,
      },
      {
        selector: '[data-testid="promise-brief"]',
        title: "Desk snapshot",
        body: "GCI path, open promises, and MoM/QoQ/YoY context for the picked name.",
        route: "/research",
        search: "?tab=desk",
        waitMs: 5000,
      },
      {
        selector: '[data-testid="research-watchlist"]',
        title: "Watchlist",
        body: "Tape with last + horizons and GCI Δ. Click through for the full dossier.",
        route: "/research",
        search: "?tab=watch",
        waitMs: 4000,
      },
    ],
  },
  {
    id: "about_help",
    title: "About & Help",
    blurb: "Product story, tier model, glossary, and commercial map.",
    startRoute: "/about",
    steps: [
      {
        selector: '[data-testid="about-page"]',
        title: "About IntelLens",
        body: "What / why / how / who — and the Tier 1→3 pipeline: ingest → cite → enrich → Granger-gated analytics.",
        route: "/about",
      },
      {
        selector: "#tiers",
        title: "Product tiers",
        body: "Tier 1 foundation is mandatory. Tier 2 workflows. Tier 3 Granger is methodology-gated and never advice.",
        route: "/about",
      },
      {
        selector: '[data-testid="help-page"]',
        title: "Help glossary",
        body: "Search GCI, citeable, Granger, PIT, corpus status, and more. Each InfoTip (ⓘ) opens the same vocabulary.",
        route: "/help",
      },
      {
        selector: '[data-testid="help-search"]',
        title: "Find a term",
        body: "Type citeable, tier1, or Granger to jump definitions used across Tracker, Desk, and Research.",
        route: "/help",
      },
      {
        selector: '[data-testid="package-page"]',
        title: "Package",
        body: "Pilot → Desk → Enterprise API → One-Stop. Commercial map for seats and PIT embed — still no retail Buy/Hold.",
        route: "/package",
      },
    ],
  },
];

export function getTour(id: TourId): TourDef | undefined {
  return TOURS.find((t) => t.id === id);
}

export const TOUR_STORAGE_KEY = "intellens.tours.seen.v1";

export type TourSeenMap = Partial<Record<TourId | "welcome_prompt", boolean>>;

export function loadTourSeen(): TourSeenMap {
  try {
    const raw = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as TourSeenMap;
  } catch {
    return {};
  }
}

export function saveTourSeen(map: TourSeenMap): void {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}
