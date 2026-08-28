/**
 * Post-build: prerender route-specific HTML + generate sitemap.xml
 * so crawlers see correct title, canonical, robots, and crawlable intro text.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PUBLIC = path.join(ROOT, "public");
const BLOG_TS = path.join(ROOT, "src/lib/blogPosts.ts");
const SEO_ROUTES = path.join(ROOT, "src/lib/seoRoutes.json");
const SITE = "https://citealpha.com";

function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function loadSeoRoutes() {
  return JSON.parse(fs.readFileSync(SEO_ROUTES, "utf8"));
}

function parseBlogPosts() {
  const src = fs.readFileSync(BLOG_TS, "utf8");
  const posts = [];
  const re =
    /slug:\s*"([^"]+)"[\s\S]*?title:\s*"((?:[^"\\]|\\.)*)"[\s\S]*?description:\s*\n\s*"((?:[^"\\]|\\.)*)"[\s\S]*?published:\s*"([^"]+)"(?:[\s\S]*?updated:\s*"([^"]+)")?/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    posts.push({
      slug: m[1],
      title: m[2].replace(/\\"/g, '"'),
      description: m[3].replace(/\\"/g, '"'),
      published: m[4],
      updated: m[5] || m[4],
    });
  }
  return posts;
}

function crawlFallback(seo) {
  if ((seo.robots ?? "index,follow").includes("noindex")) {
    return "";
  }
  return `
    <div id="seo-crawl-fallback" aria-hidden="true" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0">
      <h1>${esc(seo.title)}</h1>
      <p>${esc(seo.description)}</p>
    </div>`;
}

function injectSeo(html, seo) {
  const url = seo.path === "/" ? `${SITE}/` : `${SITE}${seo.path}`;
  const robots = seo.robots ?? "index,follow";
  const ogType = seo.type ?? "website";
  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${esc(seo.title)}</title>`);
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${esc(seo.description)}" />`,
  );
  out = out.replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/>/,
    `<meta name="robots" content="${robots}" />`,
  );
  out = out.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${url}" />`,
  );
  out = out.replace(
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:type" content="${ogType}" />`,
  );
  out = out.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${esc(seo.title)}" />`,
  );
  out = out.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${esc(seo.description)}" />`,
  );
  out = out.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${url}" />`,
  );
  out = out.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${esc(seo.title)}" />`,
  );
  out = out.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${esc(seo.description)}" />`,
  );
  if (seo.jsonLd) {
    const block = `<script type="application/ld+json" id="seo-prerender-jsonld">\n${JSON.stringify(seo.jsonLd, null, 2)}\n    </script>`;
    if (out.includes('id="seo-prerender-jsonld"')) {
      out = out.replace(
        /<script type="application\/ld\+json" id="seo-prerender-jsonld">[\s\S]*?<\/script>/,
        block,
      );
    } else {
      out = out.replace("</head>", `    ${block}\n  </head>`);
    }
  }
  const fallback = crawlFallback(seo);
  if (fallback) {
    if (out.includes('id="seo-crawl-fallback"')) {
      out = out.replace(/<div id="seo-crawl-fallback"[\s\S]*?<\/div>/, fallback.trim());
    } else {
      out = out.replace("<div id=\"root\"></div>", `<div id="root"></div>${fallback}`);
    }
  }
  return out;
}

function routeRel(routePath) {
  if (routePath === "/blog") {
    return "blog/index.html";
  }
  if (routePath.startsWith("/blog/")) {
    return `blog/${routePath.slice("/blog/".length)}/index.html`;
  }
  if (routePath === "/") {
    return "index.html";
  }
  return `${routePath.replace(/^\//, "")}/index.html`;
}

function writeRoute(seo, baseHtml) {
  const html = injectSeo(baseHtml, seo);
  const rel = routeRel(seo.path);
  const outPath = path.join(DIST, rel);
  if (rel !== "index.html") {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
  }
  fs.writeFileSync(outPath, html);
  console.log("prerender", seo.path, "->", rel);
}

function blogIndexJsonLd(posts) {
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
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE}/blog/${p.slug}`,
      datePublished: p.published,
      description: p.description,
    })),
  };
}

function buildSitemap(staticRoutes, posts) {
  const urls = [];

  for (const route of staticRoutes) {
    if (!route.sitemap || (route.robots ?? "index,follow").includes("noindex")) {
      continue;
    }
    urls.push({
      loc: route.path === "/" ? `${SITE}/` : `${SITE}${route.path}`,
      changefreq: route.sitemap.changefreq,
      priority: route.sitemap.priority,
    });
  }

  for (const post of posts) {
    urls.push({
      loc: `${SITE}/blog/${post.slug}`,
      lastmod: post.updated,
      changefreq: "monthly",
      priority: "0.7",
    });
  }

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const u of urls) {
    lines.push("  <url>");
    lines.push(`    <loc>${u.loc}</loc>`);
    if (u.lastmod) {
      lines.push(`    <lastmod>${u.lastmod}</lastmod>`);
    }
    lines.push(`    <changefreq>${u.changefreq}</changefreq>`);
    lines.push(`    <priority>${u.priority}</priority>`);
    lines.push("  </url>");
  }
  lines.push("</urlset>");
  return `${lines.join("\n")}\n`;
}

const baseHtml = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
const staticRoutes = loadSeoRoutes();
const posts = parseBlogPosts();
let prerenderCount = 0;

for (const route of staticRoutes) {
  const seo = { path: route.path, ...route };
  if (route.path === "/blog") {
    seo.jsonLd = blogIndexJsonLd(posts);
  }
  writeRoute(seo, baseHtml);
  prerenderCount += 1;
}

for (const post of posts) {
  writeRoute(
    {
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
        dateModified: post.updated,
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
            url: `${SITE}/citealpha-logo.png`,
          },
        },
        mainEntityOfPage: `${SITE}/blog/${post.slug}`,
        image: `${SITE}/og-image.png`,
      },
    },
    baseHtml,
  );
  prerenderCount += 1;
}

const sitemap = buildSitemap(staticRoutes, posts);
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(PUBLIC, "sitemap.xml"), sitemap);

console.log(`prerender-seo: ${prerenderCount} routes, sitemap: ${sitemap.split("<url>").length - 1} urls`);
