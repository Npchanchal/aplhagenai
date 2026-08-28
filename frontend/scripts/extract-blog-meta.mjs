/** Regenerate src/lib/blogMeta.ts from src/lib/blogPosts.ts (SEO-only fields). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(ROOT, "src/lib/blogPosts.ts"), "utf8");
const posts = [];
const re =
  /\{\s*slug:\s*"([^"]+)"[\s\S]*?title:\s*"((?:[^"\\]|\\.)*)"[\s\S]*?description:\s*\n\s*"((?:[^"\\]|\\.)*)"[\s\S]*?published:\s*"([^"]+)"(?:[\s\S]*?updated:\s*"([^"]+)")?[\s\S]*?tags:\s*\[([^\]]+)\][\s\S]*?readingMinutes:\s*(\d+)/g;
let m;
while ((m = re.exec(src)) !== null) {
  posts.push({
    slug: m[1],
    title: m[2].replace(/\\"/g, '"'),
    description: m[3].replace(/\\"/g, '"'),
    published: m[4],
    updated: m[5] || undefined,
    tags: m[6].split(",").map((s) => s.trim().replace(/^"|"$/g, "")),
    readingMinutes: Number(m[7]),
  });
}

const out = `/** Lightweight blog metadata for SEO (main bundle). Regenerate: node scripts/extract-blog-meta.mjs */
export type BlogMeta = {
  slug: string;
  title: string;
  description: string;
  published: string;
  updated?: string;
  tags: string[];
  readingMinutes: number;
};

export const BLOG_META: BlogMeta[] = ${JSON.stringify(posts, null, 2)};

export function listBlogMeta(): BlogMeta[] {
  return [...BLOG_META].sort((a, b) => (a.published < b.published ? 1 : -1));
}

export function getBlogMeta(slug: string): BlogMeta | undefined {
  return BLOG_META.find((p) => p.slug === slug);
}
`;

fs.writeFileSync(path.join(ROOT, "src/lib/blogMeta.ts"), out);
console.log(`extract-blog-meta: ${posts.length} entries`);
