/** Build a URL that asks the browser to highlight/search the cited quote. */

export function withTextHighlight(url: string | null | undefined, quote?: string | null): string {
  const href = (url || "").trim();
  if (!href) return "";
  const q = (quote || "").trim().replace(/\s+/g, " ");
  const hashAt = href.indexOf("#");
  const base = hashAt >= 0 ? href.slice(0, hashAt) : href;
  if (!q) return href;
  const path = base.split("?")[0].toLowerCase();
  const isPdf = path.endsWith(".pdf") || path.includes(".pdf") || path.includes("/pdf");
  const snippet = q.slice(0, 80);
  if (isPdf) {
    return `${base}#search=${encodeURIComponent(snippet)}`;
  }
  const encodeFrag = (s: string) => encodeURIComponent(s).replace(/-/g, "%2D");
  if (q.length > 90) {
    return `${base}#:~:text=${encodeFrag(q.slice(0, 40))},${encodeFrag(q.slice(-40))}`;
  }
  return `${base}#:~:text=${encodeFrag(snippet)}`;
}

export type HighlightRange = { start: number; end: number };

/** Resolve char offsets of `quote` in `text` (exact, case-insensitive, then prefix). */
export function findQuoteRange(
  text: string,
  quote?: string | null,
  spanStart?: number | null,
  spanEnd?: number | null,
): HighlightRange | null {
  if (!text) return null;
  if (
    spanStart != null &&
    spanEnd != null &&
    spanStart >= 0 &&
    spanEnd > spanStart &&
    spanEnd <= text.length
  ) {
    return { start: spanStart, end: spanEnd };
  }
  const q = (quote || "").trim();
  if (!q) return null;
  const exact = text.indexOf(q);
  if (exact >= 0) return { start: exact, end: exact + q.length };
  const lower = text.toLowerCase();
  const qLower = q.toLowerCase();
  const ci = lower.indexOf(qLower);
  if (ci >= 0) return { start: ci, end: ci + q.length };
  const short = q.slice(0, 40);
  if (short.length >= 8) {
    const s = text.indexOf(short);
    if (s >= 0) return { start: s, end: s + short.length };
    const sc = lower.indexOf(short.toLowerCase());
    if (sc >= 0) return { start: sc, end: sc + short.length };
  }
  return null;
}

export function splitHighlighted(
  text: string,
  range: HighlightRange | null,
): { before: string; match: string; after: string } | null {
  if (!range) return null;
  return {
    before: text.slice(0, range.start),
    match: text.slice(range.start, range.end),
    after: text.slice(range.end),
  };
}
