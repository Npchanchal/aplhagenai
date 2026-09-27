/**
 * Shared SEO helpers for prerender-seo.mjs (mirrors src/lib/seoJsonLd.ts + marketing bodies).
 */
import fs from "node:fs";
import path from "node:path";

export const SITE = "https://citealpha.com";
export const INDEXNOW_KEY = "citealpha-indexnow-key-2026";

export function loadStructured(root) {
  const raw = fs.readFileSync(path.join(root, "src/lib/seo-structured-data.json"), "utf8");
  return JSON.parse(raw);
}

export function orgJsonLd(data) {
  const org = data.org;
  const social = org.socialProfiles ?? [];
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    legalName: org.legalName,
    url: SITE,
    logo: `${SITE}/citealpha-logo.png`,
    description:
      "Guidance Credibility Index (GCI) — evidence-linked management guidance vs delivery for Indian equity desks. Not investment advice.",
    email: org.email,
    sameAs: [...(org.sameAs || []), ...social.filter(Boolean)],
  };
}

export function websiteJsonLd(data) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CiteAlpha",
    url: `${SITE}/`,
    description:
      "Guidance Credibility Index (GCI) for Indian equity desks — evidence-linked management guidance vs delivery. Not investment advice.",
    inLanguage: "en-IN",
    publisher: {
      "@type": "Organization",
      name: data.org.name,
      legalName: data.org.legalName,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE}/research?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function softwareJsonLd(data) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CiteAlpha Guidance Credibility Index",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE,
    description:
      "Evidence-linked Guidance Credibility Index (GCI) for Indian equity desks. Factual research product; not investment advice.",
    offers: {
      "@type": "Offer",
      url: `${SITE}/package`,
      priceCurrency: "INR",
      availability: "https://schema.org/OnlineOnly",
    },
    provider: {
      "@type": "Organization",
      name: data.org.name,
      legalName: data.org.legalName,
    },
  };
}

export function faqJsonLd(data) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function howToGciJsonLd(data) {
  const howTo = data.howTo;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: howTo.name,
    description: howTo.description,
    step: howTo.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function speakableJsonLd(pageUrl, data) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: pageUrl,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: data.speakable.cssSelector,
    },
  };
}

export function breadcrumbJsonLd(routePath, pageTitle) {
  if (routePath === "/" || routePath.startsWith("/login") || routePath.startsWith("/register")) {
    return null;
  }
  if ((pageTitle || "").includes("Page not found")) return null;
  const items = [{ name: "Home", path: "/" }];
  if (routePath.startsWith("/blog/")) {
    items.push({ name: "Blog", path: "/blog" });
    items.push({ name: String(pageTitle).replace(/ — CiteAlpha.*$/, ""), path: routePath });
  } else if (routePath.startsWith("/about/")) {
    items.push({ name: "About", path: "/about" });
    items.push({ name: String(pageTitle).replace(/ — CiteAlpha$/, ""), path: routePath });
  } else if (routePath.startsWith("/sights/")) {
    items.push({ name: "Disclosure Explorer", path: "/sights" });
    items.push({ name: String(pageTitle).replace(/ — CiteAlpha$/, ""), path: routePath });
  } else {
    items.push({ name: String(pageTitle).replace(/ — CiteAlpha.*$/, ""), path: routePath });
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.path === "/" ? `${SITE}/` : `${SITE}${item.path}`,
    })),
  };
}

export function extraJsonLdForPath(routePath, data, pageTitle) {
  const blocks = [];
  if (routePath === "/") {
    blocks.push(orgJsonLd(data), softwareJsonLd(data), faqJsonLd(data));
  } else if (routePath === "/about" || routePath === "/about/tiers") {
    blocks.push(howToGciJsonLd(data));
  } else if (routePath === "/answers" || routePath === "/help") {
    blocks.push(faqJsonLd(data));
  } else if (routePath === "/blog") {
    blocks.push(orgJsonLd(data));
  }
  if (pageTitle) {
    const crumbs = breadcrumbJsonLd(routePath, pageTitle);
    if (crumbs) blocks.push(crumbs);
  }
  return blocks;
}

