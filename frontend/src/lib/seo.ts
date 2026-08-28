import { getBlogMeta, listBlogMeta } from "./blogMeta";
import seoRoutes from "./seoRoutes.json";

export type SeoConfig = {
  path: string;
  title: string;
  description: string;
  robots?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown>;
};

type SeoRouteEntry = {
  path: string;
  title: string;
  description: string;
  robots?: string;
};

const DEFAULT: SeoConfig = {
  path: "/",
  title: "CiteAlpha — Guidance Credibility Index",
  description:
    "CiteAlpha GCI by Ocotillo Innovation Private Limited — management guidance vs delivery for Indian equity desks. Factual research product; not investment advice.",
};

const STATIC: Record<string, Omit<SeoConfig, "path">> = Object.fromEntries(
  (seoRoutes as SeoRouteEntry[]).map(({ path, ...rest }) => [path, rest]),
);

/** Dev-only route; production redirects to /about. */
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
    url: "https://citealpha.com/blog",
    publisher: {
      "@type": "Organization",
      name: "CiteAlpha",
      legalName: "Ocotillo Innovation Private Limited",
    },
    blogPost: listBlogMeta().map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `https://citealpha.com/blog/${p.slug}`,
      datePublished: p.published,
      description: p.description,
    })),
  };
}

/** Resolve SEO config for a React Router pathname. */
export function resolveSeo(pathname: string): SeoConfig {
  if (pathname.startsWith("/blog/") && pathname !== "/blog/") {
    const slug = pathname.slice("/blog/".length).replace(/\/$/, "");
    const post = getBlogMeta(slug);
    if (post) {
      return {
        path: `/blog/${post.slug}`,
        title: `${post.title} — CiteAlpha Blog`,
        description: post.description,
        type: "article",
        jsonLd: {
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
            logo: {
              "@type": "ImageObject",
              url: "https://citealpha.com/citealpha-logo.png",
            },
          },
          mainEntityOfPage: `https://citealpha.com/blog/${post.slug}`,
          image: "https://citealpha.com/og-image.png",
        },
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
    return { path: pathname, ...hit };
  }

  const staticHit = STATIC[pathname];
  if (staticHit) {
    const seo: SeoConfig = { path: pathname, ...staticHit };
    if (pathname === "/blog") {
      seo.jsonLd = blogIndexJsonLd();
    }
    return seo;
  }

  return { ...DEFAULT, path: pathname };
}
