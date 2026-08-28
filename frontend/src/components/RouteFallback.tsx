/** Shown while a lazy-loaded route chunk downloads. */
export default function RouteFallback() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      Loading…
    </div>
  );
}
