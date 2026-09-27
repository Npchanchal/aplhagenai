import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import InfoTip from "../components/InfoTip";

const SHOT = "/screenshots/tiers";
/** Bump when recapturing: /screenshots is cached 30 days under unchanged file names. */
const SHOT_VERSION = "2026-09-27";
const shotSrc = (src: string) => `${src}?v=${SHOT_VERSION}`;

type StatusRow = { label: string; status: string };

type Feature = {
  id: string;
  ask: string;
  title: string;
  body: string;
  images: { src: string; alt: string }[];
  rows?: StatusRow[];
};

type Tier = {
  id: string;
  kicker: string;
  title: string;
  tip?: string;
  intro: string;
  features: Feature[];
};

const TIERS: Tier[] = [
  {
    id: "tier1",
    kicker: "Must work first",
    title: "Tier 1 — Foundation",
    tip: "tier1",
    intro:
      "If this layer is weak, nothing downstream is trustworthy: automatic ingest → structure preserved → entity searchable → every GCI cell citable.",
    features: [
      {
        id: "ask-1",
        ask: "#1",
        title: "Entity search across covered exchanges",
        body: "Search returns covered NSE/BSE entities with GCI when present, plus doc / citeable facets — not score-only shells.",
        images: [{ src: `${SHOT}/01-entity-search.png`, alt: "Entity search for INFY with facets" }],
        rows: [
          { label: "Typeahead across India universe", status: "Live" },
          { label: "Facets: exchange · quality · corpus", status: "Live" },
          { label: "Docs + citeable counts on deep names", status: "Live" },
        ],
      },
      {
        id: "ask-4-5",
        ask: "#4 / #5",
        title: "Real document ingestion (automatic)",
        body: "Primary path is scheduled live IR refresh → pending docs → extract queue → Accept before GCI. Paste transcript is the exception path.",
        images: [
          { src: `${SHOT}/05-auto-ingest-crawl.png`, alt: "Desk Review live IR refresh" },
          { src: `${SHOT}/05b-corpus-foundation.png`, alt: "Desk Corpus foundation panel" },
          { src: `${SHOT}/04-period-documents.png`, alt: "Dossier period document matrix" },
        ],
        rows: [
          { label: "Live IR refresh every 6h", status: "Live" },
          { label: "Period matrix: transcript · results · IR", status: "Live (Sensex HL)" },
          { label: "Tier 1 gate (≥95% citeable + types)", status: "Live" },
          { label: "Paste ingest", status: "Exception only" },
        ],
      },
      {
        id: "ask-6",
        ask: "#6",
        title: "Citability — every output traceable to source",
        body: "Each score-contributing outcome binds to citation_id, source doc, quote span, and Open source. Reports refuse provisional rows.",
        images: [
          { src: `${SHOT}/06-citability-evidence.png`, alt: "Evidence trail with citation IDs and quotes" },
        ],
        rows: [
          { label: "cite_* id + Open source + quote span", status: "Live on hand_labeled" },
          { label: "Accept / Edit / Reject HITL", status: "Live" },
          { label: "Reports: citeable only + appendix", status: "Live" },
        ],
      },
    ],
  },
  {
    id: "tier2",
    kicker: "After Tier 1 is honest",
    title: "Tier 2 — Workflow enrichment",
    intro: "Differentiated desk surfaces that sit on a citeable corpus and PIT series.",
    features: [
      {
        id: "ask-2",
        ask: "#2",
        title: "Multi-horizon deltas (WoW / MoM / QoQ / YoY)",
        body: "Deltas where PIT / period series exist. Missing horizons show “—” — never invented zeros. INFY surface currently emphasizes QoQ / YoY.",
        images: [
          { src: `${SHOT}/02-multi-horizon-deltas.png`, alt: "GCI score with QoQ and YoY deltas" },
          { src: `${SHOT}/02b-horizon-bars.png`, alt: "Delta horizon bars" },
        ],
      },
      {
        id: "ask-3",
        ask: "#3",
        title: "Delta visualization in charts",
        body: "Historical GCI trend and period YoY on the dossier Trend panel. Charts are historical only — no forecast cones.",
        images: [{ src: `${SHOT}/03-delta-charts-trend.png`, alt: "GCI trend chart with YoY" }],
      },
      {
        id: "ask-7",
        ask: "#7",
        title: "GCI vs stock-price correlation graphics",
        body: "Descriptive pattern only. Dual series with disclosed N / window. Not a forecast, not causation, not a trading signal.",
        images: [{ src: `${SHOT}/07-gci-vs-price.png`, alt: "GCI versus stock tape overlay" }],
        rows: [
          { label: "Observed co-movement + N", status: "Yes" },
          { label: "Extrapolate / predicted GCI", status: "No" },
          { label: "In-panel factual disclaimer", status: "Yes" },
        ],
      },
      {
        id: "ask-10",
        ask: "#10",
        title: "Private analyst notes (user-restricted)",
        body: "Notes scoped to API key / session — not org-shared by default.",
        images: [{ src: `${SHOT}/10-private-notes.png`, alt: "Private analyst notes panel" }],
      },
      {
        id: "ask-11",
        ask: "#11",
        title: "Role / function-specific report templates",
        body: "Templates emit Markdown with citeable outcomes only plus a citation appendix.",
        images: [
          { src: `${SHOT}/11-report-templates-desk.png`, alt: "Desk role report templates" },
          { src: `${SHOT}/11-report-templates-dossier.png`, alt: "Dossier generate analyst report" },
        ],
      },
    ],
  },
  {
    id: "tier3",
    kicker: "High value · methodological risk",
    title: "Tier 3 — Frontier research",
    tip: "granger",
    intro:
      "UI is EXPERIMENTAL. Engine: LASSO → Granger F-test on PIT warehouse (≥12 quarters). VAR held until ≥24. Still descriptive precedence — not causation.",
    features: [
      {
        id: "ask-8",
        ask: "#8",
        title: "Lead / lag factor analysis",
        body: "Dependent = GCI; independents = metrics & price tape. LASSO selects candidates; Granger reports F, p, best lag.",
        images: [{ src: `${SHOT}/08-lead-lag-granger.png`, alt: "Granger lead-lag analytics panel" }],
      },
      {
        id: "ask-9",
        ask: "#9",
        title: "Impact factor mapping",
        body: "Directed edges only where Granger passes FDR control. Empty map when no significant edges (as on INFY in this capture).",
        images: [{ src: `${SHOT}/09-impact-map.png`, alt: "Analytics impact / lag surface" }],
      },
    ],
  },
];

