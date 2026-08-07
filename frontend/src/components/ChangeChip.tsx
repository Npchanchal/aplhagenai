type ChangeProps = {
  value?: number | null;
  horizon?: string | null;
  label?: string;
};

/** Compact MoM/QoQ/YoY (or PoP) change chip — primary desk signal next to levels. */
export default function ChangeChip({ value, horizon, label }: ChangeProps) {
  if (value === null || value === undefined) {
    return <span className="change-chip muted">—</span>;
  }
  const cls = value > 0 ? "good" : value < 0 ? "bad" : "";
  const sign = value > 0 ? "+" : "";
  const tag = label || horizon || "Δ";
  return (
    <span className={`change-chip score ${cls}`} title={`${tag} change`}>
      <span className="change-h">{tag}</span> {sign}
      {value.toFixed(1)}%
    </span>
  );
}

export function ChangeTriple(props: {
  wow?: number | null;
  mom?: number | null;
  qoq?: number | null;
  yoy?: number | null;
  pop?: number | null;
  popHorizon?: string | null;
}) {
  const items: { label: string; value?: number | null }[] = [
    { label: "WoW", value: props.wow },
    { label: "MoM", value: props.mom },
    { label: "QoQ", value: props.qoq },
    { label: "YoY", value: props.yoy },
  ];
  const shown = items.filter((i) => i.value !== null && i.value !== undefined);
  if (shown.length === 0 && props.pop != null) {
    return <ChangeChip value={props.pop} horizon={props.popHorizon || "PoP"} />;
  }
  if (shown.length === 0) {
    return <span className="change-chip muted">—</span>;
  }
  return (
    <span className="change-triple">
      {shown.map((i) => (
        <ChangeChip key={i.label} value={i.value} label={i.label} />
      ))}
    </span>
  );
}
