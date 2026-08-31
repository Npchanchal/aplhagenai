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
    sameAs: org.sameAs,
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

export function extraJsonLdForPath(routePath, data) {
  const blocks = [];
  if (routePath === "/") {
    blocks.push(orgJsonLd(data), softwareJsonLd(data), faqJsonLd(data));
  } else if (routePath === "/about" || routePath === "/about/tiers") {
    blocks.push(howToGciJsonLd(data));
  } else if (routePath === "/answers" || routePath === "/help") {
    blocks.push(faqJsonLd(data));
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
    `<p>Start with <a href="${SITE}/tracker">GCI Tracker</a>, <a href="${SITE}/about">About</a>, or the canonical <a href="${SITE}/blog/what-is-guidance-credibility-index">GCI definition</a>. Contact <a href="mailto:sales@citealpha.com">sales@citealpha.com</a> for pilots.</p>`,
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
      <h1 class="seo-speakable">CiteAlpha — Guidance Credibility Index for Indian Equity Desks</h1>
      <p class="seo-speakable">CiteAlpha publishes an evidence-linked Guidance Credibility Index (GCI): did Indian listed management deliver on quantified guidance? Factual research for institutional desks — not investment advice.</p>
      <h2>What is a Guidance Credibility Index?</h2>
      <p>A GCI measures whether management met, exceeded, missed, dropped, or has pending quantified guidance against later reported actuals, with NSE, BSE, and IR sources attached. It tracks delivery, not sentiment.</p>
      <h2>Product surfaces</h2>
      <ul>
        <li><a href="${SITE}/tracker"><strong>GCI Tracker</strong></a> — screen Sensex and Nifty by guidance credibility.</li>
        <li><a href="${SITE}/desk"><strong>Desk</strong></a> — review queue, corpus, PIT/API workflows.</li>
        <li><a href="${SITE}/research"><strong>Research</strong></a> — cite-only filings search.</li>
        <li><a href="${SITE}/sights"><strong>Sights</strong></a> — India disclosure research OS.</li>
        <li><a href="${SITE}/rankings"><strong>Rankings</strong></a> — public GCI snapshots without recommendation chrome.</li>
      </ul>
      <p><a href="${SITE}/answers">FAQ answers</a> · <a href="${SITE}/package">Packages</a> · <a href="${SITE}/pilot">Request a pilot</a> · <a href="${SITE}/api/meta">Live cohort meta</a></p>
    </main>`,
    "/pilot": `<main>
      <h1>Request a CiteAlpha GCI Pilot</h1>
      <p class="seo-speakable">Time-boxed pilot for Indian equity desks: Sensex hand-labeled evidence, Desk console, and Research Terminal. Share firm details — we follow up within one business day. Not investment advice.</p>
      <p>Pilots include Tracker access, evidence trails with quality badges, and optional API discussion. Read the <a href="${SITE}/trust">Trust Center</a> and <a href="${SITE}/blog/what-is-guidance-credibility-index">GCI definition</a> before requesting.</p>
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
      <h1>Desk Console for GCI Review Queues — CiteAlpha</h1>
      <p class="seo-speakable">Multi-pane desk for review queue, corpus, point-in-time API, AlphaHunter import, and human-in-the-loop GCI workflows for Indian equity research. Not investment advice.</p>
      <h2>What Desk is for</h2>
      <ul>
        <li>Analyst ops: jump from Tracker to evidence, labeling queue, and vernacular blurbs.</li>
        <li>Corpus management and extract/match review before scores go citeable.</li>
        <li>PIT series and API hooks for platform embed — beside your market terminal.</li>
      </ul>
      <p><a href="${SITE}/tracker">Open Tracker</a> · <a href="${SITE}/about/tiers">Tier features</a> · <a href="${SITE}/package">Packages</a></p>
    </main>`,
    "/research": `<main>
      <h1>Research Terminal: Cite-Only Filings Search — CiteAlpha</h1>
      <p class="seo-speakable">Search Indian IR filings and transcripts with cite-only chat that refuses invented actuals. Complements GCI Tracker — demo tape is not live prices. Not investment advice.</p>
      <h2>Capabilities</h2>
      <ul>
        <li>Filings and concall search with citation ids back to sources.</li>
        <li>Desk snapshot with MoM/QoQ/YoY context beside guidance evidence.</li>
        <li>Watchlist and news — structured for research memos, not retail tips.</li>
      </ul>
      <p><a href="${SITE}/tracker">GCI Tracker</a> · <a href="${SITE}/desk">Desk</a> · <a href="${SITE}/help">Help &amp; glossary</a></p>
    </main>`,
    "/products": `<main>
      <h1>Product Portfolio: Score, Cite, Sights &amp; More — CiteAlpha</h1>
      <p class="seo-speakable">Score, Cite, Sights, Radar, Ledger, and Data SKUs for Guidance Credibility Index workflows on Indian equity desks. Evidence-first research infrastructure — not Buy/Hold/Sell recommendations.</p>
      <ul>
        <li><strong>Score</strong> — company GCI with evidence trail and PIT history.</li>
        <li><strong>Cite</strong> — citation ids that reopen to NSE/BSE/IR documents.</li>
        <li><strong>Sights</strong> — India disclosure research OS with cite-only Ask.</li>
        <li><strong>Radar, Ledger, Data</strong> — alerts, audit, and API series for desks and quants.</li>
      </ul>
      <p><a href="${SITE}/package">Packages</a> · <a href="${SITE}/about/tiers">Tier map</a> · <a href="${SITE}/pilot">Request a pilot</a></p>
    </main>`,
    "/rankings": `<main>
      <h1>GCI Rankings for Indian Listings — CiteAlpha</h1>
      <p class="seo-speakable">Browse Guidance Credibility Index rankings for covered Indian listings. Evidence-linked delivery scores with honest quality badges — not investment recommendations.</p>
      <p>Rankings show relative guidance credibility within covered cohorts. Every citeable row links to guidance, actuals, outcome labels, and sources. Prefer hand_labeled names when citing in IC materials.</p>
      <p><a href="${SITE}/tracker">Full Tracker</a> · <a href="${SITE}/blog/hand-labeled-vs-demo-data">Hand-labeled vs demo data</a> · <a href="${SITE}/about">About GCI</a></p>
    </main>`,
    "/about/tiers": `<main>
      <h1>Tier Features: Tracker, Desk, Research — CiteAlpha</h1>
      <p class="seo-speakable">Feature map across CiteAlpha tiers for Indian equity desks: Tracker screening, Desk review workflows, Research filing search, and Enterprise API. Factual research — not investment advice.</p>
      <p>Compare Pilot, Desk, and Enterprise capabilities including PIT API, labeling queue, Sights access, and export hooks. See methodology tables for honest feature status.</p>
      <p><a href="${SITE}/package">Packages</a> · <a href="${SITE}/about#how">How GCI is built</a> · <a href="${SITE}/trust">Trust Center</a></p>
    </main>`,
    "/sights": `<main>
      <h1>CiteAlpha Sights — India Disclosure Research OS</h1>
      <p class="seo-speakable">Search, cite-only Ask, Compare Grid, and Desk Agents over public IR and CiteAlpha evidence for Indian listed companies. Not investment advice.</p>
      <ul>
        <li><a href="${SITE}/sights/search"><strong>Search</strong></a> — IR decks, filings, transcripts with Business Lexicon expand.</li>
        <li><a href="${SITE}/sights/ask"><strong>Ask</strong></a> — cite-only answers; refuses without evidence.</li>
        <li>Boards, themes, and export for institutional disclosure workflows.</li>
      </ul>
      <p><a href="${SITE}/tracker">GCI Tracker</a> · <a href="${SITE}/products">Product portfolio</a></p>
    </main>`,
    "/sights/search": `<main>
      <h1>Sights Search: India IR Documents — CiteAlpha</h1>
      <p class="seo-speakable">Search Indian IR decks, NSE/BSE filings, and transcripts with Business Lexicon synonym expand. Evidence-first disclosure research for equity desks.</p>
      <p>Pair search hits with <a href="${SITE}/sights/ask">Sights Ask</a> for cite-only follow-ups. Complements GCI evidence in Tracker.</p>
    </main>`,
    "/sights/ask": `<main>
      <h1>Sights Ask: Cite-Only Disclosure Answers — CiteAlpha</h1>
      <p class="seo-speakable">Cite-only answers from the India disclosure corpus. Refuses without evidence — built for equity research desks, not retail tips.</p>
      <p>Use alongside <a href="${SITE}/sights/search">Sights Search</a> and <a href="${SITE}/research">Research Terminal</a> for filing workflows.</p>
    </main>`,
    "/404": `<main>
      <h1>Page not found</h1>
      <p>That URL is not on CiteAlpha. Use the links below to reach the Guidance Credibility Index (GCI) product, documentation, or support pages.</p>
      <p><a href="${SITE}/tracker"><strong>Open GCI Tracker</strong></a> · <a href="${SITE}/">Home</a> · <a href="${SITE}/about">About</a> · <a href="${SITE}/blog">Blog</a> · <a href="${SITE}/help">Help</a> · <a href="${SITE}/answers">FAQ</a> · <a href="${SITE}/pilot">Request a pilot</a></p>
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
      <p><a href="${SITE}/tracker">Open Tracker</a> · <a href="${SITE}/blog/what-is-guidance-credibility-index">GCI definition</a></p>
    </main>`,
    "/tracker": `<main>
      <h1>GCI Tracker: Sensex &amp; Nifty Guidance Credibility</h1>
      <p class="seo-speakable">Screen Sensex and Nifty names by Guidance Credibility Index. Every score links to guidance, actuals, and sources. Not investment advice.</p>
      <ul>
        <li>Company GCI with trend and coverage context.</li>
        <li>Evidence trail: guidance → actual → label → source.</li>
        <li>Honest data-quality badges (hand_labeled vs demo_structured).</li>
      </ul>
      <p><a href="${SITE}/rankings">Rankings</a> · <a href="${SITE}/desk">Desk</a> · <a href="${SITE}/blog/what-is-guidance-credibility-index">What is GCI?</a></p>
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

export async function pingIndexNow(urls) {
  if (process.env.SKIP_INDEXNOW === "1") return;
  const host = "citealpha.com";
  const keyLocation = `${SITE}/${INDEXNOW_KEY}.txt`;
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation, urlList: urls.slice(0, 100) }),
    });
    console.log("indexnow ping:", res.status, res.statusText);
  } catch (err) {
    console.warn("indexnow ping skipped:", err.message);
  }
}
