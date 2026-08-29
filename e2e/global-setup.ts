import { chromium, type FullConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(ROOT, ".auth");
const AUTH_FILE = path.join(AUTH_DIR, "pilot.json");
const TOKEN_KEY = "intellens.auth.token";
const CONSENT_KEY = "intellens.analytics_consent";
const PREFS_KEY = "intellens.prefs";
const TOUR_KEY = "citealpha.tours.seen.v2";

function abuseAnswer(ch: { prompt: string }): string {
  const m = /What is (\d+) \+ (\d+)\?/.exec(ch.prompt);
  if (!m) {
    throw new Error(`Unexpected abuse prompt: ${ch.prompt}`);
  }
  return String(Number(m[1]) + Number(m[2]));
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL =
    (config.projects[0]?.use?.baseURL as string | undefined) ??
    process.env.E2E_BASE_URL ??
    "http://127.0.0.1:8080";
  const apiURL = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const challengeRes = await fetch(`${apiURL}/api/auth/abuse-challenge`);
  if (!challengeRes.ok) {
    throw new Error(`E2E abuse challenge failed (${challengeRes.status})`);
  }
  const challenge = (await challengeRes.json()) as {
    challenge_id: string;
    prompt: string;
  };

  const email = `e2e-pilot-${Date.now()}@ocotillo.test`;
  const register = await fetch(`${apiURL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "secret99",
      name: "E2E Pilot",
      accept_terms: true,
      account_type: "b2b",
      org_name: "E2E Desk",
      challenge_id: challenge.challenge_id,
      challenge_answer: abuseAnswer(challenge),
    }),
  });
  if (!register.ok) {
    throw new Error(`E2E register failed (${register.status}): ${await register.text()}`);
  }
  const { token } = (await register.json()) as { token: string };
  if (!token) {
    throw new Error("E2E register returned no token");
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await page.goto("/");
  await page.evaluate(
    ({ tkn, tokenKey, consentKey, prefsKey, tourKey }) => {
      localStorage.setItem(tokenKey, tkn);
      localStorage.setItem(consentKey, "denied");
      localStorage.setItem(
        prefsKey,
        JSON.stringify({
          language: "en",
          default_market: "IN",
          default_index: "SENSEX",
          watchlist: [],
          show_demo_tape: true,
          density: "comfortable",
        }),
      );
      localStorage.setItem(
        tourKey,
        JSON.stringify({ welcome_prompt: true, tracker: true }),
      );
    },
    {
      tkn: token,
      tokenKey: TOKEN_KEY,
      consentKey: CONSENT_KEY,
      prefsKey: PREFS_KEY,
      tourKey: TOUR_KEY,
    },
  );
  await context.storageState({ path: AUTH_FILE });
  await browser.close();
}
