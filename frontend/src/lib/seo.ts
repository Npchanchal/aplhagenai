import { getBlogMeta, listBlogMeta } from "./blogMeta";
import seoRoutes from "./seoRoutes.json";
import {
  blogSeoTitle,
  extraJsonLdForPath,
  websiteJsonLd,
  SITE,
} from "./seoJsonLd";

export type SeoConfig = {
  path: string;
  title: string;
  description: string;
  robots?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown>;
  extraJsonLd?: Record<string, unknown>[];
  ogImageAlt?: string;
};

type SeoRouteEntry = {
  path: string;
  title: string;
  description: string;
  robots?: string;
};

const DEFAULT: SeoConfig = {
  path: "/",
  title: "GCI by CiteAlpha — Guidance Credibility Index",
  description:
    "CiteAlpha GCI by Ocotillo Innovation Private Limited — management guidance vs delivery for Indian equity desks. Factual research product; not investment advice.",
};

const STATIC: Record<string, Omit<SeoConfig, "path">> = Object.fromEntries(
  (seoRoutes as SeoRouteEntry[]).map(({ path, ...rest }) => [path, rest]),
);

STATIC["/about/architecture"] = {
  title: "Architecture & Design — CiteAlpha",
  description:
    "CiteAlpha system architecture: GCI pipeline, layering, scoring design, and AWS deployment for Indian equity desks.",
};

function blogIndexJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "CiteAlpha Research Blog",
    url: `${SITE}/blog`,
    publisher: {
      "@type": "Organization",
      name: "CiteAlpha",
      legalName: "Ocotillo Innovation Private Limited",
    },
    blogPost: listBlogMeta().map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE}/blog/${p.slug}`,
      datePublished: p.published,
      description: p.description,
    })),
  };
}

function blogPostJsonLd(post: NonNullable<ReturnType<typeof getBlogMeta>>): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.published,
    dateModified: post.updated ?? post.published,
    author: {
      "@type": "Organization",
      name: "CiteAlpha",
      legalName: "Ocotillo Innovation Private Limited",
    },
    publisher: {
      "@type": "Organization",
      name: "CiteAlpha",
      logo: { "@type": "ImageObject", url: `${SITE}/citealpha-logo.png` },
    },
    mainEntityOfPage: `${SITE}/blog/${post.slug}`,
    image: `${SITE}/og-image.png`,
  };
}

/** Resolve SEO config for a React Router pathname. */
export function resolveSeo(pathname: string): SeoConfig {
  if (pathname.startsWith("/blog/") && pathname !== "/blog/") {
    const slug = pathname.slice("/blog/".length).replace(/\/$/, "");
    const post = getBlogMeta(slug);
    if (post) {
      const title = blogSeoTitle(slug, post.title);
      return {
        path: `/blog/${post.slug}`,
        title,
        description: post.description,
        type: "article",
        ogImageAlt: `${post.title} — CiteAlpha Research Blog`,
        jsonLd: blogPostJsonLd(post),
        extraJsonLd: extraJsonLdForPath(`/blog/${post.slug}`, title),
      };
    }
  }

  if (pathname.startsWith("/companies/")) {
    return {
      path: pathname,
      title: "Company GCI Dossier — CiteAlpha",
      description:
        "Company Guidance Credibility Index dossier with evidence trail. Factual research; not investment advice.",
      robots: "noindex,follow",
    };
  }

  if (pathname.startsWith("/c/")) {
    return {
      path: pathname,
      title: "Citation — CiteAlpha",
      description: "Evidence citation for a Guidance Credibility Index score point.",
      robots: "noindex,follow",
    };
  }

  if (pathname.startsWith("/sights")) {
    const hit = STATIC[pathname] || STATIC["/sights"];
    const title = hit.title;
    return {
      path: pathname,
      ...hit,
      ogImageAlt: title,
      extraJsonLd: extraJsonLdForPath(pathname, title),
    };
  }

  const staticHit = STATIC[pathname];
  if (staticHit) {
    const seo: SeoConfig = {
      path: pathname,
      ...staticHit,
      ogImageAlt: staticHit.title,
    };
    if (pathname === "/blog") {
      seo.jsonLd = blogIndexJsonLd();
    } else if (pathname === "/") {
      seo.jsonLd = websiteJsonLd();
    }
    seo.extraJsonLd = extraJsonLdForPath(pathname, staticHit.title);
    return seo;
  }

  return { ...DEFAULT, path: pathname };
}
