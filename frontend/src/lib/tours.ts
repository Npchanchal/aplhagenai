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
  | "sights"
  | "about_help";

export type TourGroup = "workbench" | "learn";

export type TourDef = {
  id: TourId;
  title: string;
  blurb: string;
  group: TourGroup;
  /** Prefer this route when launching from Help hub */
  startRoute: string;
  steps: TourStep[];
};

export const TOURS: TourDef[] = [
  {
    id: "tracker",
    title: "Guidance Tracker",
    blurb: "Screen the Sensex / India universe, find citeable names, open a dossier.",
    group: "workbench",
    startRoute: "/tracker",
    steps: [
      {
        selector: ".brand",
        title: "Welcome to CiteAlpha",
        body: "Guidance Credibility Index (GCI) scores whether management delivered on quantified guidance — evidence-linked, not Buy/Hold.",
        route: "/tracker",
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
    blurb: "Evidence-first trail, period docs, and descriptive analytics.",
    group: "workbench",
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
        selector: '[data-testid="analytics-panel"]',
        title: "Analytics",
        body: "Granger panel shows statistical precedence when sample ≥12. Impact map uses FDR edges — not causation or advice.",
      },
    ],
  },
  {
    id: "desk",
    title: "One-Stop Desk",
    blurb: "Console, review queue, corpus, cite-only reports, PIT/API.",
    group: "workbench",
    startRoute: "/desk?tab=console",
    steps: [
      {
        selector: '[data-testid="desk-console"]',
        title: "Desk Console",
        body: "Multi-pane ops terminal. Primary tabs: Console, Review, Corpus, Reports, PIT. Parameters and CSM live under More.",
        route: "/desk",
        search: "?tab=console",
      },
      {
        selector: '[data-testid="desk-page"] .tab-bar',
        title: "Desk tabs",
        body: "Sticky picker + URL ?tab= sync. Review is the HITL queue; Corpus builds the Sensex citation gate.",
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
        body: "Build Sensex citation bindings + PIT warehouse so analytics and horizons work honestly.",
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
        selector: '[data-testid="pit-panel"]',
        title: "API / PIT",
        body: "Point-in-time GCI for backtests — no look-ahead. Demo key is for evaluation writes only.",
        route: "/desk",
        search: "?tab=pit",
        waitMs: 4000,
      },
    ],
  },
  {
    id: "research",
    title: "Research Terminal",
    blurb: "Cite-only search & chat, desk snapshot, watchlist with MoM/QoQ/YoY.",
    group: "workbench",
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
    id: "sights",
    title: "CiteAlpha Sights",
    blurb: "India disclosure research OS — hub, search, cite-only Ask, boards.",
    group: "workbench",
    startRoute: "/sights",
    steps: [
      {
        selector: '[data-testid="sights-hub"]',
        title: "Sights hub",
        body: "India IR research OS: search, cite-only Ask, boards, grid, and agents. Own brands only — no competitor chrome.",
        route: "/sights",
      },
      {
        selector: '[data-testid="sights-search"]',
        title: "Sights Search",
        body: "Search public IR and filings with Business Lexicon synonym expand. Complements the Research Terminal.",
        route: "/sights/search",
        waitMs: 4000,
      },
      {
        selector: '[data-testid="sights-ask"]',
        title: "Sights Ask",
        body: "Cite-only answers over the India disclosure corpus. Refuses when evidence is missing — never invents actuals.",
        route: "/sights/ask",
        waitMs: 4000,
      },
      {
        selector: '[data-testid="sights-boards"]',
        title: "Sights Boards",
        body: "Watchlist and saved queries for the desk session. Other tools (themes, grid, agents) live under Sights ▾ More.",
        route: "/sights/boards",
        waitMs: 4000,
      },
    ],
  },
  {
    id: "about_help",
    title: "About, Help & Trust",
    blurb: "Product story, glossary search, and procurement Trust Center.",
    group: "learn",
    startRoute: "/about",
    steps: [
      {
        selector: '[data-testid="about-page"]',
        title: "About CiteAlpha",
        body: "What GCI is, why desks need it, how ingest → cite works, and who uses which surface. SKUs live on Products.",
        route: "/about",
      },
      {
        selector: '[data-testid="help-page"]',
        title: "Help hub",
        body: "Start here, guided tours, source policy, and the glossary used by every InfoTip (ⓘ).",
        route: "/help",
      },
      {
        selector: '[data-testid="help-search"]',
        title: "Find a term",
        body: "Type citeable, dropped, Sights, or Granger to jump definitions used across Tracker, Desk, Research, and Sights.",
        route: "/help",
      },
      {
        selector: '[data-testid="trust-page"]',
        title: "Trust Center",
        body: "Security, residency, counsel status, and citation posture — honest flags for procurement, not marketing claims.",
        route: "/trust",
        waitMs: 4000,
      },
    ],
  },
];

export function getTour(id: TourId): TourDef | undefined {
  return TOURS.find((t) => t.id === id);
}

export const TOUR_GROUPS: { id: TourGroup; label: string }[] = [
  { id: "workbench", label: "Workbench" },
  { id: "learn", label: "Learn" },
];

export const TOUR_STORAGE_KEY = "citealpha.tours.seen.v2";

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
