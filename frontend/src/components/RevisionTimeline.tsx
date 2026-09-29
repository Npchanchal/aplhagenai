/** Guidance → revise → resolve timeline (index of financials for credibility). */

import { useI18n } from "../i18n";
import { useSourceViewer } from "../lib/SourceViewerContext";
import { withTextHighlight } from "../lib/sourceHighlight";
import { metricDisplayName } from "../lib/score";

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

const KIND_LABEL_KEY: Record<string, string> = {
  stated: "ui.RevisionTimeline.kind.stated",
  revised_up: "ui.RevisionTimeline.kind.revised_up",
  revised_down: "ui.RevisionTimeline.kind.revised_down",
  reiterated: "ui.RevisionTimeline.kind.reiterated",
  withdrawn: "ui.RevisionTimeline.kind.withdrawn",
  restatement: "ui.RevisionTimeline.kind.restatement",
  resolved_met: "ui.RevisionTimeline.kind.resolved_met",
  resolved_exceeded: "ui.RevisionTimeline.kind.resolved_exceeded",
  resolved_missed: "ui.RevisionTimeline.kind.resolved_missed",
  RESOLVED_EXCEEDED: "ui.RevisionTimeline.kind.resolved_exceeded",
  RESOLVED_MET: "ui.RevisionTimeline.kind.resolved_met",
  RESOLVED_MISSED: "ui.RevisionTimeline.kind.resolved_missed",
};

export default function RevisionTimeline({
  events,
  testId = "revision-timeline",
}: Props) {
  const { t } = useI18n();
  const { openSource } = useSourceViewer();
  const rows = events || [];
  if (rows.length === 0) {
    return (
      <p className="muted" data-testid={testId}>
        {t("ui.RevisionTimeline.empty")}
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
              <span className="revision-kind">{KIND_LABEL_KEY[kind] ? t(KIND_LABEL_KEY[kind]) : kind.replace(/_/g, " ")}</span>
              <time>{e.as_of || e.period}</time>
              {e.metric ? <span className="revision-metric">{metricDisplayName(e.metric)}</span> : null}
            </div>
            <p>{e.detail}</p>
            {e.source_url ? (
              <button
                type="button"
                className="linkish"
                onClick={() =>
                  openSource({
                    title: e.metric || t("ui.RevisionTimeline.sourceTitle"),
                    source_url: e.source_url,
                    highlight_url: withTextHighlight(e.source_url, e.detail),
                    quote: e.detail,
                  })
                }
              >
                {t("ui.RevisionTimeline.source")}
              </button>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
