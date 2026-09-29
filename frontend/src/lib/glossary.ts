export type GlossaryTerm = {
  id: string;
  term: string;
  tip: string;
};

/** Shared vocabulary — Help page + inline InfoTip tooltips. */
export const GLOSSARY: Record<string, GlossaryTerm> = {
  gci: {
    id: "gci",
    term: "GCI (Guidance Credibility Index)",
    tip: "0–100 score of how reliably management delivers quantified guidance. Built from evidence rows (band → actual → label). Not a buy/sell recommendation.",
  },
  tracker: {
    id: "tracker",
    term: "GCI Screener",
    tip: "Universe screen for Sensex names: GCI level, Δ GCI (YoY/QoQ/PoP), quality badge, peers, and alerts. Open a name for the evidence dossier and charts.",
  },
  desk_sku: {
    id: "desk_sku",
    term: "Analyst Workbench (review & export workspace)",
    tip: "Review workspace for pilot and paid desks: approve extracted guidance, check evidence, export point-in-time data, and build reports. Requires a pilot or paid seat.",
  },
  research_terminal: {
    id: "research_terminal",
    term: "Filing Search",
    tip: "One company at a time: search its filings and transcripts, ask cite-only questions, and see a snapshot of guidance vs reported numbers. Complements GCI. Not a price feed.",
  },
  guidance: {
    id: "guidance",
    term: "Guidance",
    tip: "A forward-looking quantified promise from management for a metric and period (e.g. FY25 revenue growth 8–10%).",
  },
  actual: {
    id: "actual",
    term: "Actual",
    tip: "The reported result for that same metric and period — used to judge whether guidance was delivered.",
  },
  band: {
    id: "band",
    term: "Band (guided low–high)",
    tip: "The range management guided to. Landing inside the band (small tolerance) counts as met.",
  },
  evidence: {
    id: "evidence",
    term: "Evidence trail",
    tip: "Auditable table: period, metric, band, actual, Δ Actual, label, vs-guide delta, and source. Prefer Hand-labeled names when citing.",
  },
  thread: {
    id: "thread",
    term: "Promise thread",
    tip: "Restatement history of one guidance commitment: first stated, then raised / lowered / reiterated across calls, until it resolves (met / missed / exceeded / dropped). Quiet walk-backs show up here.",
  },
  met: {
    id: "met",
    term: "Met",
    tip: "Actual landed in (or near) the guided band. Full contribution (~100 before confidence).",
  },
  exceeded: {
    id: "exceeded",
    term: "Exceeded",
    tip: "Actual beat above the band. Default scorer v4: a small beat scores close to 100; a beat far above the band still means the guidance was off, so points decay with distance but never below 60. A miss the same distance below always scores lower (γ=1.4). v3 let beats decay toward 0; legacy v2 floors beats ≥85.",
  },
  missed: {
    id: "missed",
    term: "Missed",
    tip: "Actual below the band. Score decays with shortfall; large misses can go to 0.",
  },
  dropped: {
    id: "dropped",
    term: "Dropped",
    tip: "Management stopped reiterating guidance. Default scorer v4 (as in v3) excludes the row from the average and applies a company −15 withdrawal deduction. Legacy v2 scored dropped ≈35. Distinct from a miss.",
  },
  pending: {
    id: "pending",
    term: "Pending",
    tip: "Period still open or no actual yet. Excluded from company GCI until closed.",
  },
  pending_guidance_cite: {
    id: "pending_guidance_cite",
    term: "Pending guidance cite",
    tip: "The reported actual is cited, but the original guidance filing (URL, quote, date) is not yet on the row. Excluded from the company GCI until both sides are cited.",
  },
  confidence: {
    id: "confidence",
    term: "Confidence",
    tip: "Extraction/match certainty (0.5–1.0). Lower confidence pulls the outcome score toward 50.",
  },
  delta: {
    id: "delta",
    term: "Delta % (vs guide)",
    tip: "Relative gap between actual and guided midpoint (or band edge) for that outcome.",
  },
  contribution: {
    id: "contribution",
    term: "Contribution score",
    tip: "That outcome’s 0–100 score after label rules and confidence. Company GCI averages these.",
  },
  peer_rank: {
    id: "peer_rank",
    term: "Peer rank",
    tip: "Rank of this company’s GCI among Sensex peers in the same sector (1 = best).",
  },
  sector_avg: {
    id: "sector_avg",
    term: "Sector avg",
    tip: "Average of company GCI scores in the sector. Each company is scored on its own guidance. The average is not a sector adjustment.",
  },
  trend: {
    id: "trend",
    term: "GCI trend",
    tip: "Period-by-period company GCI with a line chart — shows credibility improving or eroding. Read level and Δ together.",
  },
  change_trend: {
    id: "change_trend",
    term: "MoM / QoQ / YoY change",
    tip: "Incremental % vs the prior comparable period. On desks, change trends usually matter more than absolute levels alone.",
  },
  pit: {
    id: "pit",
    term: "PIT history",
    tip: "Point-in-time GCI as of past dates for backtests — no look-ahead. Shown as a table and path chart with Δ vs prior.",
  },
  alerts: {
    id: "alerts",
    term: "Alerts",
    tip: "Flagged events such as repeated misses or dropped guidance that need analyst attention.",
  },
  data_quality: {
    id: "data_quality",
    term: "Data quality",
    tip: "Hand-labeled = analyst-reviewed guidance with filing links; the only rows that carry a GCI. Demo = sample data for walkthroughs, not scored. Listing = NSE/BSE master, not yet scored.",
  },
  listing_master: {
    id: "listing_master",
    term: "NSE / BSE listing",
    tip: "Real exchange equity master row. GCI stays blank until guidance vs actuals are labeled — we never invent actuals.",
  },
  nse_bse: {
    id: "nse_bse",
    term: "NSE_ALL / BSE_ALL",
    tip: "Full India equity masters for navigation. Only hand-labeled companies carry a GCI; every other listing shows Not yet scored until an analyst reviews its guidance.",
  },
  listing_provisional: {
    id: "listing_provisional",
    term: "Not yet scored",
    tip: "Listed company without analyst-reviewed guidance and cited filings. No GCI is shown until that review is done.",
  },
  source: {
    id: "source",
    term: "Source",
    tip: "Where the guidance came from (transcript, filing, IR) so every outcome stays auditable.",
  },
  source_policy: {
    id: "source_policy",
    term: "Source policy",
    tip: "GCI uses text: transcripts, filings, IR, PPT text, ASR→transcript, reported actuals. Raw audio/video, technicals, and shenanigans do not score GCI.",
  },
  review: {
    id: "review",
    term: "Review",
    tip: "Analyst Accept keeps the outcome; Reject marks it for exclusion/follow-up.",
  },
  extract: {
    id: "extract",
    term: "Extract",
    tip: "Pulls candidate guidance statements from transcript text into a needs-review queue before they enter GCI.",
  },
  sentiment: {
    id: "sentiment",
    term: "Wordmap (context)",
    tip: "Entity vs industry tone themes for context only. Not part of GCI math.",
  },
  label: {
    id: "label",
    term: "Label",
    tip: "Outcome class: met, exceeded, missed, dropped, or pending.",
  },
  metric: {
    id: "metric",
    term: "Metric",
    tip: "Catalog name for the guided measure (for example revenue growth). Unknown metrics are rejected on import.",
  },
  gci_parameter: {
    id: "gci_parameter",
    term: "GCI parameter",
    tip: "A catalog metric management quantified for a period (~16 core + sector). Only these enter GCI — see Desk → Parameters charts.",
  },
  period: {
    id: "period",
    term: "Period",
    tip: "Fiscal window the guidance applies to (e.g. FY24, Q2FY25).",
  },
  alphahunter: {
    id: "alphahunter",
    term: "Facts import",
    tip: "Paste catalog-aligned facts JSON and merge into a company trail. Not a live vendor connector.",
  },
  labeling_queue: {
    id: "labeling_queue",
    term: "Labeling priority queue",
    tip: "Enterprise backlog for hand-label priority. Queues a company for analyst labeling — does not invent actuals.",
  },
  one_stop: {
    id: "one_stop",
    term: "Enterprise platform",
    tip: "Single contract for GCI Screener + evidence + API + facts import + Wordmap + vernacular + customer success. Guidance accountability only — keep your market terminal for prices.",
  },
  csm: {
    id: "csm",
    term: "Customer success",
    tip: "Named customer-success contact and quarterly reviews — included on Enterprise. The Workbench shows your pilot organisation.",
  },
  charts: {
    id: "charts",
    term: "Charts",
    tip: "Line, bar, and donut visuals for GCI path, metric Δ, parameter usage, and Wordmap. Levels stay in tables; charts highlight change.",
  },
  language_selector: {
    id: "language_selector",
    term: "Language selector",
    tip: "Header control for UI chrome (Indian + global languages). Persists to localStorage and account preferences when logged in. Does not change GCI math. Glossary remains EN for now.",
  },
  guest: {
    id: "guest",
    term: "Guest session",
    tip: "One-click ephemeral identity with preferences. Register to sync language, market, index, and watchlist across devices. Auth does not imply investment-advice entitlement.",
  },
  market: {
    id: "market",
    term: "Market",
    tip: "Exchange region (IN, US, JP, …). India remains the deep GCI path; other markets ship index constituent lists with honest quality badges.",
  },
  index: {
    id: "index",
    term: "Index",
    tip: "Flagship benchmark within a market (e.g. SENSEX, Nifty 50, S&P 500). Filters the universe table. Full GCI labeling is India-first.",
  },
  tier1: {
    id: "tier1",
    term: "Tier 1 foundation",
    tip: "Ingest → structure → search → cite. Auto IR corpus, period doc types (transcript/results/IR), and citeable citation ids. Without this, analytics stay experimental.",
  },
  citability: {
    id: "citability",
    term: "Citeable",
    tip: "Hand-labeled outcome with source URL + quote (+ bound doc). Provisional/demo scores are never citeable — reports exclude them.",
  },
  granger: {
    id: "granger",
    term: "Granger precedence",
    tip: "LASSO variable selection then Granger F-test on PIT series (≥12 quarters). Predictive precedence ≠ causation; not a forecast or investment advice.",
  },
  corpus_status: {
    id: "corpus_status",
    term: "Corpus status",
    tip: "gci_citeable = hand-labeled with sources; gci_available = scored/docs present; listed_not_in_corpus = exchange listing only.",
  },
  sights: {
    id: "sights",
    term: "Disclosure Explorer",
    tip: "Compare disclosures across Indian companies: search, cite-only Ask, boards, compare grid, and desk agents over public IR and labeled evidence. Complements GCI — not a price terminal.",
  },
  score_sku: {
    id: "score_sku",
    term: "CiteAlpha Score",
    tip: "GCI 0–100 plus peer delivery benchmarks. The brand wedge — management promises vs delivery.",
  },
  radar: {
    id: "radar",
    term: "CiteAlpha Radar",
    tip: "Feed of guidance changes, misses, drops, and withdrawals — for PMs, risk, and IR-watch. Not a news ticker.",
  },
  ledger: {
    id: "ledger",
    term: "CiteAlpha Ledger",
    tip: "Promise ledger: what was committed, by whom, when, and status. For compliance, credit, IR, and board packs.",
  },
  data_sku: {
    id: "data_sku",
    term: "CiteAlpha Data",
    tip: "Point-in-time guidance-outcome dataset and factor export. Backtestable series — no look-ahead.",
  },
  rankings: {
    id: "rankings",
    term: "Public Snapshot",
    tip: "Public, no-login snapshot of citeable GCI names. Evidence-linked scores, not recommendations.",
  },
  trust_center: {
    id: "trust_center",
    term: "Trust Center",
    tip: "Public security, legal, and citation posture for procurement. Honest runtime flags — not marketing claims.",
  },
};

