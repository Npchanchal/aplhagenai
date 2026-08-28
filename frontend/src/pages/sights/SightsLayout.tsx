import { NavLink, Outlet, useLocation } from "react-router-dom";
import Disclaimer from "../../components/Disclaimer";

const PRIMARY: { to: string; label: string; end?: boolean }[] = [
  { to: "/sights", label: "Hub", end: true },
  { to: "/sights/search", label: "Search" },
  { to: "/sights/ask", label: "Ask" },
  { to: "/sights/boards", label: "Boards" },
];

const MORE: { to: string; label: string }[] = [
  { to: "/sights/themes", label: "Themes" },
  { to: "/sights/street", label: "Street" },
  { to: "/sights/field", label: "Field" },
  { to: "/sights/grid", label: "Grid" },
  { to: "/sights/deep-dive", label: "Deep Dive" },
  { to: "/sights/fundamentals", label: "Fundamentals" },
  { to: "/sights/agents", label: "Agents" },
  { to: "/sights/export", label: "Export" },
  { to: "/sights/settings", label: "Settings" },
];

function linkClass(isActive: boolean) {
  return isActive ? "sights-nav-link active" : "sights-nav-link";
}

/** CiteAlpha Sights shell — India disclosure research OS. */
export default function SightsLayout() {
  const { pathname } = useLocation();
  const moreActive = MORE.some((l) => pathname === l.to || pathname.startsWith(`${l.to}/`));

  return (
    <div className="page sights-page" data-testid="sights-shell">
      <p className="page-kicker">CiteAlpha Sights</p>
      <h1>India disclosure research</h1>
      <p className="lede">
        Search, cite-only answers, boards, and desk agents over public IR and CiteAlpha evidence —
        not sell-side note redistribution.
      </p>
      <nav className="sights-nav" aria-label="Sights sections">
        {PRIMARY.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => linkClass(isActive)}
          >
            {l.label}
          </NavLink>
        ))}
        <details className={`sights-nav-more ${moreActive ? "active" : ""}`}>
          <summary>More</summary>
          <div className="sights-nav-more-list">
            {MORE.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => linkClass(isActive)}>
                {l.label}
              </NavLink>
            ))}
          </div>
        </details>
      </nav>
      <Outlet />
      <Disclaimer compact />
    </div>
  );
}
