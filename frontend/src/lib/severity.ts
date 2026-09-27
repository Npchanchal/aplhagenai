const SEVERITY_LABELS: Record<string, string> = {
  high: "large change",
  medium: "change",
  low: "note",
};

/** Display text for alert severity — describes the size of a guidance event, never a stance on the stock. */
export function severityLabel(severity: string | null | undefined): string {
  if (!severity) return "";
  return SEVERITY_LABELS[severity] ?? severity;
}
