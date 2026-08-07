type Point = { label: string; value: number | null | undefined };

type LineChartProps = {
  points: Point[];
  height?: number;
  color?: string;
  yDomain?: [number, number];
  ariaLabel?: string;
  /** Max x-axis tick labels (default 6). First and last always shown. */
  maxXTicks?: number;
};

/** Choose evenly spaced indices including endpoints. */
function tickIndices(count: number, maxTicks: number): number[] {
  if (count <= 0) return [];
  if (count <= maxTicks) return Array.from({ length: count }, (_, i) => i);
  const ticks = Math.max(2, maxTicks);
  const out: number[] = [];
  for (let t = 0; t < ticks; t++) {
    const i = Math.round((t / (ticks - 1)) * (count - 1));
    if (out[out.length - 1] !== i) out.push(i);
  }
  if (out[0] !== 0) out.unshift(0);
  if (out[out.length - 1] !== count - 1) out.push(count - 1);
  return out;
}

function formatXLabel(label: string): string {
  // YYYY-MM → shorter year or YY-MM when dense
  if (/^\d{4}-\d{2}$/.test(label)) {
    const [y, m] = label.split("-");
    if (m === "01" || m === "07") return `${y.slice(2)}-${m}`;
    return `${y.slice(2)}-${m}`;
  }
  if (label.length > 8) return `${label.slice(0, 7)}…`;
  return label;
}