const METHODS = [
  {
    n: "1",
    name: "Cross-Correlation Function (CCF)",
    role: "Correlation at different lags. Cheap and interpretable; can invent lag peaks via autocorrelation.",
    stance: "Shipped as aid under Granger rows — not the causal claim.",
  },
  {
    n: "2",
    name: "Granger causality",
    role: "Does X’s past improve Y beyond Y’s own past? Recognizable to institutional analysts; needs stationarity.",
    stance: "Tier 3 v1 — shipped (LASSO → F-test, N gate, experimental badge).",
  },
  {
    n: "3",
    name: "VAR / VECM",
    role: "Joint multi-series dynamics for richer impact maps. Needs longer aligned series.",
    stance: "Held until ≥24 quarters per entity.",
  },
  {
    n: "4",
    name: "LASSO / Elastic Net",
    role: "Variable selection — shrink irrelevant candidates before Granger/VAR.",
    stance: "Shipped as the front step of Granger v1.",
  },
  {
    n: "5",
    name: "Transfer entropy",
    role: "Model-free directional information flow; opaque and data-hungry.",
    stance: "Out of scope near-term.",
  },
  {
    n: "6",
    name: "Causal graphical models (PC / DAG)",
    role: "Infer a full impact network. Brittle assumptions; wrong arrows destroy trust.",
    stance: "Out of scope near-term.",
  },
] as const;

