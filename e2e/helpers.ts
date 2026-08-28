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
