import { describe, expect, it } from "vitest";
import { TOURS, getTour } from "./lib/tours";

describe("site tours", () => {
  it("defines five surface tours with steps", () => {
    expect(TOURS.map((t) => t.id)).toEqual([
      "tracker",
      "dossier",
      "desk",
      "research",
      "about_help",
    ]);
    for (const t of TOURS) {
      expect(t.steps.length).toBeGreaterThanOrEqual(3);
      expect(t.startRoute).toBeTruthy();
      for (const s of t.steps) {
        expect(s.selector).toBeTruthy();
        expect(s.title).toBeTruthy();
        expect(s.body.length).toBeGreaterThan(20);
      }
    }
  });

  it("getTour resolves known ids", () => {
    expect(getTour("tracker")?.title).toMatch(/Tracker/i);
    expect(getTour("desk")?.steps.some((s) => s.search?.includes("corpus"))).toBe(
      true
    );
  });
});
