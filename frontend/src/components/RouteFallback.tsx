import { useI18n } from "../i18n";

/** Shown while a lazy-loaded route chunk downloads. */
export default function RouteFallback() {
  const { t } = useI18n();
  return (
    <div className="route-loading" role="status" aria-live="polite">
      {t("common.loading")}
    </div>
  );
}
