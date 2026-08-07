import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { GLOSSARY } from "../lib/glossary";

type Props = {
  termId: string;
  /** Optional override when termId is dynamic (e.g. outcome labels). */
  text?: string;
  className?: string;
};

type Place = {
  top: number;
  left: number;
  placement: "above" | "below";
};

const Z = 10050;
const GAP = 8;
const MAX_W = 280;

/**
 * Circular "i" control — tooltip via portal (avoids table/overflow clipping).
 * Hover / focus / click (touch) all work.
 */
export default function InfoTip({ termId, text, className = "" }: Props) {
  const uid = useId();
  const entry = GLOSSARY[termId];
  const tip = text ?? entry?.tip;
  const label = entry?.term ?? termId;
  const btnRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);

  const tipId = `tip-${termId}-${uid.replace(/:/g, "")}`;

  const measure = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bubbleH = bubbleRef.current?.offsetHeight ?? 96;
    const bubbleW = Math.min(MAX_W, bubbleRef.current?.offsetWidth ?? MAX_W);

    const spaceAbove = r.top;
    const spaceBelow = vh - r.bottom;
    const placement: "above" | "below" =
      spaceAbove >= bubbleH + GAP || spaceAbove >= spaceBelow ? "above" : "below";

    let left = r.left + r.width / 2 - bubbleW / 2;
    left = Math.max(12, Math.min(left, vw - bubbleW - 12));

    const top =
      placement === "above" ? r.top - GAP - bubbleH : r.bottom + GAP;

    setPlace({ top: Math.max(8, top), left, placement });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    // Re-measure after bubble paints (height known)
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [open, tip, label, measure]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => {
      if (pinned) measure();
      else {
        setOpen(false);
        setPinned(false);
      }
    };
    const onResize = () => measure();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setPinned(false);
      }
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || bubbleRef.current?.contains(t)) return;
      setOpen(false);
      setPinned(false);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, pinned, measure]);

  if (!tip) return null;

  const show = () => setOpen(true);
  const hide = () => {
    if (!pinned) setOpen(false);
  };
  const togglePin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPinned((wasPinned) => {
      if (wasPinned) {
        setOpen(false);
        return false;
      }
      setOpen(true);
      return true;
    });
  };

  const bubble =
    open && place
      ? createPortal(
          <span
            ref={bubbleRef}
            role="tooltip"
            id={tipId}
            className={`info-tip-bubble info-tip-bubble--portal info-tip-bubble--${place.placement}${open ? " is-open" : ""}`}
            style={{
              top: place.top,
              left: place.left,
              zIndex: Z,
            }}
          >
            <strong className="info-tip-title">{label}</strong>
            {tip}
          </span>,
          document.body
        )
      : open
        ? createPortal(
            // First paint before measure — offscreen measure pass
            <span
              ref={bubbleRef}
              role="tooltip"
              id={tipId}
              className="info-tip-bubble info-tip-bubble--portal is-open info-tip-bubble--measure"
              style={{ top: -9999, left: -9999, zIndex: Z }}
            >
              <strong className="info-tip-title">{label}</strong>
              {tip}
            </span>,
            document.body
          )
        : null;

  return (
    <span className={`info-tip ${className}`.trim()}>
      <button
        ref={btnRef}
        type="button"
        className={`info-tip-btn${pinned ? " is-pinned" : ""}`}
        aria-label={`About ${label}`}
        aria-describedby={open ? tipId : undefined}
        aria-expanded={open}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={togglePin}
      >
        i
      </button>
      {bubble}
    </span>
  );
}
