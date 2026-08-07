/** Score color band for GCI 0–100 displays. */
export function scoreClass(score: number | null | undefined): string {
  if (score === null || score === undefined) return "";
  if (score >= 75) return "good";
  if (score >= 50) return "warn";
  return "bad";
}

export function formatScore(score: number | null | undefined, digits = 1): string {
  if (score === null || score === undefined) return "—";
  return score.toFixed(digits);
}
