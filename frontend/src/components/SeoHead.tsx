import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../i18n";
import { ogLocaleFor } from "../i18n/languages";
import { resolveSeo } from "../lib/seo";

const SITE = "https://citealpha.com";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(id: string, data: Record<string, unknown> | null) {
  const existing = document.getElementById(id);
  if (!data) {
    existing?.remove();
    return;
  }
  let el = existing as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/** Per-route title, description, canonical, Open Graph, and JSON-LD for SPA SEO. */
export default function SeoHead() {
  const { pathname } = useLocation();
  const { lang } = useI18n();

  useEffect(() => {
    const seo = resolveSeo(pathname);
    const url = `${SITE}${seo.path === "/" ? "/" : seo.path}`;

    document.title = seo.title;

    upsertMeta("name", "description", seo.description);
    upsertMeta("name", "robots", seo.robots ?? "index,follow");
    upsertMeta("property", "og:type", seo.type ?? "website");
    upsertMeta("property", "og:site_name", "CiteAlpha");
    upsertMeta("property", "og:title", seo.title);
    upsertMeta("property", "og:description", seo.description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", `${SITE}/og-image.png`);
    upsertMeta("property", "og:locale", ogLocaleFor(lang));
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", seo.title);
    upsertMeta("name", "twitter:description", seo.description);
    upsertMeta("name", "twitter:image", `${SITE}/og-image.png`);

    upsertLink("canonical", url);

    const gsc = import.meta.env.VITE_GSC_VERIFICATION?.trim();
    if (gsc) {
      upsertMeta("name", "google-site-verification", gsc);
    }

    upsertJsonLd("seo-jsonld-page", seo.jsonLd ?? null);

    if (pathname === "/" || pathname === "/blog") {
      upsertJsonLd("seo-jsonld-org", {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "CiteAlpha",
        legalName: "Ocotillo Innovation Private Limited",
        url: SITE,
        logo: `${SITE}/citealpha-logo.png`,
        description:
          "Guidance Credibility Index (GCI) — evidence-linked management guidance vs delivery for Indian equity desks. Not investment advice.",
        email: "sales@citealpha.com",
        sameAs: [],
      });
    } else {
      upsertJsonLd("seo-jsonld-org", null);
    }
  }, [pathname, lang]);

  return null;
}
