import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, Link } from "react-router-dom";
import BrandLogo from "./components/BrandLogo";
import SessionMenu from "./components/SessionMenu";
import SiteFooter from "./components/SiteFooter";
import SiteTour from "./components/SiteTour";
import TourWelcome from "./components/TourWelcome";
import LandingPage from "./pages/LandingPage";
import NotFoundPage from "./pages/NotFoundPage";
import RouteFallback from "./components/RouteFallback";
import PageAnalytics from "./components/PageAnalytics";
import ConsentBanner from "./components/ConsentBanner";
import SeoHead from "./components/SeoHead";
import { useAuth } from "./lib/auth";
import { useI18n } from "./i18n";
import { showArchitecturePage } from "./lib/siteFlags";
import NavMenu from "./components/NavMenu";
import SightsLayout from "./pages/sights/SightsLayout";
import SightsHubPage from "./pages/sights/SightsHubPage";

const AboutPage = lazy(() => import("./pages/AboutPage"));
const CompanyDetailPage = lazy(() => import("./pages/CompanyDetailPage"));
const DeskPage = lazy(() => import("./pages/DeskPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const CitationPage = lazy(() => import("./pages/CitationPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const PackagePage = lazy(() => import("./pages/PackagePage"));
const PilotRequestPage = lazy(() => import("./pages/PilotRequestPage"));
const PressPage = lazy(() => import("./pages/PressPage"));
const AnswersPage = lazy(() => import("./pages/AnswersPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ResearchPage = lazy(() => import("./pages/ResearchPage"));
const TierFeaturesPage = lazy(() => import("./pages/TierFeaturesPage"));
const RankingsPage = lazy(() => import("./pages/RankingsPage"));
const AcceptInvitePage = lazy(() => import("./pages/AcceptInvitePage"));
const BillingPage = lazy(() => import("./pages/BillingPage"));
import AdminPortalPage from "./pages/AdminPortalPage";
const TrustPage = lazy(() => import("./pages/TrustPage"));
const ArchitecturePage = lazy(() => import("./pages/ArchitecturePage"));
const BlogIndexPage = lazy(() => import("./pages/BlogIndexPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const SightsBoardsPage = lazy(() => import("./pages/sights/SightsBoardsPage"));
const SightsSearchAsk = lazy(() =>
  import("./pages/sights/SightsSearchAsk").then((m) => ({
    default: m.SightsSearchPage,
  })),
);
const SightsAskPage = lazy(() =>
  import("./pages/sights/SightsSearchAsk").then((m) => ({
    default: m.SightsAskPage,
  })),
);
const SightsThemesPage = lazy(() =>
  import("./pages/sights/SightsEvidencePages").then((m) => ({
    default: m.SightsThemesPage,
  })),
);
const SightsStreetPage = lazy(() =>
  import("./pages/sights/SightsEvidencePages").then((m) => ({
    default: m.SightsStreetPage,
  })),
);
const SightsFieldPage = lazy(() =>
  import("./pages/sights/SightsEvidencePages").then((m) => ({
    default: m.SightsFieldPage,
  })),
);
const SightsGridPage = lazy(() =>
  import("./pages/sights/SightsAdvancedPages").then((m) => ({
    default: m.SightsGridPage,
  })),
);
const SightsDeepDivePage = lazy(() =>
  import("./pages/sights/SightsAdvancedPages").then((m) => ({
    default: m.SightsDeepDivePage,
  })),
);
const SightsFundamentalsPage = lazy(() =>
  import("./pages/sights/SightsAdvancedPages").then((m) => ({
    default: m.SightsFundamentalsPage,
  })),
);
const SightsAgentsPage = lazy(() =>
  import("./pages/sights/SightsAdvancedPages").then((m) => ({
    default: m.SightsAgentsPage,
  })),
);
const SightsExportPage = lazy(() =>
  import("./pages/sights/SightsAdvancedPages").then((m) => ({
    default: m.SightsExportPage,
  })),
);
const SightsSettingsPage = lazy(() =>
  import("./pages/sights/SightsAdvancedPages").then((m) => ({
    default: m.SightsSettingsPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("./pages/AuthRecoveryPages").then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import("./pages/AuthRecoveryPages").then((m) => ({ default: m.ResetPasswordPage })),
);
const VerifyEmailPage = lazy(() =>
  import("./pages/AuthRecoveryPages").then((m) => ({ default: m.VerifyEmailPage })),
);
const AccountSettingsPage = lazy(() => import("./pages/AccountSettingsPage"));
const OrgSettingsPage = lazy(() => import("./pages/OrgSettingsPage"));

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
      <SeoHead />
      <PageAnalytics />
      <a href="#main" className="skip-link">
        {t("app.skipToContent")}
      </a>
      <header className="topbar">
        <div className="brand-block">
          <BrandLogo />
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
          {t("app.menu")}
        </button>
        <nav
          id="primary-nav"
          className={`topnav ${navOpen ? "open" : ""}`}
          aria-label="Primary"
        >
          <NavMenu />
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
      <ConsentBanner />
      <main id="main" className="app-main">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/tracker" element={<HomePage />} />
            <Route path="/c/:citationId" element={<CitationPage />} />
            <Route path="/companies/:id" element={<CompanyDetailPage />} />
            <Route path="/desk" element={<DeskPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/sights" element={<SightsLayout />}>
              <Route index element={<SightsHubPage />} />
              <Route path="search" element={<SightsSearchAsk />} />
              <Route path="ask" element={<SightsAskPage />} />
              <Route path="boards" element={<SightsBoardsPage />} />
              <Route path="themes" element={<SightsThemesPage />} />
              <Route path="street" element={<SightsStreetPage />} />
              <Route path="field" element={<SightsFieldPage />} />
              <Route path="grid" element={<SightsGridPage />} />
              <Route path="deep-dive" element={<SightsDeepDivePage />} />
              <Route path="fundamentals" element={<SightsFundamentalsPage />} />
              <Route path="agents" element={<SightsAgentsPage />} />
              <Route path="export" element={<SightsExportPage />} />
              <Route path="settings" element={<SightsSettingsPage />} />
            </Route>
            <Route path="/package" element={<PackagePage />} />
            <Route path="/pilot" element={<PilotRequestPage />} />
            <Route path="/answers" element={<AnswersPage />} />
            <Route path="/press" element={<PressPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/rankings" element={<RankingsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route
              path="/about/architecture"
              element={
                showArchitecturePage ? <ArchitecturePage /> : <Navigate to="/about" replace />
              }
            />
            <Route path="/about/tiers" element={<TierFeaturesPage />} />
            <Route path="/blog" element={<BlogIndexPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/account" element={<AccountSettingsPage />} />
            <Route path="/org/settings" element={<OrgSettingsPage />} />
            <Route path="/admin" element={<AdminPortalPage />} />
            <Route path="/terms" element={<LegalPage />} />
            <Route path="/privacy" element={<LegalPage />} />
            <Route path="/trust" element={<TrustPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage path={location.pathname} />} />
          </Routes>
        </Suspense>
      </main>
      <SiteFooter />
      <TourWelcome />
      <SiteTour />
    </div>
  );
}
