import { formatScore, scoreClass } from "../lib/score";

type Props = {
  score: number | null | undefined;
  testId?: string;
  size?: "lg" | "md";
};

/** Animated GCI level reveal — presence, not noise. */
export default function ScoreReveal({ score, testId, size = "lg" }: Props) {
  return (
    <span
      className={`score-reveal score ${scoreClass(score)} size-${size}`}
      data-testid={testId}
    >
      {formatScore(score)}
    </span>
  );
}
