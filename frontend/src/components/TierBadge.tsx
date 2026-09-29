import { useI18n } from "../i18n";
import type { ConfidenceTier } from "../lib/api";

type Props = {
  tier?: ConfidenceTier | null;
  testId?: string;
};

/**
 * Confidence tier of a published GCI (W1.3):
 * provisional (< 3 closed periods or 1 metric) · established (≥ 3, ≥ 2 metrics) · deep (≥ 5, ≥ 2).
 * "Metrics" = metrics with ≥ 1 closed reviewed result, composite or context (D-tier, 2026-09-29).
 * Renders nothing when the company is not scored.
 */
export default function TierBadge({ tier, testId }: Props) {
  const { t } = useI18n();
  if (!tier) return null;
  return (
    <span
      className={`tier-badge tier-${tier}`}
      data-testid={testId ?? "tier-badge"}
      title={t(`tier.${tier}.title`)}
    >
      {t(`tier.${tier}`)}
    </span>
  );
}
