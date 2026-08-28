import { useEffect, useState } from "react";
import CompanyPicker from "../../components/CompanyPicker";
import {
  fetchCompanies,
  fetchSightsAgents,
  fetchSightsEnterprise,
  fetchSightsExport,
  fetchSightsFundamentals,
  fetchSightsHooks,
  postSightsAgentRun,
  postSightsDeepDive,
  postSightsGrid,
  type CompanySummary,
} from "../../lib/api";
import { Link } from "react-router-dom";
import { formatScore } from "../../lib/score";

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

export function SightsGridPage() {
  const { companies, companyId } = useCompanyFocus();
  const [prompt, setPrompt] = useState("margin guidance");
  const [rows, setRows] = useState<
    { prompt: string; cells: { company_id: string; answer?: string; refused: boolean }[] }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const ids = companies.slice(0, 3).map((c) => c.id);
      const res = await postSightsGrid({
        prompts: [prompt],
        company_ids: ids.length ? ids : companyId ? [companyId] : undefined,
      });
      setRows(res.rows || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grid failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="sights-panel" data-testid="sights-grid">
      <h2>Compare Grid</h2>
      <p className="muted">Same prompt across covered names — cite cells only.</p>
      <div className="row gap">
        <input className="input" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <button type="button" className="btn" disabled={busy} onClick={() => void run()}>
          {busy ? "Running…" : "Run grid"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {rows.map((r) => (
        <div key={r.prompt}>
          <h3>{r.prompt}</h3>
          <div className="sights-grid-row">
            {r.cells.map((c) => (
              <div key={c.company_id} className="sights-grid-cell">
                <strong>{c.company_id}</strong>
                <p className={c.refused ? "muted" : ""}>{c.answer}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export function SightsDeepDivePage() {
  const { companies, companyId, setCompanyId } = useCompanyFocus();
  const [topic, setTopic] = useState("guidance delivery");
  const [report, setReport] = useState<string | null>(null);
  const [refused, setRefused] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await postSightsDeepDive({ topic, company_id: companyId || undefined });
      setRefused(!!res.refused);
      setMessage(res.message || "");
      setReport(res.report || null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="sights-panel" data-testid="sights-deep-dive">
      <h2>Deep Dive</h2>
      <CompanyPicker companies={companies} value={companyId} onChange={setCompanyId} />
      <div className="row gap">
        <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <button type="button" className="btn" disabled={busy} onClick={() => void run()}>
          {busy ? "Synthesizing…" : "Run Deep Dive"}
        </button>
      </div>
      {refused && <p className="callout warn">{message}</p>}
      {report && <pre className="code-block">{report}</pre>}
    </section>
  );
}

export function SightsFundamentalsPage() {
  const { companies, companyId, setCompanyId } = useCompanyFocus();
  const [gci, setGci] = useState<number | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!companyId) return;
    fetchSightsFundamentals(companyId).then((r) => {
      setNote(r.note);
      const score = r.snapshot?.gci?.score;
      setGci(typeof score === "number" ? score : null);
    });
  }, [companyId]);

  return (
    <section className="sights-panel" data-testid="sights-fundamentals">
      <h2>Fundamentals Strip</h2>
      <CompanyPicker companies={companies} value={companyId} onChange={setCompanyId} />
      <p className="muted">{note}</p>
      <p>
        GCI {formatScore(gci)} ·{" "}
        <Link to={`/companies/${companyId}`}>Open dossier</Link>
      </p>
    </section>
  );
}

export function SightsAgentsPage() {
  const { companies, companyId, setCompanyId } = useCompanyFocus();
  const [templates, setTemplates] = useState<{ id: string; name: string; description: string }[]>(
    [],
  );
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchSightsAgents().then((r) => setTemplates(r.templates || []));
  }, []);

  async function run(templateId: string) {
    if (!companyId) return;
    setBusy(true);
    try {
      const res = await postSightsAgentRun({ template_id: templateId, company_id: companyId });
      setResult(JSON.stringify(res.body, null, 2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="sights-panel" data-testid="sights-agents">
      <h2>Desk Agents</h2>
      <CompanyPicker companies={companies} value={companyId} onChange={setCompanyId} />
      <ul className="doc-list">
        {templates.map((t) => (
          <li key={t.id}>
            <strong>{t.name}</strong> — {t.description}{" "}
            <button type="button" className="btn" disabled={busy} onClick={() => void run(t.id)}>
              Run
            </button>
          </li>
        ))}
      </ul>
      {result && <pre className="code-block">{result}</pre>}
    </section>
  );
}

export function SightsExportPage() {
  const { companies, companyId, setCompanyId } = useCompanyFocus();
  const [content, setContent] = useState("");
  const [pdfHint, setPdfHint] = useState("");
  const [hooks, setHooks] = useState<{ id: string; path: string; enabled?: boolean }[]>([]);

  useEffect(() => {
    fetchSightsHooks().then((r) => setHooks(r.channels || []));
  }, []);

  async function exportFmt(fmt: "markdown" | "csv") {
    if (!companyId) return;
    const res = await fetchSightsExport(companyId, fmt);
    setContent(res.content || JSON.stringify(res.payload, null, 2));
    setPdfHint(res.pdf_hint || "");
  }

  return (
    <section className="sights-panel" data-testid="sights-export">
      <h2>Cite Export & Notify Hooks</h2>
      <CompanyPicker companies={companies} value={companyId} onChange={setCompanyId} />
      <div className="row gap">
        <button type="button" className="btn" onClick={() => void exportFmt("markdown")}>
          Markdown
        </button>
        <button type="button" className="btn" onClick={() => void exportFmt("csv")}>
          CSV
        </button>
      </div>
      {pdfHint && (
        <p className="muted">
          IC PDF: <code>{pdfHint}</code>
        </p>
      )}
      {content && <pre className="code-block">{content}</pre>}
      <h3>Notify Hooks</h3>
      <ul>
        {hooks.map((h) => (
          <li key={h.id}>
            {h.id} → <code>{h.path}</code> {h.enabled === false ? "(flagged off)" : ""}
          </li>
        ))}
      </ul>
      <p className="muted">M365 / Slack / Salesforce deferred until MSA + OAuth registration.</p>
    </section>
  );
}

export function SightsSettingsPage() {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [sso, setSso] = useState(false);

  useEffect(() => {
    fetchSightsEnterprise().then((r) => {
      setLinks(r.links || {});
      setNote(r.note);
      setSso(!!r.sso_configured_flag);
    });
  }, []);

  return (
    <section className="sights-panel" data-testid="sights-settings">
      <h2>Enterprise</h2>
      <p className="muted">{note}</p>
      <p>SSO flag: {sso ? "on" : "off"}</p>
      <ul>
        {Object.entries(links).map(([k, v]) => (
          <li key={k}>
            {k}:{" "}
            {v.startsWith("/") ? (
              <Link to={v}>{v}</Link>
            ) : (
              <code>{v}</code>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
