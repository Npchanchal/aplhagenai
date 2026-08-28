/** Guidance → revise → resolve timeline (index of financials for credibility). */

import { useSourceViewer } from "../lib/SourceViewerContext";
import { withTextHighlight } from "../lib/sourceHighlight";

export type RevisionEvent = {
  as_of?: string;
  period?: string;
  metric?: string;
  kind?: string;
  label?: string;
  detail?: string;
  severity?: string;
  source_url?: string | null;
  actual_value?: number | null;
  guided_value?: number | null;
};

type Props = {
  events?: RevisionEvent[] | null;
  testId?: string;
};

const KIND_LABEL: Record<string, string> = {
  stated: "Stated",
  revised_up: "Raised",
  revised_down: "Lowered",
  reiterated: "Reiterated",
  withdrawn: "Withdrawn",
  restatement: "Restatement",
  resolved_met: "Met",
  resolved_exceeded: "Exceeded",
  resolved_missed: "Missed",
};

export default function RevisionTimeline({
  events,
  testId = "revision-timeline",
}: Props) {
  const { openSource } = useSourceViewer();
  const rows = events || [];
  if (rows.length === 0) {
    return (
      <p className="muted" data-testid={testId}>
        No revision / restatement events on file for this name.
      </p>
    );
  }
  return (
    <ol className="revision-timeline" data-testid={testId}>
      {rows.map((e, i) => {
        const kind = e.kind || "stated";
        const sev = e.severity || "low";
        return (
          <li key={`${e.as_of}-${e.metric}-${i}`} className={`revision-event severity-${sev}`}>
            <div className="revision-meta">
              <span className="revision-kind">{KIND_LABEL[kind] || kind}</span>
              <time>{e.as_of || e.period}</time>
              {e.metric ? <span className="revision-metric">{e.metric}</span> : null}
            </div>
            <p>{e.detail}</p>
            {e.source_url ? (
              <button
                type="button"
                className="linkish"
                onClick={() =>
                  openSource({
                    title: e.metric || "Revision source",
                    source_url: e.source_url,
                    highlight_url: withTextHighlight(e.source_url, e.detail),
                    quote: e.detail,
                  })
                }
              >
                Source
              </button>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
