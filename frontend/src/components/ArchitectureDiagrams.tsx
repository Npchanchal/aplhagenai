import type { ReactNode } from "react";

/** Inline SVG architecture diagrams — ink/teal institutional palette. */

const ink = "#0e1a16";
const accent = "#0b6b5f";
const soft = "#d4e8e4";
const paper = "#f7f4ee";
const line = "#c5cfc9";
const muted = "#5c6570";

type FigProps = { title: string; caption?: string; children: ReactNode };

function Fig({ title, caption, children }: FigProps) {
  return (
    <figure className="arch-fig">
      <div className="arch-fig-frame" role="img" aria-label={title}>
        {children}
      </div>
      {caption ? <figcaption className="muted">{caption}</figcaption> : null}
    </figure>
  );
}

export function WedgeDiagram() {
  return (
    <Fig
      title="Product wedge"
      caption="Market terminals keep prices. CiteAlpha owns guidance delivery."
    >
      <svg viewBox="0 0 720 200" className="arch-svg" xmlns="http://www.w3.org/2000/svg">
        <rect width="720" height="200" fill={paper} />
        <rect x="40" y="50" width="200" height="100" fill="#fff" stroke={ink} strokeWidth="1.5" />
        <text x="140" y="95" textAnchor="middle" fill={ink} fontSize="14" fontFamily="IBM Plex Sans,sans-serif">
          Market terminal
        </text>
        <text x="140" y="118" textAnchor="middle" fill={muted} fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
          prices · quotes
        </text>
        <path d="M260 100 H300" stroke={accent} strokeWidth="2" markerEnd="url(#ah)" />
        <rect x="320" y="40" width="200" height="120" fill={soft} stroke={accent} strokeWidth="2" />
        <text x="420" y="85" textAnchor="middle" fill={ink} fontSize="15" fontWeight="600" fontFamily="Source Serif 4,Georgia,serif">
          CiteAlpha
        </text>
        <text x="420" y="108" textAnchor="middle" fill={accent} fontSize="13" fontFamily="IBM Plex Sans,sans-serif">
          GCI · delivery
        </text>
        <text x="420" y="128" textAnchor="middle" fill={muted} fontSize="11" fontFamily="IBM Plex Sans,sans-serif">
          evidence trail
        </text>
        <path d="M540 100 H580" stroke={accent} strokeWidth="2" markerEnd="url(#ah)" />
        <rect x="580" y="50" width="100" height="100" fill="#fff" stroke={ink} strokeWidth="1.5" />
        <text x="630" y="100" textAnchor="middle" fill={ink} fontSize="13" fontFamily="IBM Plex Sans,sans-serif">
          Desk
        </text>
        <defs>
          <marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={accent} />
          </marker>
        </defs>
      </svg>
    </Fig>
  );
}

