/**
 * Capture Tier 1–3 feature screenshots from a live IntelLens URL.
 *
 * Usage (from repo root or e2e — needs Playwright deps from e2e/):
 *   cd e2e && NODE_PATH=./node_modules BASE_URL=$(../scripts/aws-app-url.sh) \
 *     node ../scripts/capture-tier-screenshots.mjs
 */
import { createRequire } from "module";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const requireFromE2e = createRequire(join(__dirname, "../e2e/package.json"));
const { chromium } = requireFromE2e("@playwright/test");

const OUT = join(__dirname, "../docs/screenshots/tiers");
const BASE = process.env.BASE_URL || process.env.E2E_BASE_URL || "http://127.0.0.1:8080";

mkdirSync(OUT, { recursive: true });

async function shot(page, name, locator, pad = 8) {
  const path = join(OUT, `${name}.png`);
  if (locator) {
    const el = typeof locator === "string" ? page.locator(locator).first() : locator;
    if (await el.count()) {
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      const box = await el.boundingBox();
      if (box) {
        await page.screenshot({
          path,
          clip: {
            x: Math.max(0, box.x - pad),
            y: Math.max(0, box.y - pad),
            width: Math.min(1400, box.width + pad * 2),
            height: Math.min(900, Math.max(box.height + pad * 2, 200)),
          },
        });
        console.log("saved", name);
        return;
      }
    }
  }
  await page.screenshot({ path });
  console.log("saved", name, "(full viewport)");
}

async function dismissTours(page) {
  if (await page.locator('[data-testid="tour-welcome-dismiss"]').count()) {
    await page.locator('[data-testid="tour-welcome-dismiss"]').click();
  }
  if (await page.locator('[data-testid="tour-skip"]').count()) {
    await page.locator('[data-testid="tour-skip"]').click();
  }
}

async function main() {
  console.log("BASE_URL=", BASE);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(1000);
  await dismissTours(page);

  await page.locator('[data-testid="entity-search"]').fill("INFY");
  await page.waitForTimeout(800);
  await shot(page, "01-entity-search");
  await shot(page, "00-tracker-overview");

  await page.goto(`${BASE}/companies/infy`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2000);
  await dismissTours(page);

  await shot(page, "06-citability-evidence", '[data-testid="evidence-table"]');
  await shot(page, "04-period-documents", '[data-testid="period-docs"]');
  await shot(page, "02-multi-horizon-deltas", '[data-testid="gci-score"]', 40);
  await shot(page, "02b-horizon-bars", '[data-testid="delta-horizon-chart"]');
  await shot(page, "03-delta-charts-trend", "#trend");
  await shot(page, "07-gci-vs-price", '[data-testid="gci-price-overlay"]');
  await shot(page, "08-lead-lag-granger", '[data-testid="granger-panel"]', 60);
  await shot(page, "09-impact-map", '[data-testid="analytics-panel"]');
  await shot(page, "10-private-notes", '[data-testid="private-notes"]');
  await shot(page, "11-report-templates-dossier", '[data-testid="report-panel"]');

  await page.goto(`${BASE}/desk?tab=review`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(1200);
  await dismissTours(page);
  await shot(page, "05-auto-ingest-crawl", '[data-testid="crawl-bar"]', 40);

  await page.goto(`${BASE}/desk?tab=corpus`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(1200);
  await dismissTours(page);
  await shot(page, "05b-corpus-foundation", '[data-testid="corpus-panel"]');

  await page.goto(`${BASE}/desk?tab=reports`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(1200);
  await dismissTours(page);
  try {
    await page.locator('[data-testid="generate-report"]').first().click({ timeout: 4000 });
    await page.waitForTimeout(2000);
  } catch {
    /* optional */
  }
  await shot(page, "11-report-templates-desk");

  await page.goto(`${BASE}/about`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(600);
  await page.locator("#tiers").scrollIntoViewIfNeeded().catch(() => {});
  await shot(page, "00-about-tiers");

  await browser.close();
  console.log("done →", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
