export type BlogSection = {
  heading?: string;
  paragraphs: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  published: string;
  updated?: string;
  tags: string[];
  readingMinutes: number;
  sections: BlogSection[];
};

/** Public research blog — ~150 words, SEO-focused, SEBI-safe; no Buy/Hold/Sell tips. */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "what-is-guidance-credibility-index",
    title: "Guidance Credibility Index (GCI): Definition for Equity Research",
    description:
      "What is a Guidance Credibility Index? How GCI scores management guidance vs actuals for Indian equity research — with evidence, not tips.",
    published: "2026-03-03",
    updated: "2026-08-22",
    tags: ["GCI", "Guidance credibility"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "A Guidance Credibility Index (GCI) measures whether listed-company management delivered on quantified guidance — revenue bands, margin targets, volume outlooks, or capex ranges — against later reported actuals. Unlike sentiment dashboards that score language, GCI answers a delivery question analysts can reopen: what was guided, what was reported, and how the two compare with primary sources attached.",
        ],
      },
      {
        heading: "What makes a GCI score citeable",
        paragraphs: [
          "Each citeable GCI point needs a dated guidance statement, a matched actual for the same metric and period, an outcome label (met, exceeded, missed, dropped, or pending), and a path back to NSE, BSE, or IR documents. Without that evidence trail, a headline score is not research-grade for institutional Indian equity work or committee review.",
          "CiteAlpha publishes a 0–100 company GCI with that trail in Tracker and dossier views. The index sits beside market terminals; it does not replace prices or consensus. Ocotillo Innovation Private Limited ships GCI as factual research infrastructure — never personalised investment advice or retail stock tips.",
        ],
      },
    ],
  },
  {
    slug: "sentiment-vs-guidance-delivery",
    title: "Sentiment Analysis vs Guidance Delivery: Why Desks Need Both Separately",
    description:
      "Sentiment analysis tracks tone; guidance delivery tracks numbers. Why Indian equity desks should not mix them into one score.",
    published: "2026-03-10",
    updated: "2026-08-22",
    tags: ["Sentiment", "GCI"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "Equity sentiment analysis captures tone, media framing, and narrative shifts around earnings events. It does not answer whether management delivered the number they guided to the market. A warm concall can precede a miss; cautious language can precede an exceed. Delivery is a disclosure question; sentiment is a language question — and conflating them weakens Indian equity memos.",
        ],
      },
      {
        heading: "Keep GCI and sentiment in separate lines",
        paragraphs: [
          "Mixing tone into a management credibility claim creates false confidence in IC packs and client notes. Use sentiment for narrative context only. Use a Guidance Credibility Index for multi-quarter guidance versus actuals history that portfolio managers and auditors can reopen from primary filings.",
          "CiteAlpha stays on the delivery side so every GCI claim stays auditable. If a note needs both signals, keep separate paragraphs and separate sources. Desks that maintain the split write clearer research and avoid implying that positive language equals reliable guidance delivery.",
        ],
      },
    ],
  },
  {
    slug: "reading-guidance-vs-actuals-india",
    title: "How to Read Guidance vs Actuals in Indian Earnings Reports",
    description:
      "Checklist for matching management guidance to NSE/BSE and IR actuals in Indian earnings — without inventing numbers.",
    published: "2026-03-17",
    updated: "2026-08-22",
    tags: ["Indian earnings", "Guidance vs actuals"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "Indian earnings research spans IR decks, NSE and BSE filings, and mixed-language concalls. Management guidance may appear as ranges, floors, or full-year targets restated mid-quarter. Before scoring guidance versus actuals, lock metric definition and period — consolidated versus standalone, INR versus USD, quarter versus fiscal year.",
        ],
      },
      {
        heading: "Five-step guidance matching checklist",
        paragraphs: [
          "Quote the guidance with date and document. Find the first clean actual for the same metric and period. Note restatements or dropped guidance. Label the outcome. Never invent actuals when a disclosure is missing — store the citation so a second analyst can reproduce the judgment from primary sources alone without relying on secondary summaries.",
          "CiteAlpha's extract-and-review loop lets machines propose candidates while humans Accept, Edit, or Reject before anything enters GCI math for Indian listed names. That human gate protects research quality at the source and keeps guidance-versus-actual tables defensible under desk scrutiny and research committee challenge.",
        ],
      },
    ],
  },
  {
    slug: "sensex-pilot-evidence-trail",
    title: "Sensex Guidance Tracker: Building an Evidence Trail Desks Trust",
    description:
      "Why a Sensex guidance tracker should prioritise hand-labeled evidence trails before claiming broad Nifty coverage.",
    published: "2026-03-24",
    updated: "2026-08-22",
    tags: ["Sensex", "Evidence trail"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "Institutional buyers rarely need thin scores across thousands of tickers on day one. They need a Sensex-depth guidance tracker where every GCI point can be defended in a research committee. CiteAlpha beachheads India with labeled Sensex outcomes first, then expands as review capacity and primary-source coverage allow.",
        ],
      },
      {
        heading: "What an evidence trail must include",
        paragraphs: [
          "An evidence trail must include period, metric, guided band, actual, outcome label, source document, and citation id. If any piece is missing, the score is not ready for external citation — regardless of how polished the Tracker dashboard looks to first-time users evaluating a management guidance product.",
          "Demo-structured rows train product flows; hand-labeled IR-backed rows are what you cite in notes. Prefer quality badges over vanity ticker counts when evaluating guidance credibility tooling for Indian equities. Sensex depth with citations beats shallow Nifty breadth every time for institutional adoption and vendor due diligence.",
        ],
      },
    ],
  },
  {
    slug: "gci-outcome-labels-explained",
    title: "GCI Outcome Labels Explained: Met, Exceeded, Missed, Dropped, Pending",
    description:
      "Definitions of Guidance Credibility Index outcome labels so Indian research desks cite guidance delivery consistently.",
    published: "2026-03-31",
    updated: "2026-08-22",
    tags: ["GCI labels", "Glossary"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "Shared GCI outcome labels keep guidance delivery notes consistent across analysts on the same coverage list. Without them, one desk calls a soft beat a miss while another treats a restatement as a hit. Labels classify facts for Indian equity research — they are not stock tips, price targets, or return forecasts of any kind.",
        ],
      },
      {
        heading: "Label definitions for guidance delivery",
        paragraphs: [
          "Met means the actual lands inside the guided band. Exceeded means the actual clears the favorable side of guidance. Missed means the actual falls short. Dropped means management withdrew a prior quantified guide. Pending means guidance exists but the matching actual is not yet linked in the corpus.",
          "CiteAlpha uses this vocabulary in Tracker and Desk so GCI rows stay comparable across coverage lists and through point-in-time history used in longitudinal management reviews. Shared labels make multi-analyst GCI coverage auditable and reduce ambiguity when teams hand off names mid-quarter.",
        ],
      },
    ],
  },
  {
    slug: "point-in-time-gci-history",
    title: "Point-in-Time GCI History for Quant and EM Research",
    description:
      "Why point-in-time Guidance Credibility Index history matters for backtests and longitudinal management reviews.",
    published: "2026-04-07",
    updated: "2026-08-22",
    tags: ["Point-in-time", "API"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "A live GCI that always reflects today's knowledge is useful for screening and dangerous for historical claims. Point-in-time (PIT) GCI freezes what was knowable as of a date — accepted statements, linked actuals, and standing labels — so research avoids look-ahead bias in models, backtests, and longitudinal management reviews.",
        ],
      },
      {
        heading: "PIT exports for platform buyers",
        paragraphs: [
          "Quant and emerging-market desks usually need PIT series, identifiers, and as-of timestamps — not only a mutable headline score that changes when late filings arrive. CiteAlpha's API path is built around that contract for guidance credibility data in notebooks, risk systems, and vendor due diligence reviews.",
          "When writing that management has chronically missed, cite the PIT window and evidence rows, not a screenshot of today's Tracker alone. That habit keeps longitudinal claims defensible under committee scrutiny, separates research-grade history from live-screen convenience, and prevents look-ahead bias in quant backtests and vendor model reviews.",
        ],
      },
    ],
  },
  {
    slug: "hand-labeled-vs-demo-data",
    title: "Hand-Labeled vs Demo GCI Data: How to Cite Responsibly",
    description:
      "When to cite hand-labeled Guidance Credibility Index rows versus demo data — quality badges for Indian equity notes.",
    published: "2026-04-14",
    updated: "2026-08-22",
    tags: ["Data quality", "Compliance"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "CiteAlpha quality badges exist so analysts do not over-claim coverage. Hand-labeled GCI rows are curated against IR pages and exchange filings. Demo-structured rows exercise product flows and should not appear as production evidence in client-facing Indian equity notes, pitch decks, or external research distribution.",
        ],
      },
      {
        heading: "Responsible citation rules for GCI",
        paragraphs: [
          "Show the badge, show the source, and prefer hand-labeled coverage when the memo leaves the building. Over-claiming labeled universe size is a commercial and compliance risk for any guidance credibility vendor selling into institutions that audit vendor claims during procurement and annual vendor reviews.",
          "Align pitch language with labeled cohort reality. Trust Center and customer compliance docs share the same posture: research tooling for management delivery history, not investment advice and not a tip sheet. Badge-first citation protects institutional research credibility, vendor trust, and the analyst's ability to defend every row in a published guidance table.",
        ],
      },
    ],
  },
  {
    slug: "buy-side-gci-workflow",
    title: "Buy-Side GCI Workflow: Weekly Guidance Credibility Screening",
    description:
      "A weekly buy-side workflow for screening Guidance Credibility Index moves on PMS and AIF coverage lists.",
    published: "2026-04-21",
    updated: "2026-08-22",
    tags: ["Buy-side", "Workflow"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "Buy-side, PMS, and AIF desks can use a Guidance Credibility Index as a weekly habit, not a tip sheet. Monday: scan Tracker for large score changes and new misses on the coverage list. Mid-week: open dossiers for IC names and pull evidence into the memo appendix. Friday: refresh watchlist alerts ahead of reporters.",
        ],
      },
      {
        heading: "What not to do with GCI on the buy side",
        paragraphs: [
          "Do not paste GCI into a client note as a recommendation. Do not hide quality badges when demo rows appear in a screen. Do not invent actuals when a link is pending — leave the outcome pending until the matching disclosure exists on the exchange or IR site.",
          "The standing research question is simple: what did management promise last time? Keep that question for Indian coverage lists while your market terminal remains the home for live prices and consensus. Habit beats one-off screens for buy-side GCI adoption across quarters.",
        ],
      },
    ],
  },
  {
    slug: "sell-side-citing-guidance-delivery",
    title: "Sell-Side Research: Citing Guidance Delivery Without Stock Tips",
    description:
      "How sell-side associates add auditable guidance vs actuals tables to notes using CiteAlpha GCI — without tips.",
    published: "2026-04-28",
    updated: "2026-08-22",
    tags: ["Sell-side", "Citations"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "Sell-side value from a Guidance Credibility Index is speed plus auditability: a table of guided versus actual with labels and source links for the note appendix. That strengthens initiation and update notes on Indian names without turning CiteAlpha into a recommendation engine or a substitute for firm analyst certification.",
        ],
      },
      {
        heading: "Use Desk review before you publish",
        paragraphs: [
          "Keep firm recommendation language inside your existing research-analyst framework. CiteAlpha provides no recommendation chrome and must not be paraphrased as such in published research distributed to clients or portals under SEBI research-analyst rules. Guidance delivery tables belong in the appendix, not the headline rating.",
          "When extraction looks wrong, use Desk Accept, Edit, or Reject so the corpus improves. Correcting a guidance band today prevents a false miss in tomorrow's GCI and protects the evidence trail your compliance team may audit later during research-analyst certification reviews. Citation quality is the sell-side edge CiteAlpha supports.",
        ],
      },
    ],
  },
  {
    slug: "concall-guidance-extraction-checklist",
    title: "Earnings Concall Guidance Extraction: Analyst Checklist",
    description:
      "Human-in-the-loop checklist for extracting management guidance from Indian earnings concalls before it enters GCI.",
    published: "2026-05-05",
    updated: "2026-08-22",
    tags: ["Concalls", "HITL"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "Automated earnings concall guidance extraction is good at proposing candidates near verbs like expect, guide, target, or maintain. Analysts remain accountable for context — jokes, historical references, sell-side questions, and non-company speakers common on Indian earnings calls, investor-relations days, and post-results media briefings.",
        ],
      },
      {
        heading: "Reject or edit guidance when context fails",
        paragraphs: [
          "Reject or edit when the speaker is not management, the number is an actual not a guide, units or period are wrong, or guidance was withdrawn in the same call. When unsure, Reject with a note — silent Accepts poison the Guidance Credibility Index and propagate errors into peer ranks.",
          "CiteAlpha Desk is built for this human-in-the-loop step so GCI math only sees accepted evidence from reviewed concall and filing extracts across your Indian coverage list. HITL review is mandatory before concall guidance enters scored history, peer ranks, or client-facing tables distributed outside the firm.",
        ],
      },
    ],
  },
  {
    slug: "nse-bse-ir-disclosure-formats",
    title: "NSE BSE IR Disclosures: Finding Primary Sources for GCI",
    description:
      "Where Indian management guidance and actuals live on NSE, BSE, and IR pages — and why local formats matter for GCI.",
    published: "2026-05-12",
    updated: "2026-08-22",
    tags: ["NSE", "BSE", "IR"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "US-centric guidance trackers assume SEC-shaped workflows. Indian guidance credibility work depends on NSE and BSE filings, company IR microsites, PDF decks, and transcript sources with uneven structure. A local spine stores those primaries so citations resolve to documents desks already trust for Indian listed names and audit requests.",
        ],
      },
      {
        heading: "Primary source rule of thumb for GCI",
        paragraphs: [
          "Prefer the earliest complete primary that states the management guidance, then the first subsequent primary that reports the actual. Secondary news is for discovery, not for the evidence row in a GCI used in institutional notes, model inputs subject to audit, or client-facing research appendices.",
          "CiteAlpha prioritises crawl and citation of Indian IR and exchange documents so GCI claims stay inspectable under desk scrutiny and research committee challenge. Local primary sources are the spine of Indian GCI evidence — not scraped headlines, unverified social posts, or third-party summaries without document links.",
        ],
      },
    ],
  },
  {
    slug: "vernacular-research-notes-factual",
    title: "Vernacular Equity Research Notes: Factual GCI Language Only",
    description:
      "How multi-language guidance delivery blurbs stay useful for India distribution without becoming retail advice.",
    published: "2026-05-19",
    updated: "2026-08-22",
    tags: ["Vernacular", "Compliance"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "India's research audience spans English and regional languages. Vernacular equity notes can summarise guidance delivery — what was guided, what was reported, which GCI label applied — if disclaimer language and data-quality limits travel with the copy every time it is shared across desks, partners, or distribution channels.",
        ],
      },
      {
        heading: "Translation must not invent recommendations",
        paragraphs: [
          "CiteAlpha vernacular templates stay factual. If the English source is pending or demo-quality, the vernacular output inherits that limitation without upgrading the claim. Never add recommendation wording in translation, and never imply expected returns from a GCI score, peer rank, or sector-average context line in any regional language output.",
          "Factual multi-language blurbs support distribution across Indian desks and partners. They are not a retail tip product and must not be marketed as investment advice under any language label. Consistent disclaimers across locales reduce regulatory ambiguity for cross-border research teams, vernacular distribution partners, and compliance reviewers.",
        ],
      },
    ],
  },
  {
    slug: "peer-rank-sector-average-gci",
    title: "GCI Peer Rank and Sector Average: Relative Context, Not Tips",
    description:
      "How to use Guidance Credibility Index peer ranks and sector averages without treating ranks as trade lists.",
    published: "2026-05-26",
    updated: "2026-08-22",
    tags: ["Peers", "Sector GCI"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "Absolute GCI answers how management delivered on guidance. Peer rank and sector average answer relative standing inside a defined cohort. Both are research context for Indian equity coverage — not a sorted list of trades, upgrades, or investment recommendations of any kind, and not a substitute for fundamental modeling.",
        ],
      },
      {
        heading: "Always disclose the GCI cohort",
        paragraphs: [
          "Always disclose whether the cohort is a Sensex pilot slice, a sector group, or a wider listing set, and note hand-labeled versus demo mix. A rank among demo-heavy names is not comparable to a hand-labeled peer set and should not appear in external memos without that caveat.",
          "CiteAlpha surfaces peer and sector context beside evidence so relative guidance credibility claims stay inspectable in Tracker and dossier views for institutional users. Disclose the cohort or peer-rank GCI misleads readers, undermines cross-vendor comparisons during vendor bake-offs, and weakens IC discussions on relative management quality.",
        ],
      },
    ],
  },
  {
    slug: "alerts-when-credibility-shifts",
    title: "GCI Alerts: When Guidance Credibility Shifts on Your Watchlist",
    description:
      "Design Δ-based Guidance Credibility Index alerts for new misses, drops, and label changes without alert fatigue.",
    published: "2026-06-02",
    updated: "2026-08-22",
    tags: ["Alerts", "Watchlist"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "Useful GCI alerts fire on material label changes, large score deltas, newly linked actuals that flip pending to missed or met, or dropped guidance on covered names. Noise alerts fire on every tiny extract edit and train desks to ignore the feed entirely — defeating the purpose of guidance credibility monitoring.",
        ],
      },
      {
        heading: "Start narrow, then expand GCI alerts",
        paragraphs: [
          "Start with watchlist names plus material events only. Expand cadence once the desk proves it will triage daily. GCI alerts should support research habit on Indian coverage lists — not inbox spam that competes with price alerts from your terminal or unrelated news wires.",
          "CiteAlpha watchlist and alert surfaces are built for that narrow-first approach so guidance credibility shifts get attention when they matter to the memo calendar. Narrow GCI alerts protect desk attention for real shifts that warrant dossier review before the next earnings cycle and before guidance tables go into client materials.",
        ],
      },
    ],
  },
  {
    slug: "api-first-gci-for-quant-desks",
    title: "GCI API for Quant Desks: PIT Series and Evidence Hooks",
    description:
      "What quant and EM platforms should demand from a Guidance Credibility Index API: PIT history, coverage metadata, evidence.",
    published: "2026-06-09",
    updated: "2026-08-22",
    tags: ["GCI API", "Enterprise"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "Quant and EM platforms rarely want an interactive-only guidance dashboard. They need a GCI API with series, identifiers, as-of timestamps, coverage metadata, and hooks to evidence for exception review. Treat quality flags as first-class fields, not footnotes buried in a PDF export, sales deck appendix, or static screenshot.",
        ],
      },
      {
        heading: "Enterprise evaluation checklist for a GCI API",
        paragraphs: [
          "Ask for point-in-time history, honest labeled versus demo counts, authentication model, and SLA language before wiring production feeds. CiteAlpha's commercial path includes Enterprise API and data license alongside analyst seats for Indian and EM workflows that need batch exports and exception review hooks.",
          "Evaluate the feed as research infrastructure for management guidance credibility — never as a signal marketed like a tip sheet or automated trading input sold to retail users. Demand PIT fields, quality badges, and evidence hooks before you integrate any GCI API into production models or client-facing dashboards.",
        ],
      },
    ],
  },
  {
    slug: "sebi-oriented-product-design",
    title: "SEBI-Oriented Fintech Design: Research Tool vs Investment Advice",
    description:
      "Why CiteAlpha ships Guidance Credibility Index as factual research tooling without retail recommendations.",
    published: "2026-06-16",
    updated: "2026-08-22",
    tags: ["SEBI", "Product design"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "Indian market products that blur into personalised investment advice face a different regulatory posture than factual research tools. CiteAlpha is designed as evidence-linked research infrastructure for professional equity workflows — a Guidance Credibility Index with citations, not tips, price targets, return forecasts, or personalised portfolio suggestions.",
        ],
      },
      {
        heading: "How SEBI-oriented design shows in the product",
        paragraphs: [
          "That choice shows up as no recommendation UI, persistent disclaimers on GCI surfaces, honest quality badges, and marketing that describes management delivery history rather than outperformance versus Sensex or Nifty indices. Product copy, API field names, and alert text all follow the same factual posture.",
          "Institutional buyers should ask vendors where advice begins. If a credibility score is sold as a trade signal, demand the research-analyst framework behind it — or walk away from the pilot conversation. Research-versus-advice clarity is a product requirement in India, not a footnote on a landing page.",
        ],
      },
    ],
  },
  {
    slug: "sensex-to-nifty-coverage-expansion",
    title: "Sensex to Nifty GCI Coverage: Depth Before Breadth",
    description:
      "How to expand Guidance Credibility Index coverage from Sensex to Nifty without thin, untrusted scores.",
    published: "2026-06-23",
    updated: "2026-08-22",
    tags: ["Nifty", "Coverage"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "Moving a management guidance tracker from Sensex toward Nifty 500 only helps if extraction quality, human review capacity, and actuals matching keep pace. Thin GCI scores on hundreds of names destroy trust faster than a smaller labeled set ever will — especially when desks cite scores in external research.",
        ],
      },
      {
        heading: "India-first depth, then Nifty breadth",
        paragraphs: [
          "CiteAlpha's path is labeled India depth first, then breadth, with API export later — not a US-first rebuild with India bolted on. Coverage claims in sales decks should track hand-labeled reality, not ticker-count vanity metrics on a slide promising instant universe coverage without review capacity behind it.",
          "Desks evaluating vendors should ask for labeled statement counts by universe and evidence samples, not only total tickers on a coverage map. Labeling capacity should gate every Nifty coverage claim before procurement teams sign a multi-year data contract or cite scores in external research.",
        ],
      },
    ],
  },
  {
    slug: "why-india-needs-local-guidance-tracker",
    title: "Why India Needs a Local Management Guidance Tracker",
    description:
      "Category whitespace: global guidance products vs Indian NSE/BSE disclosure reality — and CiteAlpha's local spine.",
    published: "2026-06-30",
    updated: "2026-08-22",
    tags: ["India", "Market"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "Global guidance trackers prove that management accountability is a real research job. India's disclosure formats, languages, and IR practices are not a copy-paste of SEC workflows. A local management guidance tracker needs native ingest and labeling playbooks for Indian metrics, exchange filings, and concall conventions.",
        ],
      },
      {
        heading: "What a local GCI spine must include",
        paragraphs: [
          "A local spine means NSE- and BSE-aware document storage, concall extraction with human review, and go-to-market that speaks first to PMS, AIF, sell-side, and India-focused EM desks. CiteAlpha builds the Guidance Credibility Index on that spine rather than importing US-shaped schemas and relabeling them for Nifty names.",
          "API export to global platforms can follow. Rebuilding US-first and localising India later usually fails the evidence and citation test desks care about most when they buy research data. Local spine first is how India guidance tracking actually works in production — not as a late localisation pass.",
        ],
      },
    ],
  },
  {
    slug: "desk-console-review-queue-hitl",
    title: "Research Desk Console: HITL Review Queue for GCI Quality",
    description:
      "How a research desk console turns concall extraction into accepted Guidance Credibility Index evidence.",
    published: "2026-07-07",
    updated: "2026-08-22",
    tags: ["Desk", "HITL"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "A research desk console is the operational heart for teams that own GCI data quality: review queue, corpus, reports, and API or point-in-time surfaces in one place. Human-in-the-loop is how institutional guidance corpora compound — not a temporary launch crutch to be removed once automation matures.",
        ],
      },
      {
        heading: "Accept, Edit, Reject as the GCI quality loop",
        paragraphs: [
          "Every Accept, Edit, or Reject teaches the next extract cycle and protects GCI from silent false misses. CiteAlpha Desk is built for that loop on Indian coverage workflows spanning filings, IR decks, and earnings concalls reviewed by analysts accountable for outcomes and audit trails.",
          "If your vendor hides review behind a black-box score, ask how corrections enter the historical series and whether point-in-time exports reflect those corrections for audit and model use. Review queues turn extraction noise into trusted GCI history desks can cite with confidence in notes and compliance reviews.",
        ],
      },
    ],
  },
  {
    slug: "trust-center-checklist-institutional-buyers",
    title: "Institutional Buyer Checklist: Trust Center for GCI Pilots",
    description:
      "Security, legal, and claim-hygiene questions before piloting a Guidance Credibility Index product in India.",
    published: "2026-07-14",
    updated: "2026-08-22",
    tags: ["Trust Center", "Enterprise"],
    readingMinutes: 1,
    sections: [
      {
        paragraphs: [
          "Before a GCI pilot, confirm legal entity, terms and privacy versions, data posture, authentication options including SSO where offered, audit expectations, and how demo versus production data is segregated in the UI for your firm. Procurement teams should treat guidance data like any other research vendor feed subject to annual review.",
        ],
      },
      {
        heading: "Next step for CiteAlpha pilot buyers",
        paragraphs: [
          "Ask for labeled coverage counts, SLA language, and an explicit not-investment-advice statement. Open the Trust Center and Package pages on citealpha.com, or email sales@citealpha.com for a time-boxed pilot with your coverage list, compliance questionnaire, and security review checklist attached.",
          "CiteAlpha is a product of Ocotillo Innovation Private Limited — factual GCI research tooling for Indian equity desks, not investment advice and not a retail tip product sold as trade signals. Run the Trust Center checklist before any paid GCI rollout, external citation in client materials, or firm-wide API integration.",
        ],
      },
    ],
  },
];

export function listBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => (a.published < b.published ? 1 : -1));
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
