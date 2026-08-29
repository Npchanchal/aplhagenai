import { expect, test } from "@playwright/test";
import { dismissOverlays } from "../helpers";
import { SIGHTS_ROUTES } from "../routes";

test.describe("Sights — India disclosure research", () => {
  test("hub shows primary nav links", async ({ page }) => {
    await page.goto("/sights");
    await dismissOverlays(page);
    await expect(page.getByTestId("sights-hub")).toBeVisible();
    for (const label of ["Search", "Ask", "Boards"]) {
      await expect(page.getByRole("link", { name: label, exact: true }).first()).toBeVisible();
    }
  });

  for (const spec of SIGHTS_ROUTES) {
    test(`${spec.path} renders panel`, async ({ page }) => {
      await page.goto(spec.path);
      await dismissOverlays(page);
      await expect(page.getByTestId("sights-shell")).toBeVisible();
      if (spec.testId) {
        await expect(page.getByTestId(spec.testId)).toBeVisible({ timeout: 15_000 });
      }
    });
  }

  test("in-shell nav switches routes", async ({ page }) => {
    await page.goto("/sights");
    await dismissOverlays(page);
    await page.getByRole("link", { name: "Search", exact: true }).first().click();
    await expect(page).toHaveURL(/\/sights\/search$/);
    await expect(page.getByTestId("sights-search")).toBeVisible();
    await page.getByRole("link", { name: "Ask", exact: true }).first().click();
    await expect(page).toHaveURL(/\/sights\/ask$/);
    await expect(page.getByTestId("sights-ask")).toBeVisible();
  });

  test("search panel accepts query", async ({ page }) => {
    await page.goto("/sights/search");
    await dismissOverlays(page);
    const input = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    if (await input.isVisible()) {
      await input.fill("margin guidance");
      await input.press("Enter");
    }
    await expect(page.getByTestId("sights-search")).toBeVisible();
  });
});
