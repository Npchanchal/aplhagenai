import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTour } from "../lib/TourProvider";

/** First-visit welcome card on the GCI Screener; one-time auto-launched walkthrough on the Workbench. */
export default function TourWelcome() {
  const location = useLocation();
  const { seen, startTour, markWelcomePrompted, markSeen, activeTourId } = useTour();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (location.pathname !== "/tracker") return;
    if (seen.welcome_prompt || seen.tracker || activeTourId) return;
    const t = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(t);
  }, [location.pathname, seen, activeTourId]);

  useEffect(() => {
    if (location.pathname !== "/desk") return;
    if (seen.desk || seen.desk_first_run || activeTourId) return;
    // Poll: the Workbench renders only after auth resolves, and not at all behind the plan gate.
    let tries = 0;
    const t = window.setInterval(() => {
      tries += 1;
      if (document.querySelector('[data-testid="desk-page"]')) {
        window.clearInterval(t);
        markSeen("desk_first_run");
        startTour("desk");
      } else if (tries >= 40) {
        window.clearInterval(t);
      }
    }, 400);
    return () => window.clearInterval(t);
  }, [location.pathname, seen, activeTourId, markSeen, startTour]);

  if (!open || activeTourId) return null;

  return (
    <div className="tour-welcome" data-testid="tour-welcome" role="dialog" aria-label="Welcome tour">
      <div className="tour-welcome-card panel">
        <p className="page-kicker" style={{ marginTop: 0 }}>
          Guided tours
        </p>
        <h2 style={{ marginTop: 0 }}>See how CiteAlpha works</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          A short walkthrough of the GCI Screener — evidence first, no Buy/Hold
          chrome. Workbench, Filing Search, Disclosure Explorer, and Help tours live in the
          header or on{" "}
          <Link to="/help#tours">Help</Link>.
        </p>
        <div className="site-tour-actions">
          <button
            type="button"
            className="btn ghost"
            data-testid="tour-welcome-dismiss"
            onClick={() => {
              markWelcomePrompted();
              setOpen(false);
            }}
          >
            Not now
          </button>
          <button
            type="button"
            className="btn"
            data-testid="tour-welcome-start"
            onClick={() => {
              markWelcomePrompted();
              setOpen(false);
              startTour("tracker");
            }}
          >
            Start Screener tour
          </button>
        </div>
      </div>
    </div>
  );
}
