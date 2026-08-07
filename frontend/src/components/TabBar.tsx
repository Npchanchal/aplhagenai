import { useEffect, useRef } from "react";

type Tab = { id: string; label: string; title?: string };

type Props = {
  tabs: readonly Tab[] | Tab[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
};

export default function TabBar({ tabs, active, onChange, ariaLabel = "Sections" }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const activeBtn = root.querySelector<HTMLButtonElement>('[aria-selected="true"]');
    activeBtn?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }, [active]);

  return (
    <div className="tab-bar-scroll">
      <div className="tab-bar" role="tablist" aria-label={ariaLabel} ref={listRef}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            title={t.title}
            aria-selected={active === t.id}
            id={`tab-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            className={`tab-bar-btn ${active === t.id ? "active" : ""}`}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => {
              const ids = tabs.map((x) => x.id);
              const i = ids.indexOf(active);
              if (e.key === "ArrowRight") {
                e.preventDefault();
                onChange(ids[(i + 1) % ids.length]);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                onChange(ids[(i - 1 + ids.length) % ids.length]);
              } else if (e.key === "Home") {
                e.preventDefault();
                onChange(ids[0]);
              } else if (e.key === "End") {
                e.preventDefault();
                onChange(ids[ids.length - 1]);
              }
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
