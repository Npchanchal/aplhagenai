type Props = {
  quality?: string | null;
  testId?: string;
};

/** Hand-labeled vs Demo / listing / scaffold honesty badge. */
export default function QualityBadge({ quality, testId }: Props) {
  const hand = quality === "hand_labeled";
  const scaffold = quality === "market_scaffold";
  const listing =
    quality === "listing_master" || quality === "listing_provisional";
  const provisional = quality === "listing_provisional";
  const cls = hand ? "hand" : scaffold || listing ? "scaffold" : "demo";
  const label = hand
    ? "Hand-labeled"
    : provisional
      ? "Provisional"
      : listing
        ? "Listing"
        : scaffold
          ? "Scaffold"
          : "Demo";
  const title = hand
    ? "Curated from public IR / guidance tables"
    : provisional
      ? "GCI v2 on deterministic provisional guidance/actuals — not for external citation"
      : listing
        ? "NSE/BSE equity master — no GCI until guidance vs actuals are labeled"
        : scaffold
          ? "Market scaffolding — not labeled GCI"
          : "Demo structured seed — not for external citation";
  return (
    <span className={`quality-badge ${cls}`} data-testid={testId} title={title}>
      {label}
    </span>
  );
}
