import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTour } from "../lib/TourProvider";
import { TOURS, TOUR_GROUPS, type TourId } from "../lib/tours";
import { useI18n } from "../i18n";

/** Compact launcher in the topnav + optional dropdown of all tours. */
export default function TourMenu() {
  const { t } = useI18n();
  const { startTour, resetSeen, seen } = useTour();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function launch(id: TourId) {
    const tour = TOURS.find((t) => t.id === id);
    if (!tour) return;
    setOpen(false);
    navigate(tour.startRoute);
    window.setTimeout(() => startTour(id), 120);
  }

  return (
    <div className="tour-menu">
      <button
        type="button"
        className="nav-link tour-trigger"
        data-testid="tour-menu"
        aria-expanded={open}
        title={t("ui.TourMenu.title")}
        onClick={() => setOpen((v) => !v)}
      >
        {t("ui.TourMenu.trigger")}
      </button>
      {open && (
        <div className="tour-menu-dropdown panel" role="menu" data-testid="tour-menu-dropdown">
          <p className="muted" style={{ margin: "0 0 8px", fontSize: 12 }}>
            {t("ui.TourMenu.hint")}
          </p>
          {TOUR_GROUPS.map((group) => (
            <div key={group.id}>
              <p className="tour-menu-heading">{group.label}</p>
              {TOURS.filter((tour) => tour.group === group.id).map((tour) => (
                <button
                  key={tour.id}
                  type="button"
                  role="menuitem"
                  className="tour-menu-item"
                  data-testid={`tour-start-${tour.id}`}
                  onClick={() => launch(tour.id)}
                >
                  <strong>{tour.title}</strong>
                  {seen[tour.id] ? <span className="pill">{t("ui.TourMenu.seen")}</span> : null}
                  <span className="muted">{tour.blurb}</span>
                </button>
              ))}
            </div>
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
            {t("ui.TourMenu.reset")}
          </button>
        </div>
      )}
    </div>
  );
}
