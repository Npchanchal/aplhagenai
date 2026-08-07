import InfoTip from "./InfoTip";
import type { OutcomeView } from "../lib/api";
import { tipForLabel } from "../lib/glossary";

type Props = {
  threads: Record<string, OutcomeView[]>;
  testId?: string;
};

function midpoint(o: OutcomeView): number {
  if (o.guided_low != null && o.guided_high != null) {
    return (o.guided_low + o.guided_high) / 2;
  }
  return o.guided_value;
}

function bandText(o: OutcomeView): string {
  if (o.guided_low != null && o.guided_high != null) {
    return `${o.guided_low}–${o.guided_high}`;
  }
  return String(o.guided_value);
}

type Direction = "stated" | "raised" | "lowered" | "reiterated";

function direction(prev: OutcomeView | null, cur: OutcomeView): Direction {
  if (!prev) return "stated";
  const a = midpoint(prev);
  const b = midpoint(cur);
  if (b > a) return "raised";
  if (b < a) return "lowered";
  return "reiterated";
}

/**
 * Promise Threads — restatement history of the same guidance commitment.
 * Shows how a promise was first stated, then raised / lowered / reiterated,
 * and how it finally resolved (met / missed / exceeded / dropped / pending).
 */
export default function ThreadTimeline({ threads, testId = "thread-timeline" }: Props) {
  const entries = Object.entries(threads)
    .map(([id, rows]) => {
      const sorted = [...rows].sort((a, b) => {
        const ka = a.as_of ?? a.period;
        const kb = b.as_of ?? b.period;
        return ka < kb ? -1 : ka > kb ? 1 : 0;
      });
      return { id, rows: sorted };
    })
    .sort((a, b) => b.rows.length - a.rows.length);

  if (entries.length === 0) {
    return <p className="muted">No guidance threads for this name yet.</p>;
  }

  return (
    <div className="thread-list" data-testid={testId}>
      {entries.map(({ id, rows }) => {
        const last = rows[rows.length - 1];
        return (
          <div className="thread-row" key={id} data-testid={`thread-${id}`}>
            <div className="thread-head">
              <span className="thread-metric">{last.metric.replaceAll("_", " ")}</span>
              <span className="muted thread-id">{id}</span>
              <span className={`pill ${last.label}`}>
                {last.label}
              </span>{" "}
              <InfoTip termId={last.label.toLowerCase()} text={tipForLabel(last.label)} />
            </div>
            <div className="thread-timeline">
              {rows.map((o, i) => {
                const dir = direction(i > 0 ? rows[i - 1] : null, o);
                return (
                  <div className="thread-node-wrap" key={`${o.period}-${i}`}>
                    {i > 0 && <span className="thread-arrow" aria-hidden="true">→</span>}
                    <div className={`thread-node ${dir}`}>
                      <div className="thread-node-period">
                        {o.as_of ? o.as_of.slice(0, 7) : o.period}
                      </div>
                      <div className="thread-node-band">{bandText(o)}</div>
                      <span className={`thread-dir ${dir}`}>{dir}</span>
                    </div>
                  </div>
                );
              })}
              <div className="thread-node-wrap">
                <span className="thread-arrow" aria-hidden="true">→</span>
                <div className="thread-node outcome">
                  <div className="thread-node-period">{last.period}</div>
                  <div className="thread-node-band">
                    {last.actual_value != null ? `actual ${last.actual_value}` : "no actual"}
                  </div>
                  <span className={`pill ${last.label}`}>{last.label}</span>
                </div>
              </div>
            </div>
            <p className="muted thread-quote">{last.guided_text}</p>
          </div>
        );
      })}
    </div>
  );
}
