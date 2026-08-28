import { beforeEach, describe, expect, it, vi } from "vitest";

const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    },
  });
  vi.stubEnv("VITE_PLAUSIBLE_DOMAIN", "");
  vi.stubEnv("VITE_GA_MEASUREMENT_ID", "");
  vi.resetModules();
});

describe("analytics consent", () => {
  it("stores granted/denied without enabling tags when IDs are unset", async () => {
    const { analyticsConfigured, readAnalyticsConsent, writeAnalyticsConsent } =
      await import("./analytics");

    writeAnalyticsConsent(true);
    expect(readAnalyticsConsent()).toBe(true);
    writeAnalyticsConsent(false);
    expect(readAnalyticsConsent()).toBe(false);
    expect(analyticsConfigured()).toBe(false);
  });
});
