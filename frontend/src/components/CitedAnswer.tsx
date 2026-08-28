import type { CitationRecord } from "../lib/api";
import { useSourceViewer } from "../lib/SourceViewerContext";

type Props = {
  text: string;
  citations?: CitationRecord[];
};

/** Render [n] markers as buttons that open the cited document with the quote highlighted. */
export default function CitedAnswer({ text, citations = [] }: Props) {
  const { openSource } = useSourceViewer();
  const parts = text.split(/(\[\d+\])/g);
  return (
    <p>
      {parts.map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/);
        if (m) {
          const n = Number(m[1]);
          const cite = citations.find((c) => c.n === n) || citations[n - 1];
          return (
            <button
              key={i}
              type="button"
              className="cite-ref"
              data-testid={`cite-ref-${n}`}
              title={cite ? `Open source [${n}]` : `Citation ${n}`}
              onClick={() => {
                if (!cite) {
                  document.getElementById(`cite-${n}`)?.scrollIntoView({
                    block: "nearest",
                    behavior: "smooth",
                  });
                  return;
                }
                openSource({
                  citation_id: cite.citation_id,
                  doc_id: cite.doc_id,
                  title: cite.title,
                  source_url: cite.source_url || cite.url,
                  highlight_url: cite.highlight_url,
                  quote: cite.quote_span || cite.quote || cite.snippet,
                  document_text: cite.document_text,
                  span_start: cite.span_start,
                  span_end: cite.span_end,
                  company_id: cite.company_id,
                  excerpt_only: cite.excerpt_only,
                });
              }}
            >
              {part}
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
