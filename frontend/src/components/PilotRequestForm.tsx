import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { trackEvent } from "../lib/analytics";
import { fetchAbuseChallenge, postPilotRequest } from "../lib/api";

type Props = {
  source?: string;
  compact?: boolean;
};

export default function PilotRequestForm({ source = "landing", compact = false }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [firm, setFirm] = useState("");
  const [role, setRole] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [message, setMessage] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [challengePrompt, setChallengePrompt] = useState("");
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadChallenge() {
    try {
      const ch = await fetchAbuseChallenge();
      setChallengeId(ch.challenge_id);
      setChallengePrompt(ch.prompt);
      setChallengeAnswer("");
    } catch {
      setChallengePrompt("Unable to load verification — refresh and try again.");
    }
  }

  useEffect(() => {
    void loadChallenge();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await postPilotRequest({
        name,
        email,
        firm,
        role: role || undefined,
        team_size: teamSize || undefined,
        message: message || undefined,
        challenge_id: challengeId,
        challenge_answer: challengeAnswer,
      });
      trackEvent("pilot_cta", { source, type: "form" });
      setSubmittedEmail(email);
      setSuccess(true);
      setName("");
      setEmail("");
      setFirm("");
      setRole("");
      setTeamSize("");
      setMessage("");
      setChallengeAnswer("");
      void loadChallenge();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit request");
      void loadChallenge();
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className="pilot-form-success" data-testid="pilot-request-success">
        <p>
          <strong>Request received.</strong> Our team will review your pilot request and follow up at{" "}
          <strong>{submittedEmail}</strong>.
        </p>
        <p className="muted">
          You can also review{" "}
          <Link to="/package">packages</Link> or open the{" "}
          <Link to="/trust">Trust Center</Link> while we follow up.
        </p>
        <button type="button" className="btn" onClick={() => setSuccess(false)}>
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form
      className={`auth-form pilot-request-form${compact ? " pilot-request-form--compact" : ""}`}
      onSubmit={(e) => void onSubmit(e)}
      data-testid="pilot-request-form"
    >
      <div className="pilot-form-grid">
        <label>
          Full name
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            data-testid="pilot-name"
          />
        </label>
        <label>
          Work email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            data-testid="pilot-email"
          />
        </label>
        <label>
          Firm / organization
          <input
            type="text"
            required
            value={firm}
            onChange={(e) => setFirm(e.target.value)}
            autoComplete="organization"
            data-testid="pilot-firm"
          />
        </label>
        <label>
          Role
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            autoComplete="organization-title"
            placeholder="Research head, PM, etc."
            data-testid="pilot-role"
          />
        </label>
        <label>
          Team size
          <select value={teamSize} onChange={(e) => setTeamSize(e.target.value)} data-testid="pilot-team-size">
            <option value="">Select…</option>
            <option value="1–5">1–5 analysts</option>
            <option value="6–15">6–15 analysts</option>
            <option value="16–40">16–40 analysts</option>
            <option value="40+">40+ analysts</option>
          </select>
        </label>
      </div>
      <label>
        Coverage / evaluation notes
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Sensex names, compliance questions, timeline, etc."
          data-testid="pilot-message"
        />
      </label>
      {challengePrompt ? (
        <label>
          Verification — {challengePrompt}
          <input
            type="text"
            required
            inputMode="numeric"
            value={challengeAnswer}
            onChange={(e) => setChallengeAnswer(e.target.value)}
            data-testid="pilot-challenge"
          />
        </label>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      <button type="submit" className="btn primary" disabled={busy || !challengeId} data-testid="pilot-submit">
        {busy ? "Sending…" : "Request a pilot"}
      </button>
      <p className="muted pilot-form-note">
        Not investment advice. Requests are reviewed by the CiteAlpha team — no spam lists.
      </p>
    </form>
  );
}
