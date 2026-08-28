import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  fetchLabelCompanies,
  fetchLabelDrafts,
  postLabelDraft,
  postLabelDraftAction,
  postLabelImportCsv,
  type LabelDraft,
} from "../lib/api";
import { trackEvent } from "../lib/analytics";
import { useSourceViewer } from "../lib/SourceViewerContext";
import { withTextHighlight } from "../lib/sourceHighlight";

const METRICS = [
  "revenue_growth_pct",
  "ebitda_margin_pct",
  "pat_growth_pct",
  "volume_growth_pct",
  "capex",
];

/** In-Desk hand-label drafts — never invent actuals; two-person accept. */
export default function LabelWorkbench({ companyId }: { companyId: string }) {
  const { openSource } = useSourceViewer();
  const [queue, setQueue] = useState<
    { company_id: string; ticker: string; name: string; data_quality: string }[]
  >([]);
  const [drafts, setDrafts] = useState<LabelDraft[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [csv, setCsv] = useState("");
  const [form, setForm] = useState({
    company_id: companyId,
    period: "FY25",
    metric: "revenue_growth_pct",
    guided_low: "",
    guided_high: "",
    actual_value: "",
    guided_text: "",
    quote_span: "",
    source_url: "",
    source_ref: "",
  });

  const reload = useCallback(async () => {
    const [q, d] = await Promise.all([
      fetchLabelCompanies(),
      fetchLabelDrafts({ companyId: form.company_id || companyId }),
    ]);
    setQueue(q.companies || []);
    setDrafts(d.drafts || []);
  }, [companyId, form.company_id]);

  useEffect(() => {
    setForm((f) => ({ ...f, company_id: companyId }));
  }, [companyId]);

  useEffect(() => {
    void reload().catch((e) => setMsg((e as Error).message));
  }, [reload]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await postLabelDraft({
        company_id: form.company_id,
        period: form.period,
        metric: form.metric,
        guided_low: form.guided_low ? Number(form.guided_low) : null,
        guided_high: form.guided_high ? Number(form.guided_high) : null,
        actual_value: form.actual_value ? Number(form.actual_value) : null,
        guided_text: form.guided_text,
        quote_span: form.quote_span,
        source_url: form.source_url,
        source_ref: form.source_ref,
      });
      setMsg("Draft saved — add source URL + quote before submit");
      await reload();
    } catch (err) {
      setMsg((err as Error).message);
    }
  }

  return (
    <div className="panel desk-panel" data-testid="label-workbench">
      <h2 style={{ marginTop: 0 }}>Hand-label workbench</h2>
      <p className="muted">
        Record guidance vs actual from the IR source. Promotion to{" "}
        <code>hand_labeled</code> requires URL + quote and a second reviewer. Never invent actuals.
      </p>
      {queue.length > 0 && (
        <p className="muted">
          Queue (demo/provisional):{" "}
          {queue
            .slice(0, 8)
            .map((c) => c.ticker)
            .join(", ")}
        </p>
      )}
      <form className="auth-form" onSubmit={onCreate} style={{ maxWidth: 640 }}>
        <label>
          Company id
          <input
            value={form.company_id}
            onChange={(e) => setForm({ ...form, company_id: e.target.value })}
            required
          />
        </label>
        <label>
          Period
          <input
            value={form.period}
            onChange={(e) => setForm({ ...form, period: e.target.value })}
            required
          />
        </label>
        <label>
          Metric
          <select
            value={form.metric}
            onChange={(e) => setForm({ ...form, metric: e.target.value })}
          >
            {METRICS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label>
          Guided low
          <input
            value={form.guided_low}
            onChange={(e) => setForm({ ...form, guided_low: e.target.value })}
          />
        </label>
        <label>
          Guided high
          <input
            value={form.guided_high}
            onChange={(e) => setForm({ ...form, guided_high: e.target.value })}
          />
        </label>
        <label>
          Actual (from reported results — leave empty if unknown)
          <input
            value={form.actual_value}
            onChange={(e) => setForm({ ...form, actual_value: e.target.value })}
          />
        </label>
        <label>
          Guided text
          <input
            value={form.guided_text}
            onChange={(e) => setForm({ ...form, guided_text: e.target.value })}
          />
        </label>
        <label>
          Quote span
          <textarea
            value={form.quote_span}
            onChange={(e) => setForm({ ...form, quote_span: e.target.value })}
            rows={2}
            required={false}
          />
        </label>
        <label>
          Source URL
          <input
            value={form.source_url}
            onChange={(e) => setForm({ ...form, source_url: e.target.value })}
          />
        </label>
        <label>
          Source ref
          <input
            value={form.source_ref}
            onChange={(e) => setForm({ ...form, source_ref: e.target.value })}
          />
        </label>
        <div className="row gap">
          <button type="submit" className="btn-primary">
            Save draft
          </button>
          <button
            type="button"
            className="btn"
            disabled={!form.source_url}
            onClick={() =>
              openSource({
                title: `${form.period} ${form.metric}`,
                source_url: form.source_url,
                highlight_url: withTextHighlight(form.source_url, form.quote_span),
                quote: form.quote_span,
              })
            }
          >
            Open source
          </button>
        </div>
      </form>
      {msg && <p className="muted">{msg}</p>}
      <h3>Drafts</h3>
      <ul className="org-member-list" data-testid="label-draft-list">
        {drafts.map((d) => (
          <li key={d.id}>
            <span>
              {d.company_id} · {d.period} · {d.metric} · {d.status}
            </span>
            <span className="row gap">
              {d.status === "draft" && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    void postLabelDraftAction(d.id, "submit")
                      .then(() => {
                        trackEvent("label_submit");
                        return reload();
                      })
                      .catch((e) => setMsg((e as Error).message));
                  }}
                >
                  Submit
                </button>
              )}
              {d.status === "submitted" && (
                <>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      void postLabelDraftAction(d.id, "accept")
                        .then(() => reload())
                        .catch((e) => setMsg((e as Error).message));
                    }}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      void postLabelDraftAction(d.id, "reject", "needs cite")
                        .then(() => reload())
                        .catch((e) => setMsg((e as Error).message));
                    }}
                  >
                    Reject
                  </button>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      <h3>CSV import</h3>
      <p className="muted">
        Columns match <code>docs/labeling/outcome_row_template.csv</code>. Imports as drafts — still
        need two-person accept.
      </p>
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={4}
        style={{ width: "100%" }}
        placeholder="company_id,ticker,period,metric,..."
      />
      <button
        type="button"
        className="btn"
        style={{ marginTop: 8 }}
        onClick={() => {
          void postLabelImportCsv(csv)
            .then((res) => {
              setMsg(`Imported ${res.created} draft(s)`);
              return reload();
            })
            .catch((e) => setMsg((e as Error).message));
        }}
      >
        Import CSV as drafts
      </button>
    </div>
  );
}
