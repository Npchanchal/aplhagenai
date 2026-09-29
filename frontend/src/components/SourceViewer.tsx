import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import HighlightedDocument from "./HighlightedDocument";
import { useI18n } from "../i18n";
import { fetchCitation, fetchDocument } from "../lib/api";
import { withTextHighlight } from "../lib/sourceHighlight";
import type { SourceTarget } from "../lib/SourceViewerContext";

type Props = {
  target: SourceTarget;
  onClose: () => void;
};

type Resolved = {
  title: string;
  text: string;
  quote: string;
  url: string;
  highlightUrl: string;
  spanStart: number | null;
  spanEnd: number | null;
  companyId: string | null;
  citationId: string | null;
  excerptOnly: boolean;
  indexedExcerpt: boolean;
  error: string | null;
};

export default function SourceViewer({ target, onClose }: Props) {
  const { t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(true);
  const [resolved, setResolved] = useState<Resolved>(() => ({
    title: target.title || t("ui.SourceViewer.defaultTitle"),
    text: target.document_text || "",
    quote: target.quote || "",
    url: target.source_url || "",
    highlightUrl:
      target.highlight_url ||
      (target.indexed_excerpt
        ? ""
        : withTextHighlight(target.source_url, target.quote) || ""),
    spanStart: target.span_start ?? null,
    spanEnd: target.span_end ?? null,
    companyId: target.company_id || null,
    citationId: target.citation_id || null,
    excerptOnly: Boolean(target.excerpt_only),
    indexedExcerpt: Boolean(target.indexed_excerpt),
    error: null,
  }));

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const hasText = Boolean(target.document_text);
      if (hasText && (target.span_start != null || !target.citation_id)) {
        setBusy(false);
        return;
      }
      setBusy(true);
      try {
        if (target.citation_id) {
          const rec = await fetchCitation(target.citation_id);
          if (cancelled) return;
          const quote = rec.quote_span || rec.quote || rec.snippet || target.quote || "";
          const url = rec.source_url || rec.url || target.source_url || "";
          setResolved({
            title: rec.title || rec.document_title || target.title || t("ui.SourceViewer.defaultTitle"),
            text: rec.document_text || quote || "",
            quote,
            url,
            highlightUrl: rec.highlight_url || withTextHighlight(url, quote),
            spanStart: rec.span_start ?? target.span_start ?? null,
            spanEnd: rec.span_end ?? target.span_end ?? null,
            companyId: rec.company_id || target.company_id || null,
            citationId: rec.citation_id || target.citation_id || null,
            excerptOnly: Boolean(rec.excerpt_only),
            indexedExcerpt: Boolean(rec.indexed_excerpt),
            error: null,
          });
        } else if (target.doc_id) {
          const doc = await fetchDocument(target.doc_id);
          if (cancelled) return;
          const quote = target.quote || "";
          const url = doc.url || target.source_url || "";
          setResolved({
            title: doc.title || target.title || t("ui.SourceViewer.defaultTitle"),
            text: doc.text || quote,
            quote,
            url,
            highlightUrl: withTextHighlight(url, quote),
            spanStart: target.span_start ?? null,
            spanEnd: target.span_end ?? null,
            companyId: doc.company_id || target.company_id || null,
            citationId: target.citation_id || null,
            excerptOnly: false,
            indexedExcerpt: false,
            error: null,
          });
        } else {
          setBusy(false);
          return;
        }
      } catch (e) {
        if (!cancelled) {
          setResolved((prev) => ({
            ...prev,
            error: e instanceof Error ? e.message : t("ui.SourceViewer.loadError"),
          }));
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [target]);

  return (
    <div className="source-viewer-overlay" role="presentation" onClick={onClose}>
      <div
        className="source-viewer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-viewer-title"
        data-testid="source-viewer"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="source-viewer-head">
          <div>
            <p className="page-kicker">{t("ui.SourceViewer.kicker")}</p>
            <h2 id="source-viewer-title">{resolved.title}</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="btn ghost small"
            onClick={onClose}
            data-testid="source-viewer-close"
          >
            {t("ui.SourceViewer.close")}
          </button>
        </header>
        {busy && <p className="muted">{t("ui.SourceViewer.loading")}</p>}
        {resolved.error && <p className="error">{resolved.error}</p>}
        {!busy && (
          <HighlightedDocument
            text={resolved.text}
            quote={resolved.quote}
            spanStart={resolved.spanStart}
            spanEnd={resolved.spanEnd}
            excerptOnly={resolved.excerptOnly}
            indexedExcerpt={resolved.indexedExcerpt}
          />
        )}
        <footer className="source-viewer-foot">
          {resolved.highlightUrl && (
            <a
              href={resolved.highlightUrl}
              target="_blank"
              rel="noreferrer"
              data-testid="open-original-source"
            >
              {t("ui.SourceViewer.openHighlight")}
            </a>
          )}
          {!resolved.highlightUrl && resolved.url && (
            <a
              href={resolved.url}
              target="_blank"
              rel="noreferrer"
              data-testid="open-related-portal"
            >
              {resolved.indexedExcerpt
                ? t("ui.SourceViewer.openIrPortal")
                : t("ui.SourceViewer.openOriginal")}
            </a>
          )}
          {resolved.citationId && (
            <Link to={`/c/${encodeURIComponent(resolved.citationId)}`}>{t("ui.SourceViewer.permalink")}</Link>
          )}
          {resolved.companyId && (
            <Link to={`/companies/${resolved.companyId}`}>{t("ui.SourceViewer.openDossier")}</Link>
          )}
        </footer>
      </div>
    </div>
  );
}
