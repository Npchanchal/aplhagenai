/** Lightweight blog metadata for SEO (main bundle). Full bodies live in blogPosts.ts. */
export type BlogMeta = {
  slug: string;
  title: string;
  description: string;
  published: string;
  updated?: string;
  tags: string[];
  readingMinutes: number;
};

export const BLOG_META: BlogMeta[] = [
  {
    "slug": "what-is-guidance-credibility-index",
    "title": "Guidance Credibility Index (GCI): Definition for Equity Research",
    "description": "What is a Guidance Credibility Index? How GCI scores management guidance vs actuals for Indian equity research — with evidence, not tips.",
    "published": "2026-03-03",
    "updated": "2026-08-22",
    "tags": [
      "GCI",
      "Guidance credibility"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "sentiment-vs-guidance-delivery",
    "title": "Sentiment Analysis vs Guidance Delivery: Why Desks Need Both Separately",
    "description": "Sentiment analysis tracks tone; guidance delivery tracks numbers. Why Indian equity desks should not mix them into one score.",
    "published": "2026-03-10",
    "updated": "2026-08-22",
    "tags": [
      "Sentiment",
      "GCI"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "reading-guidance-vs-actuals-india",
    "title": "How to Read Guidance vs Actuals in Indian Earnings Reports",
    "description": "Checklist for matching management guidance to NSE/BSE and IR actuals in Indian earnings — without inventing numbers.",
    "published": "2026-03-17",
    "updated": "2026-08-22",
    "tags": [
      "Indian earnings",
      "Guidance vs actuals"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "sensex-pilot-evidence-trail",
    "title": "Sensex Guidance Tracker: Building an Evidence Trail Desks Trust",
    "description": "Why a Sensex guidance tracker should prioritise hand-labeled evidence trails before claiming broad Nifty coverage.",
    "published": "2026-03-24",
    "updated": "2026-08-22",
    "tags": [
      "Sensex",
      "Evidence trail"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "gci-outcome-labels-explained",
    "title": "GCI Outcome Labels Explained: Met, Exceeded, Missed, Dropped, Pending",
    "description": "Definitions of Guidance Credibility Index outcome labels so Indian research desks cite guidance delivery consistently.",
    "published": "2026-03-31",
    "updated": "2026-08-22",
    "tags": [
      "GCI labels",
      "Glossary"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "point-in-time-gci-history",
    "title": "Point-in-Time GCI History for Quant and EM Research",
    "description": "Why point-in-time Guidance Credibility Index history matters for backtests and longitudinal management reviews.",
    "published": "2026-04-07",
    "updated": "2026-08-22",
    "tags": [
      "Point-in-time",
      "API"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "hand-labeled-vs-demo-data",
    "title": "Hand-Labeled vs Demo GCI Data: How to Cite Responsibly",
    "description": "When to cite hand-labeled Guidance Credibility Index rows versus demo data — quality badges for Indian equity notes.",
    "published": "2026-04-14",
    "updated": "2026-08-22",
    "tags": [
      "Data quality",
      "Compliance"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "buy-side-gci-workflow",
    "title": "Buy-Side GCI Workflow: Weekly Guidance Credibility Screening",
    "description": "A weekly buy-side workflow for screening Guidance Credibility Index moves on PMS and AIF coverage lists.",
    "published": "2026-04-21",
    "updated": "2026-08-22",
    "tags": [
      "Buy-side",
      "Workflow"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "sell-side-citing-guidance-delivery",
    "title": "Sell-Side Research: Citing Guidance Delivery Without Stock Tips",
    "description": "How sell-side associates add auditable guidance vs actuals tables to notes using CiteAlpha GCI — without tips.",
    "published": "2026-04-28",
    "updated": "2026-08-22",
    "tags": [
      "Sell-side",
      "Citations"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "concall-guidance-extraction-checklist",
    "title": "Earnings Concall Guidance Extraction: Analyst Checklist",
    "description": "Human-in-the-loop checklist for extracting management guidance from Indian earnings concalls before it enters GCI.",
    "published": "2026-05-05",
    "updated": "2026-08-22",
    "tags": [
      "Concalls",
      "HITL"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "nse-bse-ir-disclosure-formats",
    "title": "NSE BSE IR Disclosures: Finding Primary Sources for GCI",
    "description": "Where Indian management guidance and actuals live on NSE, BSE, and IR pages — and why local formats matter for GCI.",
    "published": "2026-05-12",
    "updated": "2026-08-22",
    "tags": [
      "NSE",
      "BSE",
      "IR"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "vernacular-research-notes-factual",
    "title": "Vernacular Equity Research Notes: Factual GCI Language Only",
    "description": "How multi-language guidance delivery blurbs stay useful for India distribution without becoming retail advice.",
    "published": "2026-05-19",
    "updated": "2026-08-22",
    "tags": [
      "Vernacular",
      "Compliance"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "peer-rank-sector-average-gci",
    "title": "GCI Peer Rank and Sector Average: Relative Context, Not Tips",
    "description": "How to use Guidance Credibility Index peer ranks and sector averages without treating ranks as trade lists.",
    "published": "2026-05-26",
    "updated": "2026-08-22",
    "tags": [
      "Peers",
      "Sector GCI"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "alerts-when-credibility-shifts",
    "title": "GCI Alerts: When Guidance Credibility Shifts on Your Watchlist",
    "description": "Design Δ-based Guidance Credibility Index alerts for new misses, drops, and label changes without alert fatigue.",
    "published": "2026-06-02",
    "updated": "2026-08-22",
    "tags": [
      "Alerts",
      "Watchlist"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "api-first-gci-for-quant-desks",
    "title": "GCI API for Quant Desks: PIT Series and Evidence Hooks",
    "description": "What quant and EM platforms should demand from a Guidance Credibility Index API: PIT history, coverage metadata, evidence.",
    "published": "2026-06-09",
    "updated": "2026-08-22",
    "tags": [
      "GCI API",
      "Enterprise"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "sebi-oriented-product-design",
    "title": "SEBI-Oriented Fintech Design: Research Tool vs Investment Advice",
    "description": "Why CiteAlpha ships Guidance Credibility Index as factual research tooling without retail recommendations.",
    "published": "2026-06-16",
    "updated": "2026-08-22",
    "tags": [
      "SEBI",
      "Product design"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "sensex-to-nifty-coverage-expansion",
    "title": "Sensex to Nifty GCI Coverage: Depth Before Breadth",
    "description": "How to expand Guidance Credibility Index coverage from Sensex to Nifty without thin, untrusted scores.",
    "published": "2026-06-23",
    "updated": "2026-08-22",
    "tags": [
      "Nifty",
      "Coverage"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "why-india-needs-local-guidance-tracker",
    "title": "Why India Needs a Local Management Guidance Tracker",
    "description": "Category whitespace: global guidance products vs Indian NSE/BSE disclosure reality — and CiteAlpha's local spine.",
    "published": "2026-06-30",
    "updated": "2026-08-22",
    "tags": [
      "India",
      "Market"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "desk-console-review-queue-hitl",
    "title": "Research Desk Console: HITL Review Queue for GCI Quality",
    "description": "How a research desk console turns concall extraction into accepted Guidance Credibility Index evidence.",
    "published": "2026-07-07",
    "updated": "2026-08-22",
    "tags": [
      "Desk",
      "HITL"
    ],
    "readingMinutes": 1
  },
  {
    "slug": "trust-center-checklist-institutional-buyers",
    "title": "Institutional Buyer Checklist: Trust Center for GCI Pilots",
    "description": "Security, legal, and claim-hygiene questions before piloting a Guidance Credibility Index product in India.",
    "published": "2026-07-14",
    "updated": "2026-08-22",
    "tags": [
      "Trust Center",
      "Enterprise"
    ],
    "readingMinutes": 1
  }
];

export function listBlogMeta(): BlogMeta[] {
  return [...BLOG_META].sort((a, b) => (a.published < b.published ? 1 : -1));
}

export function getBlogMeta(slug: string): BlogMeta | undefined {
  return BLOG_META.find((p) => p.slug === slug);
}
