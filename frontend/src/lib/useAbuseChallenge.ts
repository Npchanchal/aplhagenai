import { useCallback, useEffect, useState } from "react";
import { fetchAbuseChallenge } from "./api";

/** Soft CAPTCHA for register / guest / pilot — required when INTELLENS_ABUSE_OFF is unset. */
export function useAbuseChallenge() {
  const [challengeId, setChallengeId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const ch = await fetchAbuseChallenge();
      setChallengeId(ch.challenge_id);
      setPrompt(ch.prompt);
      setAnswer("");
      setLoadError(null);
    } catch {
      setChallengeId("");
      setPrompt("");
      setLoadError("Unable to load verification — refresh and try again.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    challengeId,
    prompt,
    answer,
    setAnswer,
    refresh,
    ready: Boolean(challengeId),
    loadError,
  };
}
