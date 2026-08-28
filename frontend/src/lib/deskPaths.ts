/**
 * Persona pathways under Products — India equity desks, not industry verticals.
 * Shared by Products page + Products nav submenu.
 */
export type DeskGuide = {
  id: string;
  /** Anchor id on /products (desk-{id}) */
  hash: string;
  title: string;
  blurb: string;
  /** SKU names in portfolio order relevance */
  skus: string[];
  primary: { to: string; label: string };
  links: { to: string; label: string }[];
};

export const DESK_GUIDES: DeskGuide[] = [
  {
    id: "buy-side",
    hash: "desk-buy-side",
    title: "Buy-side",
    blurb:
      "Screen chronic guidance misses and drill into evidence — GCI first, Radar for revisions.",
    skus: ["Score", "Radar"],
    primary: { to: "/tracker", label: "Open Tracker" },
    links: [
      { to: "/products#radar", label: "Radar feed" },
      { to: "/rankings", label: "GCI Rankings" },
    ],
  },
  {
    id: "sell-side",
    hash: "desk-sell-side",
    title: "Sell-side / research ops",
    blurb:
      "Cite primary guidance↔actuals in notes; Research Terminal for cite-only answers.",
    skus: ["Cite", "Score"],
    primary: { to: "/research", label: "Open Research" },
    links: [
      { to: "/sights", label: "Sights" },
      { to: "/tracker", label: "GCI Tracker" },
      { to: "/products", label: "Cite packaging" },
    ],
  },
  {
    id: "quant",
    hash: "desk-quant",
    title: "Quant / data",
    blurb:
      "Point-in-time guidance outcomes and factor export — backtestable, not a tip sheet.",
    skus: ["Data", "Score"],
    primary: { to: "/products#data", label: "Data catalog" },
    links: [
      { to: "/package", label: "API / One-Stop" },
      { to: "/help", label: "API help" },
    ],
  },
  {
    id: "ir-compliance",
    hash: "desk-ir-compliance",
    title: "IR / compliance / credit",
    blurb:
      "Promise ledger and IR Mirror — what was committed, status, and peer context.",
    skus: ["Ledger", "Radar"],
    primary: { to: "/products#ledger", label: "Ledger" },
    links: [
      { to: "/products#radar", label: "Radar" },
      { to: "/trust", label: "Trust Center" },
    ],
  },
];
