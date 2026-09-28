type Props = {
  prompt: string;
  answer: string;
  onAnswerChange: (value: string) => void;
  loadError?: string | null;
  id?: string;
  testId?: string;
  /** Must be false when the field shares a <form> with a submit it doesn't gate (e.g. password login). */
  required?: boolean;
};

/** Arithmetic verification shown before register / guest submit. */
export default function AbuseChallengeField({
  prompt,
  answer,
  onAnswerChange,
  loadError,
  id = "abuse-challenge",
  testId = "abuse-challenge",
  required = true,
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
        required={required}
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        data-testid={testId}
        autoComplete="off"
      />
    </label>
  );
}
