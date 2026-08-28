import { Link } from "react-router-dom";
import { copyrightLine, LEGAL_ENTITY, PRODUCT_NAME } from "../lib/legal";
import { showArchitecturePage } from "../lib/siteFlags";

/** Persistent copyright + legal links — Ocotillo Innovation Private Limited. */
export default function SiteFooter() {
  return (
    <footer className="site-footer" data-testid="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-copy">{copyrightLine()}</p>
        <nav className="site-footer-links" aria-label="Legal">
          <Link to="/terms">Terms of Use</Link>
          <Link to="/privacy">Privacy Notice</Link>
          <Link to="/trust">Trust Center</Link>
          <Link to="/help">Help</Link>
          <Link to="/rankings">GCI Rankings</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/billing">Billing</Link>
          <Link to="/package">Package</Link>
          <Link to="/about">About</Link>
          {showArchitecturePage ? <Link to="/about/architecture">Architecture</Link> : null}
        </nav>
        <p className="muted site-footer-note">
          {PRODUCT_NAME} — factual research product, not investment advice. No Buy / Hold / Sell.
          Owned by {LEGAL_ENTITY}.
        </p>
      </div>
    </footer>
  );
}
