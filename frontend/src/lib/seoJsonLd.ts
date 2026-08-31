import structured from "./seo-structured-data.json";

export const SITE = structured.site;

type JsonLd = Record<string, unknown>;

const ORG = structured.org;

export function orgJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG.name,
    legalName: ORG.legalName,
    url: SITE,
    logo: `${SITE}/citealpha-logo.png`,
    description:
      "Guidance Credibility Index (GCI) — evidence-linked management guidance vs delivery for Indian equity desks. Not investment advice.",
    email: ORG.email,
    sameAs: ORG.sameAs,
  };
}

export function websiteJsonLd(): JsonLd {
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
      name: ORG.name,
      legalName: ORG.legalName,
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

export function softwareJsonLd(): JsonLd {
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
      name: ORG.name,
      legalName: ORG.legalName,
    },
  };
}

export function faqJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: structured.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function howToGciJsonLd(): JsonLd {
  const howTo = structured.howTo;
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

export function speakableJsonLd(pageUrl: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: pageUrl,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: structured.speakable.cssSelector,
    },
  };
}

/** Extra JSON-LD blocks keyed by pathname (SPA + prerender parity). */
export function extraJsonLdForPath(pathname: string): JsonLd[] {
  const blocks: JsonLd[] = [];
  if (pathname === "/") {
    blocks.push(orgJsonLd(), softwareJsonLd(), faqJsonLd());
  } else if (pathname === "/about" || pathname === "/about/tiers") {
    blocks.push(howToGciJsonLd());
  } else if (pathname === "/answers" || pathname === "/help") {
    blocks.push(faqJsonLd());
  } else if (pathname === "/blog/what-is-guidance-credibility-index") {
    blocks.push(faqJsonLd(), speakableJsonLd(`${SITE}/blog/what-is-guidance-credibility-index`));
  }
  return blocks;
}

export function blogSeoTitle(slug: string, title: string): string {
  if (slug === "what-is-guidance-credibility-index") {
    return "What is a Guidance Credibility Index (GCI)? — CiteAlpha";
  }
  return `${title} — CiteAlpha Blog`;
}

export function ogImageAltForPath(pathname: string, title: string): string {
  if (pathname === "/") {
    return "CiteAlpha — Guidance Credibility Index by Ocotillo Innovation Private Limited";
  }
  if (pathname.startsWith("/blog/")) {
    return `${title} — CiteAlpha Research Blog`;
  }
  return `${title} — CiteAlpha`;
}

export { structured as SEO_STRUCTURED };