/** Simple SVG line chart — no chart library. */
export function LineChart({
  points,
  height = 160,
  color = "var(--accent)",
  yDomain,
  ariaLabel = "Line chart",
  maxXTicks = 6,
}: LineChartProps) {
  const usable = points.filter((p) => p.value != null) as { label: string; value: number }[];
  if (usable.length < 2) {
    return <p className="muted chart-empty">Not enough points to chart.</p>;
  }
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const w = 560;
  const h = height;
  const vals = usable.map((p) => p.value);
  let ymin = yDomain?.[0] ?? Math.min(...vals);
  let ymax = yDomain?.[1] ?? Math.max(...vals);
  if (ymin === ymax) {
    ymin -= 1;
    ymax += 1;
  }
  const span = ymax - ymin;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const coords = usable.map((p, i) => {
    const x = padL + (i / (usable.length - 1)) * innerW;
    const y = padT + (1 - (p.value - ymin) / span) * innerH;
    return { ...p, x, y, i };
  });
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const area = `${path} L${coords[coords.length - 1].x},${padT + innerH} L${coords[0].x},${padT + innerH} Z`;
  const labelIdx = new Set(tickIndices(coords.length, maxXTicks));
  const showAllDots = coords.length <= 12;

  return (
    <svg
      className="chart-svg"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => {
        const y = padT + t * innerH;
        const v = ymax - t * span;
        return (
          <g key={t}>
            <line
              x1={padL}
              x2={w - padR}
              y1={y}
              y2={y}
              className="chart-grid"
            />
            <text x={padL - 6} y={y + 3} className="chart-axis" textAnchor="end">
              {v.toFixed(0)}
            </text>
          </g>
        );
      })}
      <path d={area} fill="url(#lineFill)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
      {coords.map((c) => {
        const labeled = labelIdx.has(c.i);
        if (!showAllDots && !labeled) return null;
        return (
          <g key={`${c.label}-${c.i}`}>
            <circle cx={c.x} cy={c.y} r={labeled ? 3.5 : 2.5} fill={color} />
            {labeled && (
              <text x={c.x} y={h - 8} className="chart-axis" textAnchor="middle">
                {formatXLabel(c.label)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

type BarRow = { label: string; value: number; color?: string };

type BarChartProps = {
  rows: BarRow[];
  max?: number;
  unit?: string;
  ariaLabel?: string;
};

/** Horizontal bars — good for metric usage / family counts. Supports signed values. */
export function BarChart({ rows, max, unit = "", ariaLabel = "Bar chart" }: BarChartProps) {
  if (!rows.length) {
    return <p className="muted chart-empty">No data.</p>;
  }
  const peak = max ?? Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  return (
    <div className="bar-chart" role="img" aria-label={ariaLabel}>
      {rows.map((r) => {
        const signed = r.value;
        const fill =
          r.color ||
          (signed > 0 ? "var(--good)" : signed < 0 ? "var(--bad)" : "var(--accent)");
        return (
          <div className="bar-row" key={r.label}>
            <div className="bar-label" title={r.label}>
              {r.label}
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.max(2, (Math.abs(signed) / peak) * 100)}%`,
                  background: fill,
                }}
              />
            </div>
            <div className="bar-value">
              {signed > 0 ? "+" : ""}
              {Number.isInteger(signed) ? signed : signed.toFixed(1)}
              {unit}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type DualLineProps = {
  left: { label: string; value: number | null | undefined }[];
  right: { label: string; value: number | null | undefined }[];
  leftName?: string;
  rightName?: string;
  height?: number;
  ariaLabel?: string;
};

/** Dual normalized series (e.g. GCI vs price) — visual correlation, not advice. */
export function DualLineChart({
  left,
  right,
  leftName = "GCI",
  rightName = "Price",
  height = 160,
  ariaLabel = "Dual series",
}: DualLineProps) {
  const n = Math.min(left.length, right.length);
  if (n < 2) return <p className="muted chart-empty">Need ≥2 aligned points.</p>;
  const L = left.slice(-n);
  const R = right.slice(-n);
  const lnums = L.map((p) => p.value).filter((v): v is number => v != null);
  const rnums = R.map((p) => p.value).filter((v): v is number => v != null);
  if (lnums.length < 2 || rnums.length < 2) {
    return <p className="muted chart-empty">Insufficient series.</p>;
  }
  const lmin = Math.min(...lnums);
  const lmax = Math.max(...lnums);
  const rmin = Math.min(...rnums);
  const rmax = Math.max(...rnums);
  const lspan = lmax - lmin || 1;
  const rspan = rmax - rmin || 1;
  const w = 520;
  const pad = 28;
  const norm = (v: number, lo: number, span: number) =>
    height - pad - ((v - lo) / span) * (height - pad * 2);
  const toPts = (
    pts: { value: number | null | undefined }[],
    lo: number,
    span: number
  ) =>
    pts
      .map((p, i) => {
        if (p.value == null) return null;
        const x = pad + (i / (n - 1)) * (w - pad * 2);
        const y = norm(p.value, lo, span);
        return `${x},${y}`;
      })
      .filter(Boolean)
      .join(" ");
  return (
    <div className="dual-line" role="img" aria-label={ariaLabel}>
      <div className="compare-legend">
        <span>
          <i className="swatch entity" /> {leftName}
        </span>
        <span>
          <i className="swatch industry" /> {rightName} (norm.)
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${height}`} height={height}>
        <polyline
          points={toPts(L, lmin, lspan)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <polyline
          points={toPts(R, rmin, rspan)}
          fill="none"
          stroke="var(--muted, #888)"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
      </svg>
    </div>
  );
}

type CompareBarProps = {
  rows: { label: string; left: number; right: number | null; leftLabel?: string; rightLabel?: string }[];
  ariaLabel?: string;
};

/** Dual horizontal bars (entity vs industry). */
export function CompareBars({ rows, ariaLabel = "Comparison chart" }: CompareBarProps) {
  const peak = Math.max(1, ...rows.flatMap((r) => [r.left, r.right ?? 0]));
  return (
    <div className="compare-bars" role="img" aria-label={ariaLabel}>
      <div className="compare-legend">
        <span>
          <i className="swatch entity" /> Entity
        </span>
        <span>
          <i className="swatch industry" /> Industry
        </span>
      </div>
      {rows.map((r) => (
        <div className="compare-row" key={r.label}>
          <div className="bar-label">{r.label.replaceAll("_", " ")}</div>
          <div className="compare-tracks">
            <div className="bar-track">
              <div
                className="bar-fill entity"
                style={{ width: `${(r.left / peak) * 100}%` }}
                title={`Entity ${r.left}`}
              />
            </div>
            <div className="bar-track">
              <div
                className="bar-fill industry"
                style={{ width: `${((r.right ?? 0) / peak) * 100}%` }}
                title={`Industry ${r.right ?? "—"}`}
              />
            </div>
          </div>
          <div className="compare-nums muted">
            {r.left} / {r.right ?? "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

type DonutProps = {
  slices: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
  ariaLabel?: string;
};

export function DonutChart({
  slices,
  size = 140,
  centerLabel,
  ariaLabel = "Donut chart",
}: DonutProps) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <div className="donut-wrap">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={ariaLabel}
      >
        {slices.map((sl) => {
          const len = (sl.value / total) * c;
          const el = (
            <circle
              key={sl.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={sl.color}
              strokeWidth="18"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += len;
          return el;
        })}
        <circle cx={cx} cy={cy} r="34" fill="var(--panel)" />
        {centerLabel && (
          <text x={cx} y={cy + 5} textAnchor="middle" className="donut-center">
            {centerLabel}
          </text>
        )}
      </svg>
      <ul className="donut-legend">
        {slices.map((sl) => (
          <li key={sl.label}>
            <i className="swatch" style={{ background: sl.color }} />
            {sl.label} <strong>{sl.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

type SparkProps = {
  values: (number | null | undefined)[];
  width?: number;
  height?: number;
  color?: string;
};

export function Sparkline({
  values,
  width = 96,
  height = 28,
  color = "var(--accent)",
}: SparkProps) {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length < 2) return null;
  const ymin = Math.min(...nums);
  const ymax = Math.max(...nums);
  const span = ymax - ymin || 1;
  const pts = nums
    .map((v, i) => {
      const x = (i / (nums.length - 1)) * (width - 4) + 2;
      const y = height - 2 - ((v - ymin) / span) * (height - 4);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="sparkline" width={width} height={height} aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

export const FAMILY_COLORS: Record<string, string> = {
  growth: "#0b6b5f",
  margin: "#2a6f97",
  capital: "#8a5a12",
  volume: "#5c4d7a",
  sector: "#3d5a40",
};
