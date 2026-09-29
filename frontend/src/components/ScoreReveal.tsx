import { useI18n } from "../i18n";
import { formatCompanyScore, NOT_SCORED_LABEL, scoreClass } from "../lib/score";

type Props = {
  score: number | null | undefined;
  testId?: string;
  size?: "lg" | "md";
};

/** Animated GCI level reveal — presence, not noise. */
export default function ScoreReveal({ score, testId, size = "lg" }: Props) {
  const { t } = useI18n();
  const text = formatCompanyScore(score);
  return (
    <span
      className={`score-reveal score ${scoreClass(score)} size-${size}`}
      data-testid={testId}
    >
      {text === NOT_SCORED_LABEL ? t("ui.ScoreReveal.notScored") : text}
    </span>
  );
}
