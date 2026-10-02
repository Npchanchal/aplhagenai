import { useI18n } from "../i18n";

type Props = {
  quality?: string | null;
  testId?: string;
};

/** Hand-labeled vs Demo / listing / scaffold honesty badge. */
export default function QualityBadge({ quality, testId }: Props) {
  const { t } = useI18n();
  const hand = quality === "hand_labeled";
  const extracted = quality === "extracted_verified";
  const scaffold = quality === "market_scaffold";
  const listing =
    quality === "listing_master" || quality === "listing_provisional";
  const provisional = quality === "listing_provisional";
  const cls = hand || extracted ? "hand" : scaffold || listing ? "scaffold" : "demo";
  const label = hand
    ? t("ui.QualityBadge.hand.label")
    : extracted
    ? t("ui.QualityBadge.extracted.label")
    : provisional
    ? t("ui.QualityBadge.provisional.label")
    : listing
      ? t("ui.QualityBadge.listing.label")
      : scaffold
        ? t("ui.QualityBadge.scaffold.label")
        : t("ui.QualityBadge.demo.label");
  const title = hand
    ? t("ui.QualityBadge.hand.title")
    : extracted
      ? t("ui.QualityBadge.extracted.title")
    : provisional
      ? t("ui.QualityBadge.provisional.title")
      : listing
        ? t("ui.QualityBadge.listing.title")
        : scaffold
          ? t("ui.QualityBadge.scaffold.title")
          : t("ui.QualityBadge.demo.title");
  return (
    <span className={`quality-badge ${cls}`} data-testid={testId} title={title}>
      {label}
    </span>
  );
}
