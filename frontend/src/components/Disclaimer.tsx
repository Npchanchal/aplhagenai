import { useI18n } from "../i18n";

type Props = {
  compact?: boolean;
  className?: string;
};

/** SEBI-oriented factual-product disclaimer — show near scores and vernacular. */
export default function Disclaimer({ compact = false, className = "" }: Props) {
  const { t } = useI18n();
  if (compact) {
    return (
      <p className={`disclaimer disclaimer-compact ${className}`.trim()} role="note">
        {t("disclaimer.compact")}
      </p>
    );
  }
  return (
    <aside className={`disclaimer ${className}`.trim()} role="note">
      <strong>{t("disclaimer.lead")}</strong> {t("disclaimer.full").replace(t("disclaimer.lead"), "").trim()}
    </aside>
  );
}
