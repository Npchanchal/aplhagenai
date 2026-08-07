import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTour } from "../lib/TourProvider";
import { TOURS, type TourId } from "../lib/tours";

/** Compact launcher in the topnav + optional dropdown of all tours. */
export default function TourMenu() {
  const { startTour, resetSeen, seen } = useTour();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function launch(id: TourId) {
    const tour = TOURS.find((t) => t.id === id);
    if (!tour) return;
    setOpen(false);
    navigate(tour.startRoute);
    // Let route settle then start
    window.setTimeout(() => startTour(id), 120);
  }

  return (
    <div className="tour-menu">
      <button
        type="button"
        className="nav-link tour-trigger"
        data-testid="tour-menu"
        aria-expanded={open}
        title="Guided product tours"
        onClick={() => setOpen((v) => !v)}
      >
        Tours
      </button>
      {open && (
        <div className="tour-menu-dropdown panel" role="menu" data-testid="tour-menu-dropdown">
          <p className="muted" style={{ margin: "0 0 8px", fontSize: 12 }}>
            Walk through each surface. Esc skips.
          </p>
          {TOURS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitem"
              className="tour-menu-item"
              data-testid={`tour-start-${t.id}`}
              onClick={() => launch(t.id)}
            >
              <strong>{t.title}</strong>
              {seen[t.id] ? <span className="pill">seen</span> : null}
              <span className="muted">{t.blurb}</span>
            </button>
          ))}
          <button
            type="button"
            className="btn ghost"
            style={{ width: "100%", marginTop: 8 }}
            data-testid="tour-reset-seen"
            onClick={() => {
              resetSeen();
              setOpen(false);
            }}
          >
            Reset tour progress
          </button>
        </div>
      )}
    </div>
  );
}
