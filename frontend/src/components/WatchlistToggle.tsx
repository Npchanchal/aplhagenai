import type { MouseEvent } from "react";
import { useI18n } from "../i18n";
import { useAuth } from "../lib/auth";

type Props = {
  companyId: string;
  /** Compact control for table rows */
  compact?: boolean;
  className?: string;
};

/** Star toggle — persists to preferences.watchlist (session or local). */
export default function WatchlistToggle({ companyId, compact = false, className }: Props) {
  const { preferences, updatePreferences } = useAuth();
  const list = preferences?.watchlist ?? [];
  const on = list.includes(companyId);
  const { t } = useI18n();
  const label = t(on ? "ui.WatchlistToggle.remove" : "ui.WatchlistToggle.add");

  const toggle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = on ? list.filter((id) => id !== companyId) : [...list, companyId];
    void updatePreferences({ watchlist: next });
  };

  return (
    <button
      type="button"
      className={`watchlist-toggle${on ? " is-on" : ""}${className ? ` ${className}` : ""}`}
      aria-pressed={on}
      aria-label={label}
      title={label}
      data-testid={`watchlist-toggle-${companyId}`}
      onClick={toggle}
    >
      <span aria-hidden="true">{on ? "★" : "☆"}</span>
      {!compact && <span>{t(on ? "ui.WatchlistToggle.watching" : "ui.WatchlistToggle.watch")}</span>}
    </button>
  );
}
