import { expect, test } from "@playwright/test";
import { dismissOverlays } from "../helpers";

test("about, help, trust, and terms surfaces", async ({ page }) => {
  await page.goto("/about");
  await dismissOverlays(page);
  await expect(page.getByTestId("about-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: /About CiteAlpha/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Disclosure Explorer" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Trust Center" }).first()).toBeVisible();

  await page.goto("/help");
  await expect(page.getByTestId("help-page")).toBeVisible();
  await expect(page.getByTestId("tours-hub")).toBeVisible();
  await expect(page.getByTestId("help-tour-sights")).toBeVisible();
  await expect(page.getByTestId("help-search")).toBeVisible();
  await expect(page.getByTestId("help-legal-strip")).toContainText("Terms of Use");
  await expect(page.getByTestId("help-tour-tracker")).toBeVisible();
  await expect(page.getByTestId("help-tour-sights")).toBeEnabled();

  await page.goto("/trust");
  await expect(page.getByTestId("trust-page")).toBeVisible();
  await expect(page.getByTestId("counsel-banner")).toBeVisible();
  await expect(page.getByTestId("trust-counsel")).toBeVisible();
  await expect(page.getByTestId("trust-subprocessors")).toBeVisible();
  await expect(page.getByText("Ocotillo Innovation Private Limited").first()).toBeVisible();

  await page.goto("/terms");
  await expect(page.getByTestId("legal-terms-page")).toBeVisible();
  await expect(page.getByTestId("counsel-banner")).toBeVisible();
  await expect(page.locator(".legal-section")).toHaveCount(12);

  await page.goto("/privacy");
  await expect(page.getByTestId("legal-privacy-page")).toBeVisible();
  await expect(page.getByText(/Digital Personal Data Protection Act/)).toBeVisible();
});