export function ContextDiagram() {
  return (
    <Fig
      title="System context"
      caption="citealpha.com → ALB → one Fargate task (nginx + FastAPI). FMP is context-only."
    >
      <svg viewBox="0 0 720 420" className="arch-svg" xmlns="http://www.w3.org/2000/svg">
        <rect width="720" height="420" fill={paper} />
        <rect x="240" y="16" width="240" height="44" fill="#fff" stroke={ink} strokeWidth="1.5" />
        <text x="360" y="43" textAnchor="middle" fill={ink} fontSize="13" fontFamily="IBM Plex Sans,sans-serif">
          Desks · pilots · API clients
        </text>
        <line x1="360" y1="60" x2="360" y2="88" stroke={accent} strokeWidth="2" />
        <rect x="220" y="88" width="280" height="40" fill="#fff" stroke={line} strokeWidth="1.5" />
        <text x="360" y="113" textAnchor="middle" fill={ink} fontSize="13" fontFamily="IBM Plex Sans,sans-serif">
          Route 53 · citealpha.com · ACM
        </text>
        <line x1="360" y1="128" x2="360" y2="156" stroke={accent} strokeWidth="2" />
        <rect x="200" y="156" width="320" height="40" fill="#fff" stroke={line} strokeWidth="1.5" />
        <text x="360" y="181" textAnchor="middle" fill={ink} fontSize="13" fontFamily="IBM Plex Sans,sans-serif">
          Application Load Balancer · HTTPS
        </text>
        <line x1="360" y1="196" x2="360" y2="224" stroke={accent} strokeWidth="2" />
        <rect x="120" y="224" width="480" height="100" fill="#fff" stroke={accent} strokeWidth="2" />
        <text x="360" y="248" textAnchor="middle" fill={accent} fontSize="11" fontFamily="IBM Plex Sans,sans-serif">
          ECS Fargate Spot · ap-south-1
        </text>
        <rect x="150" y="262" width="180" height="44" fill={soft} stroke={accent} strokeWidth="1.5" />
        <text x="240" y="289" textAnchor="middle" fill={ink} fontSize="13" fontFamily="IBM Plex Sans,sans-serif">
          nginx · React SPA
        </text>
        <rect x="390" y="262" width="180" height="44" fill={soft} stroke={accent} strokeWidth="1.5" />
        <text x="480" y="289" textAnchor="middle" fill={ink} fontSize="13" fontFamily="IBM Plex Sans,sans-serif">
          FastAPI · uvicorn
        </text>
        <line x1="360" y1="324" x2="360" y2="348" stroke={accent} strokeWidth="2" />
        <rect x="180" y="348" width="360" height="44" fill="#fff" stroke={ink} strokeWidth="1.5" />
        <text x="360" y="375" textAnchor="middle" fill={ink} fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
          JSON store · hand-labeled · IR catalog · listings
        </text>
        <rect x="24" y="250" width="80" height="56" fill="none" stroke={muted} strokeWidth="1" strokeDasharray="4 3" />
        <text x="64" y="275" textAnchor="middle" fill={muted} fontSize="10" fontFamily="IBM Plex Sans,sans-serif">
          FMP
        </text>
        <text x="64" y="290" textAnchor="middle" fill={muted} fontSize="9" fontFamily="IBM Plex Sans,sans-serif">
          prices only
        </text>
        <line x1="104" y1="278" x2="150" y2="278" stroke={muted} strokeWidth="1" strokeDasharray="3 2" />
        <rect x="616" y="250" width="80" height="56" fill="none" stroke={muted} strokeWidth="1" strokeDasharray="4 3" />
        <text x="656" y="275" textAnchor="middle" fill={muted} fontSize="10" fontFamily="IBM Plex Sans,sans-serif">
          Mail
        </text>
        <text x="656" y="290" textAnchor="middle" fill={muted} fontSize="9" fontFamily="IBM Plex Sans,sans-serif">
          Hostinger
        </text>
      </svg>
    </Fig>
  );
}

export function SurfacesDiagram() {
  return (
    <Fig title="Product surfaces" caption="Three primary workbenches plus evidence dossier.">
      <svg viewBox="0 0 720 260" className="arch-svg" xmlns="http://www.w3.org/2000/svg">
        <rect width="720" height="260" fill={paper} />
        {[
          { x: 40, title: "Tracker", path: "/tracker", sub: "Universe · GCI · Δ" },
          { x: 260, title: "Desk", path: "/desk", sub: "Review · PIT · reports" },
          { x: 480, title: "Research", path: "/research", sub: "Search · cite-only" },
        ].map((b) => (
          <g key={b.title}>
            <rect x={b.x} y="36" width="200" height="100" fill="#fff" stroke={accent} strokeWidth="2" />
            <text x={b.x + 100} y="72" textAnchor="middle" fill={ink} fontSize="16" fontFamily="Source Serif 4,Georgia,serif">
              {b.title}
            </text>
            <text x={b.x + 100} y="94" textAnchor="middle" fill={accent} fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
              {b.path}
            </text>
            <text x={b.x + 100} y="116" textAnchor="middle" fill={muted} fontSize="11" fontFamily="IBM Plex Sans,sans-serif">
              {b.sub}
            </text>
          </g>
        ))}
        <path d="M140 136 V168 H360 V136" fill="none" stroke={line} strokeWidth="1.5" />
        <path d="M360 136 V168" fill="none" stroke={line} strokeWidth="1.5" />
        <path d="M580 136 V168 H360" fill="none" stroke={line} strokeWidth="1.5" />
        <rect x="210" y="168" width="300" height="56" fill={soft} stroke={ink} strokeWidth="1.5" />
        <text x="360" y="192" textAnchor="middle" fill={ink} fontSize="14" fontFamily="IBM Plex Sans,sans-serif">
          Company dossier · /companies/:id
        </text>
        <text x="360" y="210" textAnchor="middle" fill={muted} fontSize="11" fontFamily="IBM Plex Sans,sans-serif">
          Evidence-first · quality badge · citations
        </text>
      </svg>
    </Fig>
  );
}