function FeatureBlock({ feature }: { feature: Feature }) {
  return (
    <article className="tier-feature" id={feature.id} data-testid={`tier-feature-${feature.id}`}>
      <header className="tier-feature-head">
        <span className="tier-ask">{feature.ask}</span>
        <h3>{feature.title}</h3>
      </header>
      <p className="muted">{feature.body}</p>
      <div className={`tier-shots ${feature.images.length > 1 ? "multi" : ""}`}>
        {feature.images.map((img) => (
          <figure key={img.src} className="tier-shot">
            <a href={shotSrc(img.src)} target="_blank" rel="noreferrer">
              <img src={shotSrc(img.src)} alt={img.alt} loading="lazy" />
            </a>
            <figcaption>{img.alt}</figcaption>
          </figure>
        ))}
      </div>
      {feature.rows && feature.rows.length > 0 && (
        <table className="table tier-status-table">
          <thead>
            <tr>
              <th>What you see</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {feature.rows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}

export default function TierFeaturesPage() {
  return (
    <section className="about-page tier-features-page" data-testid="tier-features-page">
      <p className="page-kicker">
        <Link to="/about">About</Link>
        {" · "}
        Product tiers
      </p>
      <h1>
        Tier 1–3 features <InfoTip termId="tier1" />
      </h1>
      <p className="muted lede">
        Annotated product walkthrough with live captures (INFY · Sensex hand_labeled pilot).
        Tier surfaces are real; Tier 3 may sit on PIT scaffolding labeled non-citeable. No Buy /
        Hold.
      </p>

      <nav className="about-toc" aria-label="On this page">
        <a href="#tier1">Tier 1</a>
        <a href="#tier2">Tier 2</a>
        <a href="#tier3">Tier 3</a>
        <a href="#methodology">Methodology</a>
        <Link to="/about#tiers">Back to About</Link>
      </nav>

      <div className="panel tier-hero-shots">
        <figure className="tier-shot">
          <img
            src={shotSrc(`${SHOT}/00-tracker-overview.png`)}
            alt="Guidance Credibility Index tracker overview"
            loading="eager"
          />
          <figcaption>Tracker · universe</figcaption>
        </figure>
        <figure className="tier-shot">
          <img
            src={shotSrc(`${SHOT}/00-about-tiers.png`)}
            alt="About page tiers summary"
            loading="eager"
          />
          <figcaption>About · tier summary</figcaption>
        </figure>
      </div>

      {TIERS.map((tier) => (
        <div className="panel" id={tier.id} key={tier.id}>
          <p className="tier-section-kicker">{tier.kicker}</p>
          <h2 style={{ marginTop: 0 }}>
            {tier.title} {tier.tip ? <InfoTip termId={tier.tip} /> : null}
          </h2>
          <p className="muted" style={{ marginTop: 0 }}>
            {tier.intro}
          </p>
          <div className="tier-feature-list">
            {tier.features.map((f) => (
              <FeatureBlock key={f.id} feature={f} />
            ))}
          </div>
        </div>
      ))}

      <div className="panel" id="methodology">
        <h2 style={{ marginTop: 0 }}>
          Methodology options (#8 / #9) <InfoTip termId="granger" />
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Locked path: stationarity gates → LASSO → Granger → optional CCF aid → VAR when N
          allows. Transfer entropy and causal DAGs stay out of customer-facing v1.
        </p>
        <div className="table-scroll">
          <table className="table" data-testid="methodology-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Method</th>
                <th>Role</th>
                <th>Ship stance</th>
              </tr>
            </thead>
            <tbody>
              {METHODS.map((m) => (
                <tr key={m.n}>
                  <td>{m.n}</td>
                  <td>
                    <strong>{m.name}</strong>
                  </td>
                  <td>{m.role}</td>
                  <td>{m.stance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="about-cta-row">
        <Link to="/about" className="btn ghost">
          About CiteAlpha
        </Link>
        <Link to="/tracker" className="btn">
          Open Guidance Tracker
        </Link>
        <Link to="/companies/infy" className="btn ghost">
          Open INFY dossier
        </Link>
      </div>

      <Disclaimer />
    </section>
  );
}
