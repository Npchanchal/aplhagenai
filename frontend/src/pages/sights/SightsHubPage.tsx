import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchSightsMeta, type SightsMeta } from "../../lib/api";
import { useI18n } from "../../i18n";

const FALLBACK: Pick<SightsMeta, "job"> = {
  job: "ui.SightsHubPage.fallbackJob",
};

const QUICK: { to: string; label: string; blurb: string }[] = [
  { to: "/sights/search", label: "ui.SightsHubPage.quick.search.label", blurb: "ui.SightsHubPage.quick.search.blurb" },
  { to: "/sights/ask", label: "ui.SightsHubPage.quick.ask.label", blurb: "ui.SightsHubPage.quick.ask.blurb" },
  { to: "/sights/grid", label: "ui.SightsHubPage.quick.grid.label", blurb: "ui.SightsHubPage.quick.grid.blurb" },
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
  const { t } = useI18n();
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
              ? t("ui.SightsHubPage.apiUnavailableDetail", { message: e.message })
              : t("ui.SightsHubPage.apiUnavailable"),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const job = meta?.job ?? t(FALLBACK.job);
  const brandMap = meta?.brand_map ?? {};

  return (
    <section className="sights-panel" data-testid="sights-hub">
      <p>{job}</p>
      {apiNote && <p className="callout warn">{apiNote}</p>}

      <h2>{t("ui.SightsHubPage.openSurface")}</h2>
      <ul className="sights-quick-list">
        {QUICK.map((q) => (
          <li key={q.to}>
            <Link to={q.to} className="sights-quick-link">
              <strong>{t(q.label)}</strong>
              <span className="muted">{t(q.blurb)}</span>
            </Link>
          </li>
        ))}
      </ul>

      {Object.keys(brandMap).length > 0 && (
        <>
          <h2>{t("ui.SightsHubPage.alsoIn")}</h2>
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
        {t("ui.SightsHubPage.footer.before")}{" "}
        <Link to="/trust">{t("ui.SightsHubPage.footer.trust")}</Link>
        {t("ui.SightsHubPage.footer.middle")}{" "}
        <Link to="/research">{t("nav.research")}</Link>.
      </p>
    </section>
  );
}
