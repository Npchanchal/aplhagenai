type Props = {
  rows?: number;
  className?: string;
  label?: string;
};

/** Calm loading placeholder for tables / dossier panels. */
export default function Skeleton({
  rows = 6,
  className = "",
  label = "Loading…",
}: Props) {
  return (
    <div
      className={`skeleton-block ${className}`.trim()}
      role="status"
      aria-busy="true"
      aria-label={label}
      data-testid="skeleton"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row" style={{ width: `${88 - (i % 3) * 12}%` }} />
      ))}
    </div>
  );
}
