import { useEffect, useRef } from "react";
import { findQuoteRange, splitHighlighted } from "../lib/sourceHighlight";

type Props = {
  text: string;
  quote?: string | null;
  spanStart?: number | null;
  spanEnd?: number | null;
  excerptOnly?: boolean;
  indexedExcerpt?: boolean;
};

/** Filing/transcript body with the cited span marked and scrolled into view. */
export default function HighlightedDocument({
  text,
  quote,
  spanStart,
  spanEnd,
  excerptOnly = false,
  indexedExcerpt = false,
}: Props) {
  const markRef = useRef<HTMLElement | null>(null);
  const range = findQuoteRange(text, quote, spanStart, spanEnd);
  const parts = splitHighlighted(text, range);

  useEffect(() => {
    markRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [text, quote, spanStart, spanEnd]);

  if (!text) {
    return <p className="muted">No indexed document text for this citation.</p>;
  }

  return (
    <div className="source-doc" data-testid="highlighted-document">
      {(excerptOnly || indexedExcerpt) && (
        <p className="muted source-excerpt-note">
          {indexedExcerpt
            ? "CiteAlpha indexed excerpt — quote is stored in our document corpus. Use the IR portal link to verify against original filings."
            : "Indexed excerpt — the original filing may include additional context around this quote."}
        </p>
      )}
      {quote && !parts && (
        <blockquote className="quote-span">“{quote}”</blockquote>
      )}
      <pre className="source-doc-body">
        {parts ? (
          <>
            {parts.before}
            <mark ref={markRef} className="source-highlight" data-testid="source-highlight">
              {parts.match}
            </mark>
            {parts.after}
          </>
        ) : (
          text
        )}
      </pre>
    </div>
  );
}
