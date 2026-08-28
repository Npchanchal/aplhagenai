import { useEffect, useState } from "react";
import QualityBadge from "../../components/QualityBadge";
import CompanyPicker from "../../components/CompanyPicker";
import CitationCard from "../../components/CitationCard";
import {
  fetchCompanies,
  fetchSightsField,
  fetchSightsStreet,
  fetchSightsThemes,
  type CompanySummary,
  type CitationRecord,
} from "../../lib/api";
import { useSourceViewer } from "../../lib/SourceViewerContext";
import { withTextHighlight } from "../../lib/sourceHighlight";

export function SightsThemesPage() {
  const [themes, setThemes] = useState<{ theme: string; count: number; note: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSightsThemes({ limit: 30 })
      .then((r) => {
        if (!cancelled) setThemes(r.themes || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="sights-panel" data-testid="sights-themes">
      <h2>Delivery Themes</h2>
      <p className="muted">Guidance delivery labels — not news sentiment.</p>
      {error && <p className="error">{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Theme</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {themes.map((t) => (
            <tr key={t.theme}>
              <td>{t.theme}</td>
              <td>{t.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function useCompanyFocus() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [companyId, setCompanyId] = useState("");
  useEffect(() => {
    fetchCompanies({ limit: 20 }).then((rows) => {
      setCompanies(rows);
      if (rows[0]) setCompanyId(rows[0].id);
    });
  }, []);
  return { companies, companyId, setCompanyId };
}

export function SightsStreetPage() {
  const { companies, companyId, setCompanyId } = useCompanyFocus();
  const { openSource } = useSourceViewer();
  const [note, setNote] = useState("");
  const [snippets, setSnippets] = useState<
    { id?: string; title?: string; snippet?: string; date?: string; url?: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    fetchSightsStreet(companyId)
      .then((r) => {
        if (cancelled) return;
        setNote(r.note);
        setSnippets(r.public_filing_snippets || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return (
    <section className="sights-panel" data-testid="sights-street">
      <h2>Street Context</h2>
      <CompanyPicker companies={companies} value={companyId} onChange={setCompanyId} />
      <p className="muted">{note}</p>
      {error && <p className="error">{error}</p>}
      <ul className="doc-list">
        {snippets.map((s, i) => (
          <li key={i}>
            <strong>{s.title}</strong> <span className="muted">{s.date}</span>
            <p>{s.snippet}</p>
            {(s.url || s.snippet) && (
              <button
                type="button"
                className="linkish"
                onClick={() =>
                  openSource({
                    doc_id: s.id,
                    title: s.title,
                    source_url: s.url,
                    highlight_url: withTextHighlight(s.url, s.snippet),
                    quote: s.snippet,
                    document_text: s.snippet,
                    company_id: companyId,
                  })
                }
              >
                Open source →
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SightsFieldPage() {
  const { companies, companyId, setCompanyId } = useCompanyFocus();
  const [ticker, setTicker] = useState("");
  const [dq, setDq] = useState("demo_structured");
  const [gci, setGci] = useState<number | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, unknown>[]>([]);
  const [cites, setCites] = useState<CitationRecord[]>([]);
  const [note, setNote] = useState("");
  const [emptyDemo, setEmptyDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    fetchSightsField(companyId)
      .then((r) => {
        if (cancelled) return;
        setTicker(r.ticker);
        setDq(r.data_quality);
        setGci(r.gci_score);
        setOutcomes(r.outcomes || []);
        setCites(r.citations || []);
        setNote(r.note);
        setEmptyDemo(!!r.empty_demo);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return (
    <section className="sights-panel" data-testid="sights-field">
      <h2>Field Evidence</h2>
      <CompanyPicker companies={companies} value={companyId} onChange={setCompanyId} />
      <p className="muted">{note}</p>
      {error && <p className="error">{error}</p>}
      <p>
        {ticker} · GCI {gci ?? "n/a"} <QualityBadge quality={dq} />
      </p>
      {emptyDemo && (
        <p className="callout warn">Demo / thin evidence — prefer hand_labeled names for client work.</p>
      )}
      <table className="table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Period</th>
            <th>Label</th>
            <th>Actual</th>
          </tr>
        </thead>
        <tbody>
          {outcomes.map((o, i) => (
            <tr key={i}>
              <td>{String(o.metric ?? "")}</td>
              <td>{String(o.period ?? "")}</td>
              <td>{String(o.label ?? "")}</td>
              <td>{String(o.actual ?? "")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cite-stack">
        {cites.map((c, i) => (
          <CitationCard key={c.citation_id || i} citation={c} />
        ))}
      </div>
    </section>
  );
}