export const HELP_SECTIONS: { title: string; ids: string[] }[] = [
  {
    title: "Where to work",
    ids: [
      "tracker",
      "desk_sku",
      "research_terminal",
      "sights",
      "score_sku",
      "radar",
      "ledger",
      "data_sku",
      "rankings",
      "one_stop",
      "trust_center",
      "tier1",
    ],
  },
  {
    title: "Language, identity & markets",
    ids: ["language_selector", "guest", "market", "index"],
  },
  {
    title: "Core ideas",
    ids: [
      "gci",
      "guidance",
      "actual",
      "band",
      "evidence",
      "citability",
      "corpus_status",
      "thread",
      "gci_parameter",
      "source_policy",
    ],
  },
  {
    title: "Outcome labels",
    ids: ["met", "exceeded", "missed", "dropped", "pending", "pending_guidance_cite"],
  },
  {
    title: "How the score is built",
    ids: ["confidence", "delta", "contribution", "metric", "period"],
  },
  {
    title: "Change trends & history",
    ids: ["change_trend", "trend", "pit", "charts", "granger"],
  },
  {
    title: "Workbench fields",
    ids: [
      "peer_rank",
      "sector_avg",
      "alerts",
      "data_quality",
      "listing_master",
      "nse_bse",
      "source",
      "review",
      "extract",
      "sentiment",
      "alphahunter",
      "labeling_queue",
      "csm",
      "label",
    ],
  },
];

export function tipForLabel(label: string): string {
  const key = label.toLowerCase();
  return GLOSSARY[key]?.tip ?? GLOSSARY.label.tip;
}

export function formatOutcomeLabel(label: string): string {
  const key = label.toLowerCase();
  return GLOSSARY[key]?.term ?? label.replace(/_/g, " ");
}

export function tipText(termId: string): string {
  return GLOSSARY[termId]?.tip ?? "";
}