export function LayersDiagram() {
  return (
    <Fig title="Application layers" caption="gci_scoring stays pure — no DB, no HTTP, no wall-clock.">
      <svg viewBox="0 0 720 340" className="arch-svg" xmlns="http://www.w3.org/2000/svg">
        <rect width="720" height="340" fill={paper} />
        {[
          { y: 20, label: "UI", text: "pages · components", core: false },
          { y: 70, label: "Client", text: "lib/api.ts · typed JSON only", core: false },
          { y: 120, label: "HTTP", text: "api/routes.py · auth · validation", core: false },
          { y: 170, label: "Services", text: "extract · match · research · repository", core: false },
          { y: 220, label: "Pure", text: "gci_scoring.py — deterministic math", core: true },
          { y: 270, label: "Data", text: "backend/app/data/*.json", core: false },
        ].map((row) => (
          <g key={row.label}>
            <rect
              x="80"
              y={row.y}
              width="560"
              height="42"
              fill={row.core ? soft : "#fff"}
              stroke={row.core ? accent : line}
              strokeWidth={row.core ? 2 : 1.5}
            />
            <text x="110" y={row.y + 26} fill={accent} fontSize="11" fontWeight="600" fontFamily="IBM Plex Sans,sans-serif">
              {row.label.toUpperCase()}
            </text>
            <text x="200" y={row.y + 26} fill={ink} fontSize="13" fontFamily="IBM Plex Sans,sans-serif">
              {row.text}
            </text>
          </g>
        ))}
      </svg>
    </Fig>
  );
}

export function PipelineDiagram() {
  const stages = [
    "Ingest",
    "Extract",
    "Review",
    "Commit",
    "Match",
    "Score",
    "Cite",
  ];
  return (
    <Fig
      title="Guidance pipeline"
      caption="Pending until HITL accept. Match key: (company_id, period, metric)."
    >
      <svg viewBox="0 0 720 160" className="arch-svg" xmlns="http://www.w3.org/2000/svg">
        <rect width="720" height="160" fill={paper} />
        {stages.map((s, i) => {
          const x = 18 + i * 100;
          return (
            <g key={s}>
              <rect x={x} y="48" width="88" height="64" fill={i === 5 ? soft : "#fff"} stroke={i === 5 ? accent : ink} strokeWidth="1.5" />
              <text x={x + 44} y="72" textAnchor="middle" fill={accent} fontSize="10" fontFamily="IBM Plex Sans,sans-serif">
                {i + 1}
              </text>
              <text x={x + 44} y="92" textAnchor="middle" fill={ink} fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
                {s}
              </text>
              {i < stages.length - 1 ? (
                <path d={`M${x + 88} 80 H${x + 100}`} stroke={accent} strokeWidth="2" />
              ) : null}
            </g>
          );
        })}
      </svg>
    </Fig>
  );
}

export function ScoringDiagram() {
  return (
    <Fig title="Scoring design" caption="v4 default (beats floored at 60). Pending / unmapped excluded from the average.">
      <svg viewBox="0 0 720 280" className="arch-svg" xmlns="http://www.w3.org/2000/svg">
        <rect width="720" height="280" fill={paper} />
        <rect x="40" y="40" width="140" height="50" fill="#fff" stroke={ink} strokeWidth="1.5" />
        <text x="110" y="70" textAnchor="middle" fill={ink} fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
          Closed outcomes
        </text>
        <path d="M180 65 H220" stroke={accent} strokeWidth="2" />
        <rect x="220" y="40" width="120" height="50" fill="#fff" stroke={ink} strokeWidth="1.5" />
        <text x="280" y="70" textAnchor="middle" fill={ink} fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
          Labels
        </text>
        <path d="M340 65 H380" stroke={accent} strokeWidth="2" />
        <rect x="380" y="40" width="140" height="50" fill="#fff" stroke={ink} strokeWidth="1.5" />
        <text x="450" y="70" textAnchor="middle" fill={ink} fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
          Weights · recency
        </text>
        <path d="M520 65 H560" stroke={accent} strokeWidth="2" />
        <rect x="560" y="40" width="120" height="50" fill={soft} stroke={accent} strokeWidth="2" />
        <text x="620" y="70" textAnchor="middle" fill={ink} fontSize="13" fontWeight="600" fontFamily="IBM Plex Sans,sans-serif">
          GCI 0–100
        </text>
        {[
          { x: 80, t: "met" },
          { x: 200, t: "exceeded" },
          { x: 340, t: "missed" },
          { x: 470, t: "dropped" },
        ].map((l) => (
          <g key={l.t}>
            <rect x={l.x} y="130" width="100" height="36" fill="#fff" stroke={line} strokeWidth="1" />
            <text x={l.x + 50} y="153" textAnchor="middle" fill={ink} fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
              {l.t}
            </text>
          </g>
        ))}
        <rect x="240" y="190" width="240" height="36" fill="none" stroke={muted} strokeWidth="1" strokeDasharray="4 3" />
        <text x="360" y="213" textAnchor="middle" fill={muted} fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
          pending · unmapped — excluded
        </text>
        <text x="360" y="250" textAnchor="middle" fill={muted} fontSize="11" fontFamily="IBM Plex Sans,sans-serif">
          Audit (v3/v4): withdrawal −15 · definition shift −10
        </text>
      </svg>
    </Fig>
  );
}

