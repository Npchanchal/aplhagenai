import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTour } from "../lib/TourProvider";
import { TOURS } from "../lib/tours";

/** First-visit welcome card on Tracker — opt into the Tracker tour. */
export default function TourWelcome() {
  const location = useLocation();
  const { seen, startTour, markWelcomePrompted, activeTourId } = useTour();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (location.pathname !== "/") return;
    if (seen.welcome_prompt || seen.tracker || activeTourId) return;
    const t = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(t);
  }, [location.pathname, seen, activeTourId]);

  if (!open || activeTourId) return null;

  return (
    <div className="tour-welcome" data-testid="tour-welcome" role="dialog" aria-label="Welcome tour">
      <div className="tour-welcome-card panel">
        <p className="page-kicker" style={{ marginTop: 0 }}>
          Guided tours
        </p>
        <h2 style={{ marginTop: 0 }}>See how IntelLens works</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Short walkthroughs of Tracker, dossiers, Desk, Research, and Help — evidence
          first, no Buy/Hold chrome.
        </p>
        <ul className="tour-welcome-list">
          {TOURS.map((t) => (
            <li key={t.id}>
              <strong>{t.title}</strong>
              <span className="muted"> — {t.blurb}</span>
            </li>
          ))}
        </ul>
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
            Start Tracker tour
          </button>
        </div>
      </div>
    </div>
  );
}
