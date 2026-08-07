import { useEffect, useLayoutEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTour } from "../lib/TourProvider";
import { getTour, type TourStep } from "../lib/tours";

type Rect = { top: number; left: number; width: number; height: number };

function waitForSelector(selector: string, waitMs: number): Promise<Element | null> {
  const existing = document.querySelector(selector);
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const el = document.querySelector(selector);
      if (el) {
        resolve(el);
        return;
      }
      if (Date.now() - start >= waitMs) {
        resolve(null);
        return;
      }
      window.requestAnimationFrame(tick);
    };
    tick();
  });
}

function placePopover(
  rect: Rect,
  placement: TourStep["placement"],
  popW: number,
  popH: number
): { top: number; left: number } {
  const gap = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const prefer =
    placement && placement !== "auto"
      ? placement
      : rect.top > vh * 0.45
        ? "top"
        : "bottom";

  let top = rect.top + rect.height + gap;
  let left = rect.left + rect.width / 2 - popW / 2;

  if (prefer === "top") top = rect.top - popH - gap;
  if (prefer === "left") {
    top = rect.top + rect.height / 2 - popH / 2;
    left = rect.left - popW - gap;
  }
  if (prefer === "right") {
    top = rect.top + rect.height / 2 - popH / 2;
    left = rect.left + rect.width + gap;
  }

  top = Math.max(12, Math.min(top, vh - popH - 12));
  left = Math.max(12, Math.min(left, vw - popW - 12));
  return { top, left };
}

export default function SiteTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTourId, stepIndex, nextStep, prevStep, skipTour, finishTour } =
    useTour();
  const [rect, setRect] = useState<Rect | null>(null);
  const [missing, setMissing] = useState(false);
  const [popPos, setPopPos] = useState({ top: 80, left: 24 });

  const tour = activeTourId ? getTour(activeTourId) : undefined;
  const step = tour?.steps[stepIndex];

  useEffect(() => {
    if (!step) return;
    const needRoute = step.route && location.pathname !== step.route;
    const needSearch =
      step.search != null &&
      (location.search || "") !== step.search &&
      step.route &&
      location.pathname === step.route;
    if (needRoute) {
      navigate(`${step.route}${step.search || ""}`);
      return;
    }
    if (needSearch && step.route) {
      navigate(`${step.route}${step.search}`);
    }
  }, [step, location.pathname, location.search, navigate]);

  useLayoutEffect(() => {
    if (!step) {
      setRect(null);
      return;
    }
    let cancelled = false;
    const waitMs = step.waitMs ?? 2500;

    (async () => {
      // allow route/tab paint
      await new Promise((r) => setTimeout(r, 80));
      if (cancelled) return;
      const el = await waitForSelector(step.selector, waitMs);
      if (cancelled) return;
      if (!el) {
        setMissing(true);
        setRect(null);
        return;
      }
      setMissing(false);
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      await new Promise((r) => setTimeout(r, 200));
      if (cancelled) return;
      const r = el.getBoundingClientRect();
      const box = {
        top: r.top,
        left: r.left,
        width: Math.max(r.width, 40),
        height: Math.max(r.height, 32),
      };
      setRect(box);
      setPopPos(placePopover(box, step.placement, 340, 200));
    })();

    function onResize() {
      if (!step) return;
      const el = document.querySelector(step.selector);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const box = {
        top: r.top,
        left: r.left,
        width: Math.max(r.width, 40),
        height: Math.max(r.height, 32),
      };
      setRect(box);
      setPopPos(placePopover(box, step.placement, 340, 200));
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [step, location.pathname, location.search, stepIndex]);

  useEffect(() => {
    if (!activeTourId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") skipTour();
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        nextStep();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevStep();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeTourId, nextStep, prevStep, skipTour]);

  if (!tour || !step) return null;

  const isLast = stepIndex >= tour.steps.length - 1;
  const pad = 6;

  return (
    <div className="site-tour" data-testid="site-tour" role="dialog" aria-modal="true">
      <div className="site-tour-backdrop" onClick={skipTour} aria-hidden />
      {rect && (
        <div
          className="site-tour-spotlight"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
          }}
          aria-hidden
        />
      )}
      <div
        className="site-tour-card panel"
        style={{ top: popPos.top, left: popPos.left }}
        data-testid="site-tour-card"
      >
        <div className="site-tour-meta muted">
          {tour.title} · {stepIndex + 1}/{tour.steps.length}
        </div>
        <h3 style={{ margin: "4px 0 8px" }}>{step.title}</h3>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45 }}>{step.body}</p>
        {missing && (
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            Target not on screen yet — use Next after the page finishes loading, or Skip.
          </p>
        )}
        <div className="site-tour-actions">
          <button type="button" className="btn ghost" onClick={skipTour} data-testid="tour-skip">
            Skip
          </button>
          <div className="site-tour-nav">
            <button
              type="button"
              className="btn ghost"
              disabled={stepIndex === 0}
              onClick={prevStep}
              data-testid="tour-prev"
            >
              Back
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => (isLast ? finishTour() : nextStep())}
              data-testid="tour-next"
            >
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
