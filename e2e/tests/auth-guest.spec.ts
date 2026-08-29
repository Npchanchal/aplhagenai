import { expect, test } from "@playwright/test";
import {
  continueAsGuestFromLogin,
  dismissOverlays,
  waitForCompanyTable,
  waitForDossier,
} from "../helpers";

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
    await expect(page.getByTestId("landing-cta-tracker")).toBeVisible();
  });

  test("continue as guest from login reaches tracker", async ({ page }) => {
    await page.goto("/login");
    await dismissOverlays(page);
    await expect(page.getByTestId("login-page")).toBeVisible();
    await continueAsGuestFromLogin(page);
    await expect(page).toHaveURL(/\/tracker$/);
    await waitForCompanyTable(page);
  });

  test("guest banner shown on tracker", async ({ page }) => {
    await page.goto("/login");
    await dismissOverlays(page);
    await continueAsGuestFromLogin(page);
    await expect(page.getByTestId("guest-banner")).toBeVisible();
  });

  test("guest can open dossier and see evidence", async ({ page }) => {
    await page.goto("/login");
    await dismissOverlays(page);
    await continueAsGuestFromLogin(page);
    await waitForCompanyTable(page);
    await page.getByTestId("company-link-infy").click();
    await waitForDossier(page);
    await expect(page.getByTestId("gci-score")).not.toHaveText("N/A");
  });

  test("desk shows access gate for guest", async ({ page }) => {
    await page.goto("/login");
    await dismissOverlays(page);
    await continueAsGuestFromLogin(page);
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
