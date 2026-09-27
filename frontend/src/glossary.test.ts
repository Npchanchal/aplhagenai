import { describe, expect, it } from "vitest";
import { GLOSSARY, HELP_SECTIONS, tipText } from "./lib/glossary";

describe("glossary", () => {
  it("does not name competitors in product chrome", () => {
    const blob = Object.values(GLOSSARY)
      .map((g) => `${g.term} ${g.tip}`)
      .join("\n")
      .toLowerCase();
    expect(blob).not.toMatch(/bloomberg/);
    expect(blob).not.toMatch(/alphasense/);
  });

  it("describes scorer v4 for dropped and listings", () => {
    expect(GLOSSARY.dropped.tip).toMatch(/v4/i);
    expect(GLOSSARY.dropped.tip).toMatch(/−15|-15/);
    expect(GLOSSARY.nse_bse.tip).toMatch(/v4/);
    expect(GLOSSARY.exceeded.tip).toMatch(/v4/);
    expect(GLOSSARY.exceeded.tip).toMatch(/60/);
  });

  it("includes Sights, SKUs, rankings, and Trust Center", () => {
    for (const id of ["sights", "score_sku", "radar", "ledger", "data_sku", "rankings", "trust_center"]) {
      expect(GLOSSARY[id]).toBeTruthy();
      expect(tipText(id).length).toBeGreaterThan(20);
    }
    const where = HELP_SECTIONS.find((s) => s.title === "Where to work");
    expect(where?.ids).toEqual(expect.arrayContaining(["sights", "trust_center", "radar"]));
  });
});
