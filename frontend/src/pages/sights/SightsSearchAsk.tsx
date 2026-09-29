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
import { useI18n } from "../../i18n";

export function SightsSearchPage() {
  const { t } = useI18n();
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
      setError(e instanceof Error ? e.message : t("ui.SightsSearchAsk.searchFailed"));
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
      <h2>{t("ui.SightsSearchAsk.search.title")}</h2>
      <p className="muted">{t("ui.SightsSearchAsk.search.subtitle")}</p>
      <div className="row gap">
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={t("ui.SightsSearchAsk.search.aria")}
          onKeyDown={(e) => e.key === "Enter" && void run()}
        />
        <button type="button" className="btn" disabled={busy} onClick={() => void run()}>
          {busy ? t("ui.SightsSearchAsk.search.searching") : t("ui.SightsSearchAsk.search.button")}
        </button>
      </div>
      {expanded && expanded !== q && <p className="muted">{t("ui.SightsSearchAsk.search.expanded", { query: expanded })}</p>}
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
              {t("ui.SightsSearchAsk.openSource")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SightsAskPage() {
  const { t } = useI18n();
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
      setError(e instanceof Error ? e.message : t("ui.SightsSearchAsk.askFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="sights-panel" data-testid="sights-ask">
      <PlanAccessGate
        feature="sights_ask"
        variant="panel"
        title={t("ui.SightsSearchAsk.ask.title")}
        description={t("ui.SightsSearchAsk.ask.gateDescription")}
        returnTo="/sights/ask"
        testId="sights-ask-gate"
      >
      <h2>{t("ui.SightsSearchAsk.ask.title")}</h2>
      <p className="muted">{t("ui.SightsSearchAsk.ask.subtitle")}</p>
      <div className="row gap">
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={t("ui.SightsSearchAsk.ask.aria")}
          onKeyDown={(e) => e.key === "Enter" && void run()}
        />
        <button type="button" className="btn" disabled={busy} onClick={() => void run()}>
          {busy ? t("ui.SightsSearchAsk.ask.asking") : t("ui.SightsSearchAsk.ask.button")}
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
