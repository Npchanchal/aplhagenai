import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import InfoTip from "../components/InfoTip";
import { useI18n } from "../i18n";
import { CONTACT_EMAIL, copyrightLine } from "../lib/legal";
import { showArchitecturePage } from "../lib/siteFlags";

const PIPELINE = [
  {
    step: "1",
    title: "Ingest",
    tip: "source",
    text: "IR pages, transcripts, and filings land in the document store — Sensex crawl first; paste is the exception path.",
  },
  {
    step: "2",
    title: "Extract & review",
    tip: "extract",
    text: "Quantified guidance becomes pending statements. Analysts Accept / Edit / Reject before anything enters GCI math.",
  },
  {
    step: "3",
    title: "Match & score",
    tip: "gci",
    text: "Guidance bands meet reported actuals. Labels: met, exceeded, missed, dropped, pending — then a 0–100 company GCI.",
  },
  {
    step: "4",
    title: "Cite",
    tip: "evidence",
    text: "Every citeable score point carries period, metric, quote, URL, and citation id bound to an accepted document.",
  },
] as const;

const PERSONAS = [
  {
    who: "Buy-side / PMS / AIF",
    need: "Screen chronic guidance misses and size conviction with a delivery track record — not another sentiment heat map.",
    path: "Tracker → dossier evidence → Rankings / Radar",
  },
  {
    who: "Sell-side / desk associate",
    need: "Put auditable guidance-vs-actuals into notes fast, with HITL review when extracts need correction.",
    path: "Desk review queue → Evidence edit → Research / Sights Ask",
  },
  {
    who: "Quant / data / platform",
    need: "Point-in-time GCI series and evidence-adjacent exports without inventing retail recommendations.",
    path: "API / PIT → Data catalog → Enterprise package",
  },
  {
    who: "IR / compliance / credit",
    need: "What was promised, by whom, when, and whether it was delivered — a ledger, not a score-only dashboard.",
    path: "Ledger / Radar → Trust Center → Package",
  },
] as const;

const ALSO = [
  {
    title: "Products",
    to: "/products",
    text: "Score, Cite, Radar, Ledger, Data, and Sights — jobs on the same India disclosure spine.",
  },
  {
    title: "Sights",
    to: "/sights",
    text: "India IR research OS: search, cite-only Ask, boards, grid, and desk agents.",
  },
  {
    title: "GCI Rankings",
    to: "/rankings",
    text: "Public ranking of citeable names — evidence-linked, not recommendations.",
  },
  {
    title: "Trust Center",
    to: "/trust",
    text: "Security, residency, counsel status, and citation posture for procurement.",
  },
] as const;

