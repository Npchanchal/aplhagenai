/** Guidance → revise → resolve timeline (index of financials for credibility). */

import { useI18n } from "../i18n";
import { useSourceViewer } from "../lib/SourceViewerContext";
import { withTextHighlight } from "../lib/sourceHighlight";
import { metricDisplayName, metricUnit } from "../lib/score";

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

export type RevisionSummary = {
  period: string;
  metric: string;
  count: number;
  direction: string;
  average_abs_move: number;
};

type Props = {
  events?: RevisionEvent[] | null;
  summaries?: RevisionSummary[] | null;
  testId?: string;
};

function moveUnit(metric: string, t: (key: string) => string): string {
  const unit = metricUnit(metric);
  if (unit === "pct") return t("ui.revisionSummary.unit.pct");
  if (unit === "mmt") return t("ui.revisionSummary.unit.mmt");
  if (unit === "units") return t("ui.revisionSummary.unit.units");
  if (unit === "days") return t("ui.revisionSummary.unit.days");
  return unit;
}

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
  summaries,
  testId = "revision-timeline",
}: Props) {
  const { t } = useI18n();
  const { openSource } = useSourceViewer();
  const rows = events || [];
  const stats = summaries || [];
  if (rows.length === 0 && stats.length === 0) {
    return (
      <p className="muted" data-testid={testId}>
        {t("ui.RevisionTimeline.empty")}
      </p>
    );
  }
  return (
    <div data-testid={testId}>
      {stats.length > 0 ? (
        <ul className="about-list" data-testid="revision-summary">
          {stats.map((s) => {
            const directionKey =
              s.direction === "raised" || s.direction === "cut" || s.direction === "unchanged"
                ? s.direction
                : "unchanged";
            return (
              <li key={`${s.period}-${s.metric}`}>
                {t("ui.revisionSummary.line", {
                  period: s.period,
                  metric: metricDisplayName(s.metric),
                  count: s.count,
                  direction: t(`ui.revisionSummary.${directionKey}`),
                  size: s.average_abs_move,
                  unit: moveUnit(s.metric, t),
                })}
              </li>
            );
          })}
        </ul>
      ) : null}
      <ol className="revision-timeline">
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
    </div>
  );
}
