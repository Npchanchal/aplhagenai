import type { CompanySummary } from "../lib/api";

type Props = {
  companies: CompanySummary[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  testId?: string;
};

export default function CompanyPicker({
  companies,
  value,
  onChange,
  label = "Company",
  testId,
}: Props) {
  return (
    <label className="company-picker">
      <span className="field-label">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
      >
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.ticker} — {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