export function AuthDiagram() {
  return (
    <Fig title="Auth & mutations" caption="Demo write key: X-API-Key: intellens-demo. Optional OIDC.">
      <svg viewBox="0 0 720 200" className="arch-svg" xmlns="http://www.w3.org/2000/svg">
        <rect width="720" height="200" fill={paper} />
        <rect x="40" y="60" width="120" height="70" fill="#fff" stroke={ink} strokeWidth="1.5" />
        <text x="100" y="100" textAnchor="middle" fill={ink} fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
          Client
        </text>
        <path d="M160 95 H200" stroke={accent} strokeWidth="2" />
        <rect x="200" y="50" width="150" height="90" fill="#fff" stroke={line} strokeWidth="1.5" />
        <text x="275" y="85" textAnchor="middle" fill={ink} fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
          Session / API key
        </text>
        <text x="275" y="108" textAnchor="middle" fill={muted} fontSize="11" fontFamily="IBM Plex Sans,sans-serif">
          + optional OIDC
        </text>
        <path d="M350 95 H390" stroke={accent} strokeWidth="2" />
        <rect x="390" y="50" width="130" height="90" fill="#fff" stroke={line} strokeWidth="1.5" />
        <text x="455" y="95" textAnchor="middle" fill={ink} fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
          RBAC · org
        </text>
        <path d="M520 95 H560" stroke={accent} strokeWidth="2" />
        <rect x="560" y="60" width="120" height="70" fill={soft} stroke={accent} strokeWidth="2" />
        <text x="620" y="100" textAnchor="middle" fill={ink} fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
          Mutations
        </text>
      </svg>
    </Fig>
  );
}

export function AwsDiagram() {
  return (
    <Fig title="AWS topology" caption="Public subnet, no NAT. Idle Fargate with aws-idle.sh; ALB still bills.">
      <svg viewBox="0 0 720 300" className="arch-svg" xmlns="http://www.w3.org/2000/svg">
        <rect width="720" height="300" fill={paper} />
        <rect x="40" y="30" width="150" height="50" fill="#fff" stroke={line} strokeWidth="1.5" />
        <text x="115" y="60" textAnchor="middle" fill={ink} fontSize="13" fontFamily="IBM Plex Sans,sans-serif">
          Route 53
        </text>
        <rect x="220" y="30" width="150" height="50" fill="#fff" stroke={line} strokeWidth="1.5" />
        <text x="295" y="60" textAnchor="middle" fill={ink} fontSize="13" fontFamily="IBM Plex Sans,sans-serif">
          ACM cert
        </text>
        <rect x="400" y="30" width="280" height="50" fill="#fff" stroke={line} strokeWidth="1.5" />
        <text x="540" y="60" textAnchor="middle" fill={ink} fontSize="13" fontFamily="IBM Plex Sans,sans-serif">
          ECR api + web images
        </text>
        <rect x="40" y="110" width="640" height="55" fill="#fff" stroke={ink} strokeWidth="1.5" />
        <text x="360" y="143" textAnchor="middle" fill={ink} fontSize="14" fontFamily="IBM Plex Sans,sans-serif">
          ALB · HTTPS :443 · HTTP redirect
        </text>
        <rect x="40" y="190" width="640" height="70" fill={soft} stroke={accent} strokeWidth="2" />
        <text x="360" y="220" textAnchor="middle" fill={ink} fontSize="14" fontFamily="IBM Plex Sans,sans-serif">
          ECS service · desired 1 · Fargate Spot 0.5 vCPU / 1 GB
        </text>
        <text x="360" y="242" textAnchor="middle" fill={muted} fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
          Combined task: nginx static + FastAPI · CloudWatch logs 7d
        </text>
      </svg>
    </Fig>
  );
}

export function RequestPathDiagram() {
  return (
    <Fig title="Request path" caption="Browser never calls scoring directly — always routes → services.">
      <svg viewBox="0 0 720 120" className="arch-svg" xmlns="http://www.w3.org/2000/svg">
        <rect width="720" height="120" fill={paper} />
        {["Browser", "api.ts", "routes", "services", "score / store"].map((t, i) => {
          const x = 30 + i * 140;
          return (
            <g key={t}>
              <rect x={x} y="35" width="120" height="50" fill={i === 4 ? soft : "#fff"} stroke={i === 4 ? accent : ink} strokeWidth="1.5" />
              <text x={x + 60} y="65" textAnchor="middle" fill={ink} fontSize="12" fontFamily="IBM Plex Sans,sans-serif">
                {t}
              </text>
              {i < 4 ? <path d={`M${x + 120} 60 H${x + 140}`} stroke={accent} strokeWidth="2" /> : null}
            </g>
          );
        })}
      </svg>
    </Fig>
  );
}
