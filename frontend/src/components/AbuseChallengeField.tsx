type Props = {
  prompt: string;
  answer: string;
  onAnswerChange: (value: string) => void;
  loadError?: string | null;
  id?: string;
  testId?: string;
};

/** Arithmetic verification shown before register / guest submit. */
export default function AbuseChallengeField({
  prompt,
  answer,
  onAnswerChange,
  loadError,
  id = "abuse-challenge",
  testId = "abuse-challenge",
}: Props) {
  if (loadError) {
    return <p className="error">{loadError}</p>;
  }
  if (!prompt) return null;

  return (
    <label htmlFor={id}>
      Verification — {prompt}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        required
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        data-testid={testId}
        autoComplete="off"
      />
    </label>
  );
}
