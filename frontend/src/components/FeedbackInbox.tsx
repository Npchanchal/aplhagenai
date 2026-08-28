import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchFeedback,
  patchFeedback,
  type FeedbackItem,
} from "../lib/api";

/** Design-partner quality inbox — flags do not mutate GCI. */
export default function FeedbackInbox() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const reload = async () => {
    try {
      const res = await fetchFeedback();
      setItems(res.items || []);
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  return (
    <div className="panel desk-panel" data-testid="feedback-inbox">
      <h2 style={{ marginTop: 0 }}>Partner feedback</h2>
      <p className="muted">
        Disagreements on band / period / label / missing source. Comments stay in the ops inbox —
        they never change a citeable GCI score by themselves.
      </p>
      {err && <p className="error">{err}</p>}
      {items.length === 0 ? (
        <p className="muted">No feedback yet.</p>
      ) : (
        <ul className="org-member-list">
          {items.map((it) => (
            <li key={it.id}>
              <span>
                {it.kind} · {it.company_id || "—"} · {it.period || "—"} · {it.metric || "—"} ·{" "}
                {it.status}
                {it.comment ? ` — ${it.comment.slice(0, 80)}` : ""}
              </span>
              <span className="row gap">
                {it.company_id && (
                  <Link to={`/companies/${it.company_id}`}>Dossier</Link>
                )}
                {it.status === "open" && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      void patchFeedback(it.id, "ack").then(() => reload());
                    }}
                  >
                    Ack
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
