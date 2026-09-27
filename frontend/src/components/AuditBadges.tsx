/** Red audit chips for GCI v3/v4 deductions (withdrawal / restatement / definition shift). */
export type AuditBadge = {
  flag: string;
  label: string;
  points: number;
  severity: string;
};

type Props = {
  badges?: AuditBadge[] | null;
  deduction?: number | null;
  note?: string | null;
  testId?: string;
};

export default function AuditBadges({
  badges,
  deduction,
  note,
  testId = "audit-badges",
}: Props) {
  const rows = badges || [];
  if (rows.length === 0 && !(deduction && deduction > 0)) {
    return null;
  }
  return (
    <div className="audit-badges" data-testid={testId} title={note || undefined}>
      {rows.map((b) => (
        <span
          key={b.flag}
          className={`audit-badge severity-${b.severity || "medium"}`}
          title={`−${b.points} GCI pts`}
        >
          {b.label}
          <em>−{Number(b.points).toFixed(0)}</em>
        </span>
      ))}
      {deduction != null && deduction > 0 && rows.length === 0 ? (
        <span className="audit-badge severity-high">Audit −{deduction}</span>
      ) : null}
    </div>
  );
}
