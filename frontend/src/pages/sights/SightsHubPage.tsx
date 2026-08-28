import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchSightsMeta, type SightsMeta } from "../../lib/api";

const FALLBACK: Pick<SightsMeta, "job"> = {
  job: "India disclosure research OS — search, cite GenAI, grids, agents",
};

const QUICK: { to: string; label: string; blurb: string }[] = [
  { to: "/sights/search", label: "Search", blurb: "India IR docs + Business Lexicon" },
  { to: "/sights/ask", label: "Ask", blurb: "Cite-only answers — refuses without evidence" },
  { to: "/sights/boards", label: "Boards", blurb: "Watchlist + saved queries" },
  { to: "/sights/field", label: "Field Evidence", blurb: "Labeled outcomes + citation trail" },
  { to: "/sights/grid", label: "Compare Grid", blurb: "Same prompts across names" },
  { to: "/sights/agents", label: "Desk Agents", blurb: "Earnings prep and IC footnotes" },
];

const BRAND_LINKS: Record<string, string> = {
  search: "/sights/search",
  ask: "/sights/ask",
  themes: "/sights/themes",
  street: "/sights/street",
  field: "/sights/field",
  grid: "/sights/grid",
  deep_dive: "/sights/deep-dive",
  agents: "/sights/agents",
  boards: "/sights/boards",
  export: "/sights/export",
};

/** Hub always paints static content; meta API enriches when available. */
export default function SightsHubPage() {
  const [meta, setMeta] = useState<SightsMeta | null>(null);
  const [apiNote, setApiNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await fetchSightsMeta();
        if (!cancelled) {
          setMeta(m);
          setApiNote(null);
        }
      } catch (e) {
        if (!cancelled) {
          setApiNote(
            e instanceof Error
              ? `Catalog API unavailable (${e.message}). Showing offline hub.`
              : "Catalog API unavailable. Showing offline hub.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const job = meta?.job ?? FALLBACK.job;
  const brandMap = meta?.brand_map ?? {};

  return (
    <section className="sights-panel" data-testid="sights-hub">
      <p>{job}</p>
      {apiNote && <p className="callout warn">{apiNote}</p>}

      <h2>Open a surface</h2>
      <ul className="sights-quick-list">
        {QUICK.map((q) => (
          <li key={q.to}>
            <Link to={q.to} className="sights-quick-link">
              <strong>{q.label}</strong>
              <span className="muted">{q.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>

      {Object.keys(brandMap).length > 0 && (
        <>
          <h2>Also in Sights</h2>
          <ul className="sights-brand-list">
            {Object.entries(brandMap).map(([k, v]) => {
              const to = BRAND_LINKS[k];
              return (
                <li key={k}>
                  {to ? <Link to={to}>{v}</Link> : <strong>{v}</strong>}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <p className="muted">
        Cite-only research — not sell-side note redistribution. Policy and refuse list live on the{" "}
        <Link to="/trust">Trust Center</Link>. Research Terminal remains at{" "}
        <Link to="/research">/research</Link>.
      </p>
    </section>
  );
}
