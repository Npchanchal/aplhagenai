import { expect, type Page } from "@playwright/test";

/** Dismiss analytics consent and one-time welcome tour if shown. */
export async function dismissOverlays(page: Page): Promise<void> {
  const consent = page.getByRole("dialog", { name: "Analytics cookies" });
  if (await consent.isVisible({ timeout: 1200 }).catch(() => false)) {
    await page.getByRole("button", { name: "Decline" }).click();
    await expect(consent).toBeHidden({ timeout: 3000 });
  }

  const welcome = page.getByTestId("tour-welcome");
  if (await welcome.isVisible({ timeout: 1500 }).catch(() => false)) {
    await page.getByTestId("tour-welcome-dismiss").click();
    await expect(welcome).toBeHidden({ timeout: 3000 });
  }
}

/** Wait for tracker universe table after parallel API calls settle. */
export async function waitForCompanyTable(page: Page): Promise<void> {
  await expect(page.getByTestId("company-table")).toBeVisible({ timeout: 20_000 });
}

/** Wait for company dossier GCI + evidence to finish loading. */
export async function waitForDossier(page: Page): Promise<void> {
  await expect(page.getByTestId("company-name")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("evidence-table")).toBeVisible({ timeout: 20_000 });
}

/** Solve arithmetic abuse challenge when production verification is enabled. */
export async function fillAbuseChallengeIfPresent(page: Page, testId: string): Promise<void> {
  const input = page.getByTestId(testId);
  const visible = await input.isVisible({ timeout: 3000 }).catch(() => false);
  if (!visible) return;
  const label = page.locator(`label:has([data-testid="${testId}"])`);
  const text = await label.textContent();
  const m = text?.match(/What is (\d+) \+ (\d+)\?/);
  if (!m) throw new Error(`Cannot parse abuse challenge from: ${text}`);
  await input.fill(String(parseInt(m[1], 10) + parseInt(m[2], 10)));
}

/** Accept terms, solve verification, and continue as guest from /login. */
export async function continueAsGuestFromLogin(page: Page): Promise<void> {
  await page.locator("#guest-accept-terms").check();
  await fillAbuseChallengeIfPresent(page, "guest-abuse-challenge");
  await page.getByTestId("guest-continue").click();
}

/** Visit a route and assert it loads (no 404 shell). */
export async function assertRouteLoads(
  page: Page,
  spec: {
    path: string;
    testId?: string;
    heading?: RegExp;
    mayRedirect?: boolean;
    redirectTo?: RegExp;
  },
): Promise<void> {
  await page.goto(spec.path);
  await dismissOverlays(page);

  if (spec.mayRedirect && spec.redirectTo) {
    await expect(page).toHaveURL(spec.redirectTo, { timeout: 10_000 });
    return;
  }

  await expect(page.getByRole("heading", { name: "Page not found" })).toHaveCount(0);
  if (spec.testId) {
    await expect(page.getByTestId(spec.testId).first()).toBeVisible({ timeout: 15_000 });
  } else if (spec.heading) {
    await expect(page.getByRole("heading", { name: spec.heading }).first()).toBeVisible({
      timeout: 15_000,
    });
  } else {
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15_000 });
  }
}
