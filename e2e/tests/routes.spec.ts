import { expect, test } from "@playwright/test";
import { assertRouteLoads, dismissOverlays } from "../helpers";
import { allCrawlRoutes, CORE_ROUTES, SIGHTS_ROUTES } from "../routes";

test.describe("Route crawl — all public routes load", () => {
  for (const spec of allCrawlRoutes()) {
    test(`loads ${spec.path}`, async ({ page }) => {
      await assertRouteLoads(page, spec);
    });
  }
});

test("404 page shows recovery link to Tracker", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await dismissOverlays(page);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.locator("#main").getByRole("link", { name: "Tracker" }).click();
  await expect(page).toHaveURL(/\/tracker$/);
});

test("/about/architecture redirects to /about in production build", async ({ page }) => {
  await page.goto("/about/architecture");
  await dismissOverlays(page);
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByTestId("about-page")).toBeVisible();
});

test("landing surface cards link to product routes", async ({ browser }) => {
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const page = await context.newPage();
  await page.goto("/");
  await dismissOverlays(page);
  await expect(page.getByTestId("landing-page")).toBeVisible();

  for (const target of ["/tracker", "/desk", "/research", "/sights"]) {
    await page.goto("/");
    await dismissOverlays(page);
    await page.locator(`.landing-card[href="${target}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${target.replace("/", "\\/")}$`));
  }
  await context.close();
});

test("core marketing routes have non-empty document title", async ({ page }) => {
  for (const spec of CORE_ROUTES.filter((r) => !r.mayRedirect)) {
    await page.goto(spec.path);
    await dismissOverlays(page);
    const title = await page.title();
    expect(title.length, `title for ${spec.path}`).toBeGreaterThan(5);
  }
});

test("Sights shell persists across sub-routes", async ({ page }) => {
  for (const spec of SIGHTS_ROUTES) {
    await page.goto(spec.path);
    await dismissOverlays(page);
    await expect(page.getByTestId("sights-shell")).toBeVisible();
    if (spec.testId) {
      await expect(page.getByTestId(spec.testId)).toBeVisible({ timeout: 15_000 });
    }
  }
});
