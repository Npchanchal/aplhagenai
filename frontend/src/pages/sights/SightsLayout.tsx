import { NavLink, Outlet, useLocation } from "react-router-dom";
import Disclaimer from "../../components/Disclaimer";
import { useI18n } from "../../i18n";

const PRIMARY: { to: string; label: string; end?: boolean }[] = [
  { to: "/sights/search", label: "ui.SightsLayout.nav.search" },
  { to: "/sights/ask", label: "ui.SightsLayout.nav.ask" },
  { to: "/sights/grid", label: "ui.SightsLayout.nav.grid" },
];

function linkClass(isActive: boolean) {
  return isActive ? "sights-nav-link active" : "sights-nav-link";
}

/** Disclosure Explorer shell — public nav is Search · Ask · Compare (W7.3). */
export default function SightsLayout() {
  const { t } = useI18n();
  const { pathname } = useLocation();

  return (
    <div className="page sights-page" data-testid="sights-shell">
      <p className="page-kicker">{t("ui.SightsLayout.kicker")}</p>
      <h1>{t("ui.SightsLayout.title")}</h1>
      <p className="lede">{t("ui.SightsLayout.lede")}</p>
      <nav className="sights-nav" aria-label={t("ui.SightsLayout.navAria")}>
        {PRIMARY.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => linkClass(isActive || pathname === l.to)}
          >
            {t(l.label)}
          </NavLink>
        ))}
      </nav>
      <Outlet />
      <Disclaimer compact />
    </div>
  );
}
