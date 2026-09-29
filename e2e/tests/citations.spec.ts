import { expect, test } from "@playwright/test";
import { dismissOverlays, waitForDossier } from "../helpers";

test("citation open source highlights quoted text", async ({ page }) => {
  await page.goto("/companies/infy");
  await dismissOverlays(page);
  await waitForDossier(page);

  const table = page.getByTestId("evidence-table");
  await expect(table).toBeVisible();
  const open = table.getByTestId("open-source-0");
  await expect(open).toBeVisible();
  await open.click();
  const viewer = page.getByTestId("source-viewer");
  await expect(viewer).toBeVisible();
  await expect(page.getByTestId("highlighted-document")).toBeVisible({ timeout: 15_000 });
  const mark = page.getByTestId("source-highlight");
  if (await mark.count()) {
    await expect(mark.first()).toBeVisible();
    const text = (await mark.first().innerText()).trim();
    expect(text.length).toBeGreaterThan(0);
  }
  await page.getByTestId("source-viewer-close").click();
  await expect(viewer).toBeHidden();
});

test("research chat citation marker opens highlighted source", async ({ page }) => {
  await page.goto("/research?tab=chat");
  await dismissOverlays(page);
  await expect(page.getByTestId("research-question")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("research-question").fill("What is margin guidance?");
  await page.getByRole("button", { name: "Ask" }).click();
  const answer = page.getByTestId("research-answer");
  await expect(answer).toBeVisible({ timeout: 20_000 });
  const marker = page.getByTestId("cite-ref-1").first();
  if (await marker.count()) {
    await marker.click();
  } else {
    await page.getByTestId("open-source").first().click();
  }
  await expect(page.getByTestId("source-viewer")).toBeVisible();
  await expect(page.getByTestId("highlighted-document")).toBeVisible({ timeout: 15_000 });
});
