import { useEffect } from "react";

type Props = {
  message: string | null;
  tone?: "info" | "good" | "bad";
  onDismiss: () => void;
  ms?: number;
};

/** Transient action feedback — auto-dismisses so status isn't buried in muted copy. */
export default function Toast({
  message,
  tone = "info",
  onDismiss,
  ms = 4200,
}: Props) {
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(onDismiss, ms);
    return () => window.clearTimeout(t);
  }, [message, ms, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`toast toast-${tone}`}
      role="status"
      aria-live="polite"
      data-testid="toast"
    >
      <span>{message}</span>
      <button type="button" className="toast-dismiss" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
