import { describe, expect, it } from "vitest";
import { isChunkLoadError } from "./RouteErrorBoundary";

describe("isChunkLoadError", () => {
  it("recognises stale-chunk failures across browsers", () => {
    expect(
      isChunkLoadError(
        new TypeError(
          "Failed to fetch dynamically imported module: https://citealpha.com/assets/PackagePage-abc.js",
        ),
      ),
    ).toBe(true);
    expect(isChunkLoadError(new TypeError("Importing a module script failed."))).toBe(true);
    expect(isChunkLoadError(new TypeError("error loading dynamically imported module"))).toBe(true);
  });

  it("ignores ordinary render errors", () => {
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
  });
});
