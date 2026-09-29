import { useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import type { CitationRecord } from "../lib/api";
import { recordCiteCopy } from "../lib/api";
import { useSourceViewer } from "../lib/SourceViewerContext";
import { withTextHighlight } from "../lib/sourceHighlight";

type CopyKind = "bibliographic" | "markdown" | "ic_footnote";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

type Props = {
  citation: CitationRecord;
  compact?: boolean;
};

export default function CitationCard({ citation, compact = false }: Props) {
  const { t } = useI18n();
  const { openSource } = useSourceViewer();
  const [copied, setCopied] = useState<CopyKind | null>(null);
  const n = citation.n;
  const cid = citation.citation_id;
  const url = citation.source_url || citation.url;
  const quote = citation.quote_span || citation.quote || citation.snippet;
  const loc = citation.locator;

  const openDoc = () => {
    openSource({
      citation_id: cid,
      doc_id: citation.doc_id,
      title: citation.title,
      source_url: url,
      highlight_url: citation.highlight_url || withTextHighlight(url, quote),
      quote,
      document_text: citation.document_text,
      span_start: citation.span_start,
      span_end: citation.span_end,
      company_id: citation.company_id,
      excerpt_only: citation.excerpt_only,
      indexed_excerpt: citation.indexed_excerpt,
    });
  };

  const doCopy = async (kind: CopyKind) => {
    const text =
      kind === "markdown"
        ? citation.markdown || ""
        : kind === "ic_footnote"
          ? citation.ic_footnote || ""
          : citation.bibliographic || "";
    const ok = await copyText(text);
    if (ok) {
      setCopied(kind);
      recordCiteCopy(citation.company_id || undefined);
      window.setTimeout(() => setCopied(null), 1600);
    }
  };

  return (
    <article
      className={`citation-card ${compact ? "compact" : ""}`}
      id={n != null ? `cite-${n}` : cid || undefined}
      data-testid="citation-card"
    >
      <header className="citation-card-head">
        {n != null && (
          <button type="button" className="citation-n cite-ref" onClick={openDoc}>
            [{n}]
          </button>
        )}
        <div>
          <strong>
            {url || cid || citation.doc_id ? (
              <button type="button" className="linkish" onClick={openDoc}>
                {citation.title || citation.ticker || t("ui.CitationCard.source")}
              </button>
            ) : (
              citation.title || citation.ticker || t("ui.CitationCard.source")
            )}
          </strong>
          <div className="muted citation-meta">
            {[citation.ticker, citation.date, citation.doc_type, loc]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        {citation.citeable === false && (
          <span className="pill muted">{t("ui.CitationCard.notCiteable")}</span>
        )}
      </header>
      {quote && (
        <blockquote className="quote-span quote-span-click" cite={url || undefined}>
          <button type="button" className="linkish quote-open" onClick={openDoc}>
            “{quote}”
          </button>
        </blockquote>
      )}
      {citation.speaker && (
        <p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
          {t("ui.CitationCard.speaker", { speaker: citation.speaker })}
        </p>
      )}
      <div className="citation-actions">
        {(url || cid || citation.doc_id) && (
          <button type="button" className="linkish" data-testid="open-source" onClick={openDoc}>
            {t("ui.CitationCard.openSource")}
          </button>
        )}
        {cid && (
          <Link to={`/c/${encodeURIComponent(cid)}`} title={t("ui.CitationCard.permalink")}>
            {cid}
          </Link>
        )}
        <button type="button" className="btn ghost small" onClick={() => void doCopy("bibliographic")}>
          {copied === "bibliographic" ? t("ui.CitationCard.copied") : t("ui.CitationCard.copyCite")}
        </button>
        <button type="button" className="btn ghost small" onClick={() => void doCopy("markdown")}>
          {copied === "markdown" ? t("ui.CitationCard.copied") : t("ui.CitationCard.copyMd")}
        </button>
        <button type="button" className="btn ghost small" onClick={() => void doCopy("ic_footnote")}>
          {copied === "ic_footnote" ? t("ui.CitationCard.copied") : t("ui.CitationCard.icNote")}
        </button>
      </div>
    </article>
  );
}