const HOW_TO = [
  {
    title: "Screen the universe",
    to: "/tracker",
    text: "Open Guidance Credibility Index. Prefer Hand-labeled names for external citation. Sort by GCI or Δ.",
  },
  {
    title: "Open a dossier",
    to: "/companies/infy",
    text: "Evidence + Docs (Tier 1 gate) + Trend + Granger analytics (descriptive / precedence only).",
  },
  {
    title: "Run the desk loop",
    to: "/desk",
    text: "Console, review queue, Corpus foundation, cite-only Reports, PIT API.",
  },
  {
    title: "Research Terminal",
    to: "/research",
    text: "Cite-only document search and chat over filings and transcripts.",
  },
  {
    title: "Sights",
    to: "/sights",
    text: "India disclosure research OS — Ask refuses without evidence.",
  },
] as const;

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <section className="about-page" data-testid="about-page">
      <p className="page-kicker">{t("about.kicker")}</p>
      <h1>
        {t("about.title")} <InfoTip termId="gci" />
      </h1>
      <p className="muted lede">{t("about.lede")}</p>
      <p className="muted" data-testid="about-owner">
        {copyrightLine()} Contact{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See{" "}
        <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy</Link>.
      </p>

      <nav className="about-toc" aria-label="On this page">
        <a href="#what">What it is</a>
        <a href="#why">Why it is needed</a>
        <a href="#how">How it works</a>
        <a href="#layers">Capability layers</a>
        <Link to="/about/tiers">Tier screenshots</Link>
        {showArchitecturePage ? <Link to="/about/architecture">Architecture</Link> : null}
        <a href="#who">Who uses it</a>
        <a href="#also">Also in CiteAlpha</a>
      </nav>

      <div className="panel" id="what">
        <h2 style={{ marginTop: 0 }}>
          What it is <InfoTip termId="gci" />
        </h2>
        <p>
          <strong>CiteAlpha</strong> is a product of{" "}
          <strong>Ocotillo Innovation Private Limited</strong>. It delivers the{" "}
          <strong>Guidance Credibility Index (GCI)</strong> — a 0–100 score of whether
          Indian listed-company management <em>delivered</em> on quantified guidance.
          It is a credit score for promises vs actuals, not a sentiment dashboard and
          not a price terminal.
        </p>
        <ul className="about-list">
          <li>
            Every citeable score links to period, metric, guided band, actual, label, and
            source (URL + quote + citation id).
          </li>
          <li>
            India beachhead: Sensex-depth hand-labeled evidence first; broader NSE/BSE
            listings are navigable with honest quality badges.
          </li>
          <li>
            Explicit non-goals: no Buy / Hold / Sell, no retail tips, no OMS or live quotes.
          </li>
        </ul>
        <Disclaimer compact />
      </div>

      <div className="panel" id="why">
        <h2 style={{ marginTop: 0 }}>Why it is needed</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Desks already have news, filings search, and market terminals. What they still
          lack is a durable, evidence-linked answer to:{" "}
          <em>did this management keep its word?</em>
        </p>
        <div className="about-why-grid">
          <div>
            <h3>Guidance drifts</h3>
            <p className="muted">
              Bands move mid-year; “dropped” reiterates vanish from memory. Without a
              thread of statements → actuals, miss patterns stay anecdotal.
            </p>
          </div>
          <div>
            <h3>India-shaped disclosure</h3>
            <p className="muted">
              NSE/BSE IR tables, mixed-language concalls, and local formats need a local
              spine — not a US-first product with India as an afterthought.
            </p>
          </div>
          <div>
            <h3>Compliance posture</h3>
            <p className="muted">
              Factual delivery research stays on the right side of SEBI RA risk. Analysts
              own forecasts; the platform shows observed delivery and citations.
            </p>
          </div>
          <div>
            <h3>HITL that compounds</h3>
            <p className="muted">
              Extract → review → commit turns desk corrections into a lasting corpus —
              not a one-off paste into a spreadsheet.
            </p>
          </div>
        </div>
      </div>

      <div className="panel" id="how">
        <h2 style={{ marginTop: 0 }}>How it works</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          One pipeline: ingest → structure → searchable → citable. Citability is not a
          bolt-on — it only works when documents are stored with structure preserved.
        </p>
        <ol className="about-pipeline">
          {PIPELINE.map((p) => (
            <li key={p.step}>
              <span className="about-step">{p.step}</span>
              <div>
                <strong>
                  {p.title} <InfoTip termId={p.tip} />
                </strong>
                <p className="muted">{p.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="muted" style={{ fontSize: 13 }}>
          Data quality stays honest: <strong>Hand-labeled</strong> for external citation;{" "}
          <strong>Provisional</strong> listings are scored for screening only — never
          invent citeable quotes. Analytics overlays (e.g. GCI vs tape) are descriptive
          patterns, not forecasts. Granger panels show statistical precedence only.
        </p>
      </div>

      <div className="panel" id="layers">
        <h2 style={{ marginTop: 0 }}>
          Capability layers <InfoTip termId="tier1" />
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          These are product capability layers, not commercial plans. Seats and API
          access live on <Link to="/package">Package</Link>. Annotated screenshots:{" "}
          <Link to="/about/tiers">tier gallery</Link>.
        </p>
        <div className="about-why-grid">
          <div>
            <h3>Foundation</h3>
            <p className="muted">
              Auto ingest → period docs (transcript / results / IR) → entity search with
              corpus honesty → citeable citation ids. Desk → Corpus builds the Sensex gate.
            </p>
          </div>
          <div>
            <h3>Workflow</h3>
            <p className="muted">
              Multi-horizon Δ (QoQ/YoY from PIT), GCI↔price descriptive overlays, private
              notes, role report templates with citation appendix.
            </p>
          </div>
          <div>
            <h3>Analytics (gated)</h3>
            <p className="muted">
              LASSO → Granger F-test and FDR impact map on ≥12-quarter PIT series. Not
              causation, not a forecast — methodology card on the dossier Analytics panel.
            </p>
          </div>
          <div>
            <h3>Out of scope</h3>
            <p className="muted">
              Buy/Hold/Sell, treating provisional listing scores as citeable IR evidence,
              or cloning a global market-intel OS in product chrome.
            </p>
          </div>
        </div>
      </div>

      <div className="panel" id="who">
        <h2 style={{ marginTop: 0 }}>Who it is for — and how to use it</h2>
        <div className="about-persona-grid">
          {PERSONAS.map((p) => (
            <article key={p.who} className="about-persona">
              <h3>{p.who}</h3>
              <p>{p.need}</p>
              <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
                Typical path: {p.path}
              </p>
            </article>
          ))}
        </div>

        <h3 style={{ marginTop: 28 }} id="also">
          Also in CiteAlpha
        </h3>
        <div className="help-quick">
          {ALSO.map((item) => (
            <Link key={item.to} to={item.to} className="help-quick-card">
              <strong>{item.title}</strong>
              <span className="muted">{item.text}</span>
            </Link>
          ))}
        </div>

        <h3 style={{ marginTop: 28 }}>Quick start</h3>
        <div className="help-quick">
          {HOW_TO.map((item) => (
            <Link key={item.title} to={item.to} className="help-quick-card">
              <strong>{item.title}</strong>
              <span className="muted">{item.text}</span>
            </Link>
          ))}
        </div>

        <div className="about-cta-row">
          <Link to="/tracker" className="btn">
            Open Guidance Tracker
          </Link>
          <Link to="/products" className="btn ghost">
            Product catalog
          </Link>
          <Link to="/help" className="btn ghost">
            Help &amp; glossary
          </Link>
        </div>
      </div>

      <Disclaimer />
    </section>
  );
}
