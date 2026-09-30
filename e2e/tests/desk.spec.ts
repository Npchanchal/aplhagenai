import { expect, test } from "@playwright/test";
import { dismissOverlays } from "../helpers";
import { DESK_TABS } from "../routes";

test.describe("Desk — pilot user workflows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/desk?tab=console");
    await dismissOverlays(page);
    await expect(page.getByTestId("desk-page")).toBeVisible({ timeout: 25_000 });
  });

  for (const tab of DESK_TABS) {
    test(`tab ${tab.id} loads panel`, async ({ page }) => {
      await page.goto(`/desk?tab=${tab.id}`);
      await dismissOverlays(page);
      await expect(page.getByTestId(tab.testId)).toBeVisible({ timeout: 30_000 });
    });
  }

  test("console command navigates to review tab", async ({ page }) => {
    await page.goto("/desk?tab=console");
    await dismissOverlays(page);
    await expect(page.getByTestId("desk-console")).toBeVisible({ timeout: 25_000 });
    await page.getByRole("button", { name: "Review", exact: true }).click();
    await expect(page).toHaveURL(/tab=review/);
    await expect(page.getByTestId("review-queue-panel")).toBeVisible();
  });

  test("review queue shows crawl bar", async ({ page }) => {
    await page.goto("/desk?tab=review");
    await dismissOverlays(page);
    await expect(page.getByTestId("review-queue-panel")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("crawl-bar")).toBeVisible();
  });

  test("corpus panel shows coverage metrics", async ({ page }) => {
    await page.goto("/desk?tab=corpus");
    await dismissOverlays(page);
    await expect(page.getByTestId("corpus-coverage")).toBeVisible({ timeout: 30_000 });
  });

  test("reports panel can select template", async ({ page }) => {
    await page.goto("/desk?tab=reports");
    await dismissOverlays(page);
    await expect(page.getByTestId("report-template")).toBeVisible({ timeout: 25_000 });
    await expect(page.getByTestId("generate-report")).toBeVisible();
  });

  test("PIT panel loads API catalog section", async ({ page }) => {
    await page.goto("/desk?tab=pit");
    await dismissOverlays(page);
    await expect(page.getByTestId("pit-panel")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("pit-panel").locator("h2").first()).toBeVisible();
  });

  test("tab bar URL sync — click Review updates query", async ({ page }) => {
    await page.goto("/desk?tab=console");
    await dismissOverlays(page);
    await page.getByRole("tab", { name: "Review queue" }).click();
    await expect(page).toHaveURL(/tab=review/);
    await expect(page.getByTestId("review-queue-panel")).toBeVisible();
  });

  test("first Workbench visit auto-launches the walkthrough once", async ({ page }) => {
    await page.evaluate(() => {
      const key = "citealpha.tours.seen.v2";
      const seen = JSON.parse(localStorage.getItem(key) || "{}");
      delete seen.desk;
      delete seen.desk_first_run;
      localStorage.setItem(key, JSON.stringify(seen));
    });
    await page.reload();
    await expect(page.getByTestId("desk-page")).toBeVisible({ timeout: 25_000 });
    const card = page.getByTestId("site-tour-card");
    await expect(card).toBeVisible({ timeout: 25_000 });
    await expect(card).toContainText("Welcome to the Analyst Workbench");
    await page.getByTestId("tour-skip").click();
    await expect(card).toBeHidden();

    await page.reload();
    await expect(page.getByTestId("desk-page")).toBeVisible({ timeout: 25_000 });
    await page.waitForTimeout(2000);
    await expect(card).toBeHidden();
  });
});
