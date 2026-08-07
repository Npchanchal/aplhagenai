import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import AboutPage from "./pages/AboutPage";
import SessionMenu from "./components/SessionMenu";
import SiteTour from "./components/SiteTour";
import TourMenu from "./components/TourMenu";
import TourWelcome from "./components/TourWelcome";
import CompanyDetailPage from "./pages/CompanyDetailPage";
import DeskPage from "./pages/DeskPage";
import HelpPage from "./pages/HelpPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PackagePage from "./pages/PackagePage";
import RegisterPage from "./pages/RegisterPage";
import ResearchPage from "./pages/ResearchPage";
import TierFeaturesPage from "./pages/TierFeaturesPage";
import { useAuth } from "./lib/auth";
import { useI18n } from "./i18n";
import { tipText } from "./lib/glossary";

const NAV = [
  { to: "/", end: true, labelKey: "nav.tracker" as const, tipId: "tracker" },
  { to: "/desk", end: false, labelKey: "nav.desk" as const, tipId: "desk_sku" },
  { to: "/research", end: false, labelKey: "nav.research" as const, tipId: "research_terminal" },
  { to: "/package", end: false, labelKey: "nav.package" as const, tipId: "one_stop" },
  { to: "/about", end: false, labelKey: "nav.about" as const, tipId: "gci" },
  { to: "/help", end: false, labelKey: "nav.help" as const, tipId: "gci" },
] as const;

export default function App() {
  const { t } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setNavOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="topbar">
        <div className="brand-block">
          <Link to="/" className="brand" aria-label="IntelLens home">
            Intel<span>Lens</span>
          </Link>
          <span className="brand-pitch">{t("brand.pitch")}</span>
        </div>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={navOpen}
          aria-controls="primary-nav"
          data-testid="nav-toggle"
          onClick={() => setNavOpen((v) => !v)}
        >
          <span className="nav-toggle-bars" aria-hidden />
          Menu
        </button>
        <nav
          id="primary-nav"
          className={`topnav ${navOpen ? "open" : ""}`}
          aria-label="Primary"
        >
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={tipText(item.tipId)}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
          <TourMenu />
          <SessionMenu />
          <span className="compliance-micro">{t("compliance.micro")}</span>
        </nav>
      </header>
      {user?.kind === "guest" && (
        <div className="guest-banner" data-testid="guest-banner">
          {t("guest.banner")}{" "}
          <Link to="/register">{t("common.register")}</Link>
        </div>
      )}
      <main id="main" className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/companies/:id" element={<CompanyDetailPage />} />
          <Route path="/desk" element={<DeskPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/package" element={<PackagePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/about/tiers" element={<TierFeaturesPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
      <TourWelcome />
      <SiteTour />
    </div>
  );
}
