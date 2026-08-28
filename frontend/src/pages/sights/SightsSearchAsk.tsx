import { useEffect, useState } from "react";
import {
  fetchSightsSearch,
  postSightsAsk,
  type CitationRecord,
  type ResearchDoc,
} from "../../lib/api";
import CitationCard from "../../components/CitationCard";
import CitedAnswer from "../../components/CitedAnswer";
import PlanAccessGate from "../../components/PlanAccessGate";
import { useSourceViewer } from "../../lib/SourceViewerContext";
import { withTextHighlight } from "../../lib/sourceHighlight";

export function SightsSearchPage() {
  const { openSource } = useSourceViewer();
  const [q, setQ] = useState("guidance margin");
  const [results, setResults] = useState<ResearchDoc[]>([]);
  const [expanded, setExpanded] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(query = q) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchSightsSearch({ q: query, limit: 15 });
      setResults(res.results || []);
      setExpanded(res.expanded_query || query);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void run("guidance margin");
    // Default query on first paint so the surface is not empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="sights-panel" data-testid="sights-search">
      <h2>Sights Search</h2>
      <p className="muted">Business Lexicon expands India IR synonyms behind the query.</p>
      <div className="row gap">
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search query"
          onKeyDown={(e) => e.key === "Enter" && void run()}
        />
        <button type="button" className="btn" disabled={busy} onClick={() => void run()}>
          {busy ? "Searching…" : "Search"}
        </button>
      </div>
      {expanded && expanded !== q && <p className="muted">Expanded: {expanded}</p>}
      {error && <p className="error">{error}</p>}
      <ul className="doc-list">
        {results.map((d) => (
          <li key={d.id}>
            <strong>{d.title}</strong>{" "}
            <span className="muted">
              {d.ticker} · {d.doc_type} · {d.date}
            </span>
            <p>{d.snippet}</p>
            <button
              type="button"
              className="linkish"
              onClick={() =>
                openSource({
                  doc_id: d.id,
                  title: d.title,
                  source_url: d.url,
                  highlight_url: withTextHighlight(d.url, d.snippet),
                  quote: d.snippet,
                  document_text: d.body,
                  company_id: d.company_id,
                })
              }
            >
              Open source →
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SightsAskPage() {
  const [q, setQ] = useState("What guidance was given on revenue?");
  const [answer, setAnswer] = useState("");
  const [cites, setCites] = useState<CitationRecord[]>([]);
  const [refused, setRefused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await postSightsAsk({ question: q });
      setAnswer(res.answer);
      setCites(res.citations || []);
      setRefused(!!res.refused);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ask failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="sights-panel" data-testid="sights-ask">
      <PlanAccessGate
        feature="sights_ask"
        variant="panel"
        title="Sights Ask"
        description="Cite-only answers over indexed India IR and CiteAlpha evidence. Pilot+ plans required."
        returnTo="/sights/ask"
        testId="sights-ask-gate"
      >
      <h2>Sights Ask</h2>
      <p className="muted">Cite-only. Web Assist stays off until quality gates.</p>
      <div className="row gap">
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Ask question"
          onKeyDown={(e) => e.key === "Enter" && void run()}
        />
        <button type="button" className="btn" disabled={busy} onClick={() => void run()}>
          {busy ? "Asking…" : "Ask"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {answer && (
        <div className={refused ? "callout warn" : "callout"}>
          <CitedAnswer text={answer} citations={cites} />
        </div>
      )}
      <div className="cite-stack">
        {cites.map((c, i) => (
          <CitationCard key={c.citation_id || String(c.n) || i} citation={c} />
        ))}
      </div>
      </PlanAccessGate>
    </section>
  );
}
