import { expect, test } from "@playwright/test";

test("US-001/002/003: list companies, open detail, see evidence", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Guidance Credibility Index" })).toBeVisible();
  await expect(page.getByTestId("company-table")).toBeVisible();
  await expect(page.getByTestId("alerts-panel")).toBeVisible();

  await page.getByTestId("company-link-infy").click();
  await expect(page.getByTestId("company-name")).toContainText("Infosys");
  await expect(page.getByTestId("gci-score")).not.toHaveText("N/A");
  await expect(page.getByTestId("evidence-table")).toBeVisible();
  await expect(page.getByTestId("trend-row")).toBeVisible();
  await expect(page.getByTestId("evidence-table").locator("tbody tr").first()).toBeVisible();
});

test("labels and sources visible on detail", async ({ page }) => {
  await page.goto("/companies/infy");
  const table = page.getByTestId("evidence-table");
  await expect(table.locator(".pill").first()).toBeVisible();
  await expect(table).toContainText("Accept");
  const text = await table.innerText();
  expect(
    text.includes("concall") ||
      text.includes("guidance-vs-actuals") ||
      text.includes("INFY"),
  ).toBeTruthy();
});
