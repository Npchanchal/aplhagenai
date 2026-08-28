import { Link } from "react-router-dom";
import {
  AuthDiagram,
  AwsDiagram,
  ContextDiagram,
  LayersDiagram,
  PipelineDiagram,
  RequestPathDiagram,
  ScoringDiagram,
  SurfacesDiagram,
  WedgeDiagram,
} from "../components/ArchitectureDiagrams";
import Disclaimer from "../components/Disclaimer";
import { copyrightLine, LEGAL_ENTITY, PRODUCT_NAME } from "../lib/legal";

/** Full architecture & design — SVG diagrams + contracts. */
export default function ArchitecturePage() {
  return (
    <section className="arch-page" data-testid="architecture-page">
      <header className="arch-hero">
        <p className="page-kicker">Architecture &amp; design</p>
        <h1>{PRODUCT_NAME} system design</h1>
        <p className="muted lede">
          End-to-end design of the Guidance Credibility Index stack — product wedge, request path,
          HITL pipeline, pure scoring, and AWS. Built for Indian equity desks by {LEGAL_ENTITY}.
          Factual research product; not investment advice.
        </p>
        <p className="muted arch-meta">{copyrightLine()}</p>
      </header>

      <nav className="about-toc arch-toc" aria-label="On this page">
        <a href="#wedge">Wedge</a>
        <a href="#context">Context</a>
        <a href="#surfaces">Surfaces</a>
        <a href="#request">Request</a>
        <a href="#layers">Layers</a>
        <a href="#pipeline">Pipeline</a>
        <a href="#scoring">Scoring</a>
        <a href="#auth">Auth</a>
        <a href="#data">Data</a>
        <a href="#aws">AWS</a>
        <a href="#ux">UX</a>
        <a href="#invariants">Invariants</a>
        <Link to="/about">About</Link>
        <Link to="/trust">Trust</Link>
      </nav>

      <article className="arch-section" id="wedge">
        <h2>Product wedge</h2>
        <p className="muted">
          Keep the market terminal for prices. Use {PRODUCT_NAME} for{" "}
          <strong>whether management delivered on stated guidance</strong> — with a citeable trail.
        </p>
        <WedgeDiagram />
        <div className="arch-split">
          <div>
            <h3>In scope</h3>
            <ul className="about-list">
              <li>Guidance ↔ subsequent actual</li>
              <li>Evidence (date, metric, source)</li>
              <li>India Sensex → Nifty beachhead</li>
              <li>Human-in-the-loop extract review</li>
            </ul>
          </div>
          <div>
            <h3>Out of scope</h3>
            <ul className="about-list">
              <li>Sentiment heat maps as the product</li>
              <li>Retail Buy / Hold / Sell</li>
              <li>US-first rebuild</li>
              <li>Invented financial actuals</li>
            </ul>
          </div>
        </div>
      </article>

      <article className="arch-section" id="context">
        <h2>System context</h2>
        <p className="muted">
          Production hostname resolves via Route 53 to an ALB terminating TLS, then a single ECS
          Fargate Spot task that serves the SPA and API together.
        </p>
        <ContextDiagram />
      </article>

      <article className="arch-section" id="surfaces">
        <h2>Product surfaces</h2>
        <p className="muted">
          Three first-class workbenches converge on an evidence-first company dossier.
        </p>
        <SurfacesDiagram />
        <ul className="about-list">
          <li>
            <Link to="/tracker">Tracker</Link> — universe GCI, Δ, quality badges
          </li>
          <li>
            <Link to="/desk">Desk</Link> — review queue, corpus, PIT/API, reports, CSM
          </li>
          <li>
            <Link to="/research">Research</Link> — search, cite-only chat, snapshot, watchlist
          </li>
          <li>
            <Link to="/package">Package</Link> · <Link to="/trust">Trust</Link> ·{" "}
            <Link to="/about">About</Link>
          </li>
        </ul>
      </article>

      <article className="arch-section" id="request">
        <h2>Request path</h2>
        <p className="muted">
          All browser HTTP goes through <code>lib/api.ts</code>. Routes stay thin; formulas live in
          services / pure scoring.
        </p>
        <RequestPathDiagram />
      </article>

      <article className="arch-section" id="layers">
        <h2>Application layering</h2>
        <LayersDiagram />
        <table className="arch-table">
          <thead>
            <tr>
              <th>Layer</th>
              <th>May</th>
              <th>Must not</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>gci_scoring</code>
              </td>
              <td>Pure math on outcomes</td>
              <td>DB, HTTP, wall-clock side effects</td>
            </tr>
            <tr>
              <td>
                <code>repository</code>
              </td>
              <td>Read/write store</td>
              <td>Scoring policy</td>
            </tr>
            <tr>
              <td>
                <code>routes</code>
              </td>
              <td>Auth, validation, HTTP errors</td>
              <td>Business formulas</td>
            </tr>
            <tr>
              <td>
                <code>lib/api.ts</code>
              </td>
              <td>Typed fetch</td>
              <td>Scattered ad-hoc fetch</td>
            </tr>
          </tbody>
        </table>
      </article>

      <article className="arch-section" id="pipeline">
        <h2>Guidance pipeline</h2>
        <p className="muted">
          Sensex IR crawl and imports land as <strong>pending</strong>. Nothing enters GCI math until
          an analyst Accept / Edit / Reject cycle completes.
        </p>
        <PipelineDiagram />
        <div className="arch-split">
          <div>
            <h3>In GCI math</h3>
            <ul className="about-list">
              <li>Transcripts &amp; concalls</li>
              <li>Filings / IR HTML &amp; PDF text</li>
              <li>Reported actuals</li>
            </ul>
          </div>
          <div>
            <h3>Out of GCI math</h3>
            <ul className="about-list">
              <li>Sentiment / wordmap (context stub)</li>
              <li>Technicals &amp; FMP price series</li>
              <li>Raw A/V without transcript</li>
            </ul>
          </div>
        </div>
      </article>

      <article className="arch-section" id="scoring">
        <h2>Scoring design</h2>
        <p className="muted">
          Default engine <strong>v3</strong> (<code>INTELLENS_GCI_VERSION=v3</code>): band δ →
          exponential score, miss asymmetry γ, exponential recency. Deterministic; never invent
          actuals.
        </p>
        <ScoringDiagram />
        <ul className="about-list">
          <li>
            Quality: <code>hand_labeled</code> (prefer for citation) · <code>demo_structured</code> ·{" "}
            <code>market_scaffold</code>
          </li>
          <li>
            Same inputs → same score. Rebuild listing cache after switching v2 ↔ v3.
          </li>
        </ul>
      </article>

      <article className="arch-section" id="auth">
        <h2>Auth &amp; tenancy</h2>
        <AuthDiagram />
        <ul className="about-list">
          <li>Mutations: session cookie and/or <code>X-API-Key</code></li>
          <li>Demo key: <code>intellens-demo</code></li>
          <li>Optional OIDC for enterprise SSO</li>
          <li>Terms attest + SEBI-oriented disclaimers on score surfaces</li>
        </ul>
      </article>

      <article className="arch-section" id="data">
        <h2>Persistence</h2>
        <p className="muted">
          MVP store is JSON under <code>backend/app/data/</code> (outcomes, docs, IR catalog, India
          listing masters). Optional Postgres auth path is separate from GCI outcome storage.
        </p>
        <pre className="arch-code">{`backend/app/
  api/routes.py
  services/          # scoring, extract, match, research, auth
  data/              # store, hand_labeled, ir_sources, listings
frontend/src/
  lib/api.ts         # sole HTTP client
  pages/             # Tracker, Desk, Research, Architecture…
deploy/aws/          # Terraform ECS + ALB + Route53
scripts/             # aws-deploy, idle, wake`}</pre>
      </article>

      <article className="arch-section" id="aws">
        <h2>AWS deployment</h2>
        <AwsDiagram />
        <ul className="about-list">
          <li>
            Scripts: <code>aws-deploy.sh</code> · <code>aws-idle.sh</code> · <code>aws-wake.sh</code>
          </li>
          <li>Cost floor: Spot + no NAT; ALB is the main always-on bill</li>
          <li>Mail MX/SPF/DKIM in Route 53 when Hostinger is the mailbox</li>
        </ul>
      </article>

      <article className="arch-section" id="ux">
        <h2>UX design principles</h2>
        <ol className="about-list">
          <li>One composition per viewport — not widget soup.</li>
          <li>Brand {PRODUCT_NAME} is a hero-level shell signal.</li>
          <li>Source Serif 4 + IBM Plex Sans; paper / ink / teal — no purple SaaS glow.</li>
          <li>Evidence near the top of every dossier; quality badge always visible.</li>
          <li>Show level + Δ when history exists. No Buy / Hold / Sell chrome.</li>
          <li>SEBI-oriented disclaimer on GCI and vernacular surfaces.</li>
        </ol>
      </article>

      <article className="arch-section" id="invariants">
        <h2>Non-negotiables</h2>
        <ol className="about-list">
          <li>Every GCI point → guidance + actual (date, metric, source).</li>
          <li>No retail recommendations without SEBI RA review.</li>
          <li>India beachhead (Sensex → Nifty); export later via API.</li>
          <li>Honest data_quality — never invent financial actuals.</li>
        </ol>
        <p className="muted" style={{ marginBottom: 0 }}>
          Engineer reference: <code>docs/ARCHITECTURE_AND_DESIGN.md</code> · kb{" "}
          <code>docs/kb/02-architecture.md</code>. Runtime posture: <Link to="/trust">Trust Center</Link>
          . Product narrative: <Link to="/about">About</Link>.
        </p>
      </article>

      <Disclaimer />
    </section>
  );
}
