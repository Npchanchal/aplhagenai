import { expect, test } from "@playwright/test";
import { dismissOverlays, seedGuestSession, waitForCompanyTable, waitForDossier } from "../helpers";

const GUEST_ORIGIN = {
  cookies: [] as [],
  origins: [
    {
      origin: process.env.E2E_BASE_URL ?? "http://127.0.0.1:8080",
      localStorage: [
        { name: "intellens.analytics_consent", value: "denied" },
        {
          name: "citealpha.tours.seen.v2",
          value: JSON.stringify({ welcome_prompt: true, tracker: true }),
        },
      ],
    },
  ],
};

test.describe("Guest user journey", () => {
  test.use({ storageState: GUEST_ORIGIN });

  test("landing page visible without redirect", async ({ page }) => {
    await page.goto("/");
    await dismissOverlays(page);
    await expect(page.getByTestId("landing-page")).toBeVisible();
    await expect(page.getByTestId("landing-cta-example")).toBeVisible();
    await expect(page.getByTestId("landing-cta-pilot")).toBeVisible();
  });

  test("landing leads with a cited worked example and honest coverage", async ({ page }) => {
    await page.goto("/");
    await dismissOverlays(page);
    await expect(
      page.getByRole("heading", { level: 1, name: /Did management deliver/ }),
    ).toBeVisible();

    const example = page.getByTestId("landing-worked-example");
    await expect(example.getByTestId("example-label-FY22")).toHaveText("exceeded", {
      timeout: 15_000,
    });
    await expect(example.getByTestId("example-label-FY24")).toHaveText("missed");
    await expect(example.locator('a[href*="infosys.com"]').first()).toBeVisible();

    const exampleBox = await example.boundingBox();
    const defineBox = await page.getByTestId("landing-explain").boundingBox();
    expect(exampleBox!.y).toBeLessThan(defineBox!.y);

    await expect(page.getByTestId("landing-outcome-chips").locator(".pill")).toHaveCount(5);
    await expect(page.getByTestId("landing-method")).toContainText("What counts as guidance");
    await expect(page.getByTestId("coverage-listings")).toContainText("Not for citation");
    await expect(page.getByTestId("coverage-pit")).toContainText("design partners");
    await expect(page.locator('a[href="/api/meta"]')).toHaveCount(0);
    await expect(page.getByTestId("landing-page")).not.toContainText("Nifty names by guidance");

    await page.getByTestId("landing-cta-example").click();
    await expect(page).toHaveURL(/\/companies\/infy$/);
  });

  test("guest session reaches tracker with banner", async ({ page }) => {
    await seedGuestSession(page);
    await waitForCompanyTable(page);
    await expect(page.getByTestId("guest-banner")).toBeVisible();
  });

  test("guest can open dossier and see evidence", async ({ page }) => {
    await seedGuestSession(page);
    await waitForCompanyTable(page);
    await page.getByTestId("company-link-infy").click();
    await waitForDossier(page);
    await expect(page.getByTestId("gci-score")).not.toHaveText("N/A");
  });

  test("desk shows access gate for guest", async ({ page }) => {
    await seedGuestSession(page);
    await page.goto("/desk");
    await dismissOverlays(page);
    await expect(page.getByTestId("desk-access-gate")).toBeVisible({ timeout: 15_000 });
  });

  test("register page loads for guest", async ({ page }) => {
    await page.goto("/register");
    await dismissOverlays(page);
    await expect(page.getByTestId("register-page")).toBeVisible();
    await expect(page.getByTestId("register-submit")).toBeVisible();
  });
});
