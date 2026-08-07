import { Fragment, useState } from "react";
import ChangeChip from "./ChangeChip";
import InfoTip from "./InfoTip";
import type { OutcomeView } from "../lib/api";
import { tipForLabel } from "../lib/glossary";

type Props = {
  outcomes: OutcomeView[];
  companyId?: string;
  /** When set, shows Accept/Reject review actions. */
  onReview?: (outcomeIndex: number, action: "accept" | "reject") => void;
  /** When set, shows an Edit action with an inline band/actual editor. */
  onEdit?: (outcomeIndex: number, edits: Record<string, unknown>) => void;
  maxRows?: number;
  showDeltaActual?: boolean;
  testId?: string;
};

type EditDraft = {
  period: string;
  guided_low: string;
  guided_high: string;
  actual_value: string;
  source_url: string;
  source_ref: string;
  quote_span: string;
};

export default function EvidenceTable({
  outcomes,
  onReview,
  onEdit,
  maxRows,
  showDeltaActual = true,
  testId = "evidence-table",
}: Props) {
  const rows = maxRows != null ? outcomes.slice(0, maxRows) : outcomes;
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<EditDraft>({
    period: "",
    guided_low: "",
    guided_high: "",
    actual_value: "",
    source_url: "",
    source_ref: "",
    quote_span: "",
  });

  if (rows.length === 0) {
    return (
      <div className="empty" data-testid="empty-state">
        Insufficient data — no matched guidance outcomes yet.
      </div>
    );
  }

  const startEdit = (idx: number, o: OutcomeView) => {
    setEditingIdx(idx);
    setDraft({
      period: o.period,
      guided_low: o.guided_low != null ? String(o.guided_low) : "",
      guided_high: o.guided_high != null ? String(o.guided_high) : "",
      actual_value: o.actual_value != null ? String(o.actual_value) : "",
      source_url: o.source_url || "",
      source_ref: o.source_ref || "",
      quote_span: o.quote_span || "",
    });
  };

  const saveEdit = (idx: number) => {
    if (!onEdit) return;
    const edits: Record<string, unknown> = {};
    if (draft.period.trim()) edits.period = draft.period.trim();
    if (draft.guided_low.trim() !== "") edits.guided_low = Number(draft.guided_low);
    if (draft.guided_high.trim() !== "") edits.guided_high = Number(draft.guided_high);
    if (draft.guided_low.trim() !== "" && draft.guided_high.trim() !== "") {
      edits.guided_value = (Number(draft.guided_low) + Number(draft.guided_high)) / 2;
    }
    if (draft.actual_value.trim() !== "") edits.actual_value = Number(draft.actual_value);
    edits.source_url = draft.source_url.trim() || null;
    edits.source_ref = draft.source_ref.trim() || null;
    edits.quote_span = draft.quote_span.trim() || null;
    setEditingIdx(null);
    onEdit(idx, edits);
  };

  const showActions = Boolean(onReview || onEdit);
  const colCount = 7 + (showDeltaActual ? 1 : 0) + (showActions ? 1 : 0);

  return (
    <div className="table-scroll">
      <table className="table" data-testid={testId}>
        <thead>
          <tr>
            <th>
              Period <InfoTip termId="period" />
            </th>
            <th>
              Metric <InfoTip termId="metric" />
            </th>
            <th>
              Band <InfoTip termId="band" />
            </th>
            <th>
              Actual <InfoTip termId="actual" />
            </th>
            {showDeltaActual && (
              <th>
                Δ Actual <InfoTip termId="change_trend" />
              </th>
            )}
            <th>
              Label <InfoTip termId="label" />
            </th>
            <th>
              Δ vs guide <InfoTip termId="delta" />
            </th>
            <th>
              Source <InfoTip termId="source" />
            </th>
            {showActions && (
              <th>
                Review <InfoTip termId="review" />
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((o, idx) => (
            <Fragment key={`${o.period}-${o.metric}-${idx}`}>
              <tr>
                <td>{o.period}</td>
                <td>{o.metric}</td>
                <td>
                  {o.guided_low != null && o.guided_high != null
                    ? `${o.guided_low}–${o.guided_high}`
                    : o.guided_value}
                </td>
                <td>{o.actual_value ?? "—"}</td>
                {showDeltaActual && (
                  <td>
                    <ChangeChip
                      value={o.actual_change_pct}
                      horizon={o.actual_change_horizon}
                    />
                  </td>
                )}
                <td>
                  <span className={`pill ${o.label}`}>{o.label}</span>{" "}
                  <InfoTip termId={o.label.toLowerCase()} text={tipForLabel(o.label)} />
                </td>
                <td className="num">{o.delta_pct ?? "—"}</td>
                <td className="evidence-text">
                  {o.citeable === false && (
                    <span className="pill muted" title={o.cite_reason || "not citeable"}>
                      not citeable
                      {o.cite_reason ? ` · ${o.cite_reason}` : ""}
                    </span>
                  )}
                  {o.citeable && o.citation_id && (
                    <div className="citation-id">
                      <code title="Stable citation id">{o.citation_id}</code>
                      {o.doc_id && (
                        <span className="muted" title="Bound document">
                          {" "}
                          · doc {String(o.doc_id).slice(0, 8)}
                          {o.span_start != null && o.span_end != null
                            ? ` [${o.span_start}:{o.span_end}]`
                            : ""}
                        </span>
                      )}
                      {o.source_url && (
                        <>
                          {" "}
                          <a href={o.source_url} target="_blank" rel="noreferrer">
                            Open source
                          </a>
                        </>
                      )}
                    </div>
                  )}
                  {!o.citeable && o.source_url ? (
                    <a href={o.source_url} target="_blank" rel="noreferrer">
                      {o.source_ref || "source"}
                    </a>
                  ) : !o.citeable ? (
                    o.source_ref || "—"
                  ) : null}
                  {o.citeable && o.quote_span ? (
                    <blockquote className="quote-span" cite={o.source_url || undefined}>
                      “{o.quote_span}”
                    </blockquote>
                  ) : null}
                  {!o.citeable && o.cite_reason === "provisional" ? (
                    <div className="muted" style={{ fontSize: 12 }}>
                      Provisional score — no IR quote (not for external citation).
                    </div>
                  ) : null}
                  <div className="muted">{o.guided_text}</div>
                </td>
                {showActions && (
                  <td>
                    <div className="review-actions">
                      {onReview && (
                        <button
                          type="button"
                          className="btn ghost small"
                          onClick={() => onReview(idx, "accept")}
                        >
                          Accept
                        </button>
                      )}
                      {onEdit && (
                        <button
                          type="button"
                          className="btn ghost small"
                          data-testid={`edit-outcome-${idx}`}
                          onClick={() =>
                            editingIdx === idx ? setEditingIdx(null) : startEdit(idx, o)
                          }
                        >
                          {editingIdx === idx ? "Cancel" : "Edit"}
                        </button>
                      )}
                      {onReview && (
                        <button
                          type="button"
                          className="btn ghost small"
                          onClick={() => onReview(idx, "reject")}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
              {editingIdx === idx && onEdit && (
                <tr className="edit-row">
                  <td colSpan={colCount}>
                    <div className="edit-form" data-testid={`edit-form-${idx}`}>
                      <label>
                        <span className="field-label">Period</span>
                        <input
                          value={draft.period}
                          onChange={(e) => setDraft({ ...draft, period: e.target.value })}
                        />
                      </label>
                      <label>
                        <span className="field-label">Guided low</span>
                        <input
                          type="number"
                          value={draft.guided_low}
                          onChange={(e) =>
                            setDraft({ ...draft, guided_low: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        <span className="field-label">Guided high</span>
                        <input
                          type="number"
                          value={draft.guided_high}
                          onChange={(e) =>
                            setDraft({ ...draft, guided_high: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        <span className="field-label">Actual</span>
                        <input
                          type="number"
                          value={draft.actual_value}
                          onChange={(e) =>
                            setDraft({ ...draft, actual_value: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        <span className="field-label">Source URL</span>
                        <input
                          value={draft.source_url}
                          onChange={(e) =>
                            setDraft({ ...draft, source_url: e.target.value })
                          }
                          placeholder="https://…"
                        />
                      </label>
                      <label>
                        <span className="field-label">Source ref</span>
                        <input
                          value={draft.source_ref}
                          onChange={(e) =>
                            setDraft({ ...draft, source_ref: e.target.value })
                          }
                        />
                      </label>
                      <label className="edit-span-full">
                        <span className="field-label">Quote span (citability)</span>
                        <input
                          value={draft.quote_span}
                          onChange={(e) =>
                            setDraft({ ...draft, quote_span: e.target.value })
                          }
                          placeholder="Exact words from the transcript/filing"
                        />
                      </label>
                      <button
                        type="button"
                        className="btn small"
                        data-testid={`save-edit-${idx}`}
                        onClick={() => saveEdit(idx)}
                      >
                        Save edit
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