export function blogSeoTitle(post) {
  if (post.slug === "what-is-guidance-credibility-index") {
    return "What is a Guidance Credibility Index (GCI)? — CiteAlpha";
  }
  return `${post.title} — CiteAlpha Blog`;
}

/** Parse GLOSSARY + HELP_SECTIONS from glossary.ts for crawlable Help HTML. */
export function parseGlossary(glossaryPath) {
  const src = fs.readFileSync(glossaryPath, "utf8");
  const glossary = {};
  const entryRe =
    /(\w+):\s*\{\s*\n\s*id:\s*"([^"]+)",\s*\n\s*term:\s*"((?:[^"\\]|\\.)*)",\s*\n\s*tip:\s*"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = entryRe.exec(src)) !== null) {
    glossary[m[1]] = {
      id: m[2],
      term: m[3].replace(/\\"/g, '"'),
      tip: m[4].replace(/\\"/g, '"'),
    };
  }

  const sections = [];
  const secRe =
    /\{\s*\n\s*title:\s*"([^"]+)",\s*\n\s*ids:\s*\[([\s\S]*?)\],?\s*\n\s*\}/g;
  while ((m = secRe.exec(src)) !== null) {
    const ids = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    sections.push({ title: m[1], ids });
  }
  return { glossary, sections };
}

export function helpBodyHtml(glossaryPath, esc) {
  const { glossary, sections } = parseGlossary(glossaryPath);
  const parts = [
    `<main>`,
    `<h1>Help &amp; Glossary for GCI Workflows — CiteAlpha</h1>`,
    `<p class="seo-speakable">CiteAlpha Help explains Guidance Credibility Index vocabulary, outcome labels, and desk workflows for Indian equity research. Factual research product — not investment advice.</p>`,
    `<p>Start with the <a href="${SITE}/tracker">GCI Screener</a>, <a href="${SITE}/about">About</a>, or the canonical <a href="${SITE}/blog/what-is-guidance-credibility-index">GCI definition</a>. Contact <a href="mailto:sales@citealpha.com">sales@citealpha.com</a> for pilots.</p>`,
  ];
  for (const sec of sections) {
    const rows = sec.ids.map((id) => glossary[id]).filter(Boolean);
    if (!rows.length) continue;
    parts.push(`<h2>${esc(sec.title)}</h2>`, `<dl>`);
    for (const row of rows) {
      parts.push(`<dt>${esc(row.term)}</dt><dd>${esc(row.tip)}</dd>`);
    }
    parts.push(`</dl>`);
  }
  parts.push(`</main>`);
  return parts.join("\n      ");
}

export function answersBodyHtml(data, esc) {
  const items = data.faq
    .map(
      (f) =>
        `<dt>${esc(f.question)}</dt><dd class="seo-speakable">${esc(f.answer)}</dd>`,
    )
    .join("\n        ");
  return `<main>
      <h1>CiteAlpha Answers — Guidance Credibility Index FAQ</h1>
      <p class="seo-speakable">Short answers about the Guidance Credibility Index (GCI) for Indian equity desks. Factual research — not investment advice.</p>
      <dl class="landing-faq">
        ${items}
      </dl>
      <p><a href="${SITE}/blog/what-is-guidance-credibility-index">Full GCI definition</a> · <a href="${SITE}/blog/sentiment-vs-guidance-delivery">GCI vs sentiment</a> · <a href="${SITE}/pilot">Request a pilot</a></p>
    </main>`;
}

export function marketingBodyHtml(routePath, opts = {}) {
  const { glossaryPath, structuredData, esc } = opts;
  const bodies = {
    "/": `<main>
      <p>GCI by CiteAlpha · Guidance Credibility Index for Indian listed companies</p>
      <h1 class="seo-speakable">Did management deliver on what they promised? We check.</h1>
      <p class="seo-speakable">CiteAlpha's Guidance Credibility Index (GCI) compares what Indian listed management guided to what they later reported. Every score opens to the exchange filing, IR deck, or transcript behind it.</p>
      <p><a href="${SITE}/pilot"><strong>Request a pilot</strong></a> · <a href="${SITE}/companies/infy">Or see a scored company (Infosys)</a></p>
      <p>Built for: <a href="${SITE}/products#desk-buy-side">Buy-side</a> · <a href="${SITE}/products#desk-sell-side">Sell-side research</a> · <a href="${SITE}/products#desk-quant">Quant / data</a> · <a href="${SITE}/products#desk-ir-compliance">IR &amp; compliance</a></p>
      <h2>Worked example: Infosys revenue growth guidance vs actuals</h2>
      <p>Each April, management guided full-year revenue growth in constant currency. Each year links two filed Infosys results releases (SEC Form 6-K): the one that set the guidance and the one that reported the actual.</p>
      <ul>
        <li>FY22 — guided 12–14%, actual 19.7% — <strong>exceeded</strong> (reported 2022-04-13). Guidance given 2021-04-14: <a href="https://www.sec.gov/Archives/edgar/data/1067491/000106749121000030/exv99w01.htm">“Revenue growth guidance of 12%-14% in constant currency”</a> · Actual reported 2022-04-13: <a href="https://www.sec.gov/Archives/edgar/data/1067491/000106749122000020/exv99w01.htm">“Revenues in CC terms grew by 19.7% YoY”</a></li>
        <li>FY23 — guided 13–15%, actual 15.4% — <strong>exceeded</strong> (reported 2023-04-13). Guidance given 2022-04-13: <a href="https://www.sec.gov/Archives/edgar/data/1067491/000106749122000020/exv99w01.htm">“Revenue growth of 13%-15% in constant currency”</a> · Actual reported 2023-04-13: <a href="https://www.sec.gov/Archives/edgar/data/1067491/000106749123000027/exv99w01.htm">“industry-leading growth of 15.4% in constant currency”</a></li>
        <li>FY24 — guided 4–7%, actual 1.4% — <strong>missed</strong> (reported 2024-04-18). Guidance given 2023-04-13: <a href="https://www.sec.gov/Archives/edgar/data/1067491/000106749123000027/exv99w01.htm">“Revenue growth of 4%-7% in constant currency”</a> · Actual reported 2024-04-18: <a href="https://www.sec.gov/Archives/edgar/data/1067491/000106749124000016/exv99w01.htm">“Revenues in CC terms grew by 1.4% YoY”</a></li>
      </ul>
      <p>Why doesn't a big beat score 100? GCI scores how close results came to guidance. Guidance of 12–14% against an actual of 19.7% was well off, so FY22 scores about 62, not 100. Beats never drop below 60; a miss the same distance below the band scores far lower. <a href="${SITE}/companies/infy">Open the full Infosys evidence trail</a>.</p>
      <h2>What is a Guidance Credibility Index?</h2>
      <p>GCI is a 0–100 score of how closely a company's reported results matched its own quantified guidance — revenue bands, margins, volumes, capex. It tracks delivery, not sentiment or share price. Each guided number gets one outcome once the period closes: met, exceeded, missed, dropped, or pending.</p>
      <h2>How we build a score</h2>
      <ol>
        <li><strong>Sources</strong> — NSE and BSE filings, company IR decks and guidance tables, earnings-call transcripts.</li>
        <li><strong>What counts as guidance</strong> — a number or range for a named metric and period. Qualitative commentary is marked unmapped and left out of the score.</li>
        <li><strong>Verification</strong> — an analyst reviews every extracted row. Each row keeps the quote, document link, and date.</li>
        <li><strong>Scoring</strong> — versioned, unit-tested scorer. Open periods stay pending and are excluded. Scores change after a new filing is reviewed, not automatically.</li>
      </ol>
      <h2>Coverage today</h2>
      <ul>
        <li>Sensex-depth companies hand-labeled with cited evidence — the rows meant for citation.</li>
        <li>A smaller set of demo-structured companies (including early Nifty names) — for walkthroughs, not citation.</li>
        <li>Other NSE/BSE listings are browsable with provisional scores built from placeholder outcomes — not for citation.</li>
        <li>Point-in-time API (pit.v1) for design partners; every point is as-of stamped and flagged citeable or not.</li>
      </ul>
      <h2>Explore the product</h2>
      <p>Each tool is labeled by what it does and who can use it today.</p>
      <ul>
        <li><a href="${SITE}/tracker"><strong>GCI Screener</strong></a> (Screen · Live · free preview) — screen covered companies by GCI score and change, with quality badges on every row.</li>
        <li><a href="${SITE}/desk"><strong>Analyst Workbench</strong></a> (Review &amp; export · Live · pilot and paid seats) — check extracted guidance against its source, then export cited reports and point-in-time data.</li>
        <li><a href="${SITE}/research"><strong>Filing Search</strong></a> (Search one company · Live · registered users) — search one company's filings and transcripts; answers only when a source can be cited.</li>
        <li><a href="${SITE}/sights"><strong>Disclosure Explorer</strong></a> (Compare companies · Beta) — compare disclosures across companies with cite-only answers.</li>
        <li><a href="${SITE}/rankings"><strong>Public Snapshot</strong></a> (Share · Live · public, no login) — public GCI snapshot; no recommendation labels.</li>
      </ul>
      <p><a href="${SITE}/answers">FAQ</a> · <a href="${SITE}/package">Packages</a> · <a href="${SITE}/pilot">Request a pilot</a> · <a href="${SITE}/trust">Trust Center</a></p>
    </main>`,
    "/pilot": `<main>
      <h1>Request a CiteAlpha GCI Pilot</h1>
      <p class="seo-speakable">Time-boxed pilot for Indian equity desks: Sensex hand-labeled evidence, the Analyst Workbench, and Filing Search. Share firm details — we follow up within one business day. Not investment advice.</p>
      <p>Pilots include GCI Screener access, evidence trails with quality badges, and optional API discussion. Read the <a href="${SITE}/trust">Trust Center</a> and <a href="${SITE}/blog/what-is-guidance-credibility-index">GCI definition</a> before requesting.</p>
      <p>Contact: <a href="mailto:sales@citealpha.com">sales@citealpha.com</a> · <a href="${SITE}/package">View packages</a></p>
    </main>`,
    "/press": `<main>
      <h1>CiteAlpha Press &amp; Brand — Ocotillo Innovation</h1>
      <p>CiteAlpha is a product of <strong>Ocotillo Innovation Private Limited</strong>. We publish the Guidance Credibility Index (GCI) — evidence-linked management guidance vs delivery for Indian equity desks. Factual research infrastructure; not investment advice.</p>
      <h2>Boilerplate</h2>
      <p cite="https://citealpha.com/blog/what-is-guidance-credibility-index">Guidance Credibility Index (GCI): an evidence-linked score of whether listed management delivered on quantified guidance versus subsequent actuals, with primary sources attached. CiteAlpha · citealpha.com · sales@citealpha.com</p>
      <h2>Key links</h2>
      <ul>
        <li><a href="${SITE}/blog/what-is-guidance-credibility-index">Canonical GCI definition</a></li>
        <li><a href="${SITE}/trust">Trust Center</a></li>
        <li><a href="${SITE}/llms.txt">llms.txt</a> · <a href="${SITE}/ai.txt">AI use policy</a></li>
      </ul>
      <p>Media inquiries: <a href="mailto:sales@citealpha.com">sales@citealpha.com</a></p>
    </main>`,
    "/desk": `<main>
      <h1>Analyst Workbench: Review Guidance Before It Scores — GCI by CiteAlpha</h1>
      <p class="seo-speakable">Workspace where analysts check guidance extracted from filings, review new documents, and export cited reports and point-in-time data for Indian equity research. A short guided walkthrough opens on the first visit. Not investment advice.</p>
      <h2>What the Workbench is for</h2>
      <ul>
        <li>Analyst ops: jump from the GCI Screener to evidence, labeling queue, and vernacular blurbs.</li>
        <li>Corpus management and extract/match review before scores go citeable.</li>
        <li>PIT series and API hooks for platform embed — beside your market terminal.</li>
      </ul>
      <p><a href="${SITE}/tracker">Open GCI Screener</a> · <a href="${SITE}/about/tiers">Tier features</a> · <a href="${SITE}/package">Packages</a></p>
    </main>`,
    "/research": `<main>
      <h1>Filing Search: Cite-Only Search of One Company's Filings — CiteAlpha</h1>
      <p class="seo-speakable">Search one Indian company's IR filings and transcripts with cite-only chat that refuses invented actuals. Complements the GCI Screener — demo tape is not live prices. Not investment advice.</p>
      <h2>Capabilities</h2>
      <ul>
        <li>Filings and concall search with citation ids back to sources.</li>
        <li>Desk snapshot with MoM/QoQ/YoY context beside guidance evidence.</li>
        <li>Watchlist and news — structured for research memos, not retail tips.</li>
      </ul>
      <p><a href="${SITE}/tracker">GCI Screener</a> · <a href="${SITE}/desk">Analyst Workbench</a> · <a href="${SITE}/help">Help &amp; glossary</a></p>
    </main>`,
    "/products": `<main>
      <h1>Product Portfolio: Score, Cite, Disclosure Explorer &amp; More — CiteAlpha</h1>
      <p class="seo-speakable">Score, Cite, Disclosure Explorer, Radar, Ledger, and Data SKUs for Guidance Credibility Index workflows on Indian equity desks. Evidence-first research infrastructure — not Buy/Hold/Sell recommendations.</p>
      <ul>
        <li><strong>Score</strong> — company GCI with evidence trail and PIT history.</li>
        <li><strong>Cite</strong> — citation ids that reopen to NSE/BSE/IR documents.</li>
        <li><strong>Disclosure Explorer</strong> — compare disclosures across Indian companies with cite-only Ask.</li>
        <li><strong>Radar, Ledger, Data</strong> — alerts, audit, and API series for desks and quants.</li>
      </ul>
      <p><a href="${SITE}/package">Packages</a> · <a href="${SITE}/about/tiers">Tier map</a> · <a href="${SITE}/pilot">Request a pilot</a></p>
    </main>`,
    "/rankings": `<main>
      <h1>Public Snapshot: GCI for Indian Listings — GCI by CiteAlpha</h1>
      <p class="seo-speakable">Public, no-login snapshot of Guidance Credibility Index scores for covered Indian listings. Evidence-linked delivery scores with honest quality badges — not investment recommendations.</p>
      <p>The snapshot shows relative guidance credibility within covered cohorts. Every citeable row links to guidance, actuals, outcome labels, and sources. Prefer hand_labeled names when citing in IC materials.</p>
      <p><a href="${SITE}/tracker">Full GCI Screener</a> · <a href="${SITE}/blog/hand-labeled-vs-demo-data">Hand-labeled vs demo data</a> · <a href="${SITE}/about">About GCI</a></p>
    </main>`,
    "/about/tiers": `<main>
      <h1>Tier Features: Screener, Workbench, Filing Search — CiteAlpha</h1>
      <p class="seo-speakable">Feature map across CiteAlpha tiers for Indian equity desks: GCI Screener, Analyst Workbench review workflows, Filing Search, and Enterprise API. Factual research — not investment advice.</p>
      <p>Compare Pilot, Desk, and Enterprise capabilities including PIT API, labeling queue, Disclosure Explorer access, and export hooks. See methodology tables for honest feature status.</p>
      <p><a href="${SITE}/package">Packages</a> · <a href="${SITE}/about#how">How GCI is built</a> · <a href="${SITE}/trust">Trust Center</a></p>
    </main>`,
    "/sights": `<main>
      <h1>Disclosure Explorer: Compare Indian Company Disclosures — CiteAlpha</h1>
      <p class="seo-speakable">Search, cite-only Ask, Compare Grid, and agents across Indian companies' public IR and CiteAlpha evidence for Indian listed companies. Not investment advice.</p>
      <ul>
        <li><a href="${SITE}/sights/search"><strong>Search</strong></a> — IR decks, filings, transcripts with Business Lexicon expand.</li>
        <li><a href="${SITE}/sights/ask"><strong>Ask</strong></a> — cite-only answers; refuses without evidence.</li>
        <li>Boards, themes, and export for institutional disclosure workflows.</li>
      </ul>
      <p><a href="${SITE}/tracker">GCI Screener</a> · <a href="${SITE}/products">Product portfolio</a></p>
    </main>`,
    "/sights/search": `<main>
      <h1>Disclosure Explorer Search: India IR Documents — CiteAlpha</h1>
      <p class="seo-speakable">Search Indian IR decks, NSE/BSE filings, and transcripts with Business Lexicon synonym expand. Evidence-first disclosure research for equity desks.</p>
      <p>Pair search hits with <a href="${SITE}/sights/ask">Ask</a> for cite-only follow-ups. Complements GCI evidence in the GCI Screener.</p>
    </main>`,
    "/sights/ask": `<main>
      <h1>Disclosure Explorer Ask: Cite-Only Answers — CiteAlpha</h1>
      <p class="seo-speakable">Cite-only answers from the India disclosure corpus. Refuses without evidence — built for equity research desks, not retail tips.</p>
      <p>Use alongside <a href="${SITE}/sights/search">Disclosure Explorer Search</a> and <a href="${SITE}/research">Filing Search</a> for filing workflows.</p>
    </main>`,
    "/404": `<main>
      <h1>Page not found</h1>
      <p>That URL is not on CiteAlpha. Use the links below to reach the Guidance Credibility Index (GCI) product, documentation, or support pages.</p>
      <p><a href="${SITE}/tracker"><strong>Open GCI Screener</strong></a> · <a href="${SITE}/">Home</a> · <a href="${SITE}/about">About</a> · <a href="${SITE}/blog">Blog</a> · <a href="${SITE}/help">Help</a> · <a href="${SITE}/answers">FAQ</a> · <a href="${SITE}/pilot">Request a pilot</a></p>
    </main>`,
    "/about": `<main>
      <h1>About CiteAlpha — GCI by Ocotillo Innovation</h1>
      <p>CiteAlpha delivers the Guidance Credibility Index (GCI) — a 0–100 score of whether Indian listed management delivered on quantified guidance. Credit score for promises vs actuals — not sentiment, not a price terminal.</p>
      <h2>How GCI is built</h2>
      <ol>
        <li><strong>Ingest</strong> — IR decks, NSE/BSE filings, transcripts.</li>
        <li><strong>Extract</strong> — quantified guidance with human-in-the-loop review.</li>
        <li><strong>Match</strong> — actuals paired to the same metric and period.</li>
        <li><strong>Score</strong> — outcome labels into company GCI with PIT history.</li>
        <li><strong>Cite</strong> — every point reopens to primary sources.</li>
      </ol>
      <p><a href="${SITE}/tracker">Open GCI Screener</a> · <a href="${SITE}/blog/what-is-guidance-credibility-index">GCI definition</a></p>
    </main>`,
    "/tracker": `<main>
      <h1>GCI Screener: Sensex Guidance Credibility Scores</h1>
      <p class="seo-speakable">Screen Sensex companies by Guidance Credibility Index, with hand-labeled evidence behind every citeable score. Other NSE/BSE listings show provisional scores that are not for citation.</p>
      <ul>
        <li>Company GCI with trend and coverage context.</li>
        <li>Evidence trail: guidance → actual → label → source.</li>
        <li>Honest data-quality badges (hand_labeled vs demo_structured).</li>
      </ul>
      <p><a href="${SITE}/rankings">Public Snapshot</a> · <a href="${SITE}/desk">Analyst Workbench</a> · <a href="${SITE}/blog/what-is-guidance-credibility-index">What is GCI?</a></p>
    </main>`,
    "/trust": `<main>
      <h1>Trust Center for Institutional Buyers — CiteAlpha</h1>
      <p>Security, legal, and citation posture for desks evaluating CiteAlpha (Ocotillo Innovation Private Limited). Honest status — not marketing over-claims.</p>
      <ul>
        <li>Product identity and sales@citealpha.com contact.</li>
        <li>Claim hygiene: evidence trails required; demo vs hand-labeled badged.</li>
        <li>AI use policy: <a href="${SITE}/ai.txt">ai.txt</a> · <a href="${SITE}/llms.txt">llms.txt</a></li>
      </ul>
      <p><a href="${SITE}/package">Packages</a> · <a href="${SITE}/blog/trust-center-checklist-institutional-buyers">Buyer checklist</a></p>
    </main>`,
    "/package": `<main>
      <h1>Package &amp; Pricing for GCI Pilots — CiteAlpha</h1>
      <p class="seo-speakable">Pilot, Desk, and Enterprise API packages for the Guidance Credibility Index. India-first institutional research — not investment advice.</p>
      <ul>
        <li>Buy-side and sell-side desks needing evidence-linked delivery history.</li>
        <li>Platform teams wanting PIT series and citation hooks via API.</li>
        <li>Pilot evaluations with Sensex hand-labeled evidence.</li>
      </ul>
      <p><a href="${SITE}/pilot">Request a pilot</a> · <a href="mailto:sales@citealpha.com">sales@citealpha.com</a></p>
    </main>`,
  };

  if (routePath === "/help" && glossaryPath && esc) {
    return helpBodyHtml(glossaryPath, esc);
  }
  if (routePath === "/answers" && structuredData && esc) {
    return answersBodyHtml(structuredData, esc);
  }
  return bodies[routePath] || null;
}

export function buildImageSitemap(posts) {
  const urls = [
    {
      loc: `${SITE}/`,
      images: [{ loc: `${SITE}/og-image.png`, title: "CiteAlpha Guidance Credibility Index" }],
    },
    {
      loc: `${SITE}/og-image.png`,
      images: [{ loc: `${SITE}/og-image.webp`, title: "CiteAlpha OG image WebP" }],
    },
  ];
  for (const post of posts) {
    urls.push({
      loc: `${SITE}/blog/${post.slug}`,
      images: [{ loc: `${SITE}/og-image.png`, title: post.title }],
    });
  }
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ];
  for (const u of urls) {
    lines.push("  <url>", `    <loc>${u.loc}</loc>`);
    for (const img of u.images) {
      lines.push("    <image:image>", `      <image:loc>${img.loc}</image:loc>`, `      <image:title>${img.title}</image:title>`, "    </image:image>");
    }
    lines.push("  </url>");
  }
  lines.push("</urlset>");
  return `${lines.join("\n")}\n`;
}

export function buildRssFeed(posts) {
  const items = posts
    .slice()
    .sort((a, b) => String(b.updated || b.published).localeCompare(String(a.updated || a.published)))
    .map((p) => {
      const link = `${SITE}/blog/${p.slug}`;
      return `    <item>
      <title>${escXml(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${toRfc822(p.published)}</pubDate>
      <description>${escXml(p.description)}</description>
    </item>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CiteAlpha Research Blog</title>
    <link>${SITE}/blog</link>
    <description>Articles on guidance credibility, Indian earnings evidence trails, and institutional workflows — without Buy/Hold tips.</description>
    <language>en-IN</language>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

function escXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toRfc822(isoDate) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toUTCString();
}

export async function pingIndexNow(urls) {
  if (process.env.SKIP_INDEXNOW === "1") return;
  const host = "citealpha.com";
  const keyLocation = `${SITE}/${INDEXNOW_KEY}.txt`;
  const body = JSON.stringify({
    host,
    key: INDEXNOW_KEY,
    keyLocation,
    urlList: urls.slice(0, 100),
  });
  const endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
  ];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body,
      });
      console.log("indexnow ping:", endpoint, res.status, res.statusText);
    } catch (err) {
      console.warn("indexnow ping skipped:", endpoint, err.message);
    }
  }
}
