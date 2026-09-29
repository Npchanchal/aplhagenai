import { expect, test } from "@playwright/test";
import { dismissOverlays, waitForDossier } from "../helpers";

const GUEST_ORIGIN = {
  cookies: [] as [],
  origins: [
    {
      origin: process.env.E2E_BASE_URL ?? "http://127.0.0.1:8080",
      localStorage: [
        { name: "intellens.analytics_consent", value: "denied" },
        {
          name: "citealpha.tours.seen.v2",
          value: JSON.stringify({ welcome_prompt: true, tracker: true, desk_first_run: true }),
        },
      ],
    },
  ],
};

test.use({ storageState: GUEST_ORIGIN });

test("hand-labeled dossier is indexable with GCI title", async ({ page }) => {
  await page.goto("/companies/infy");
  await dismissOverlays(page);
  await waitForDossier(page);
  await expect.poll(async () => page.title()).toMatch(
    /Infosys — Guidance Credibility Index \(GCI\) 76\.5/,
  );
  const robots = page.locator('meta[name="robots"]');
  await expect(robots).toHaveAttribute("content", /index,follow/);
});
