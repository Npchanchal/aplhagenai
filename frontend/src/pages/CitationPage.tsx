import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CitationCard from "../components/CitationCard";
import Disclaimer from "../components/Disclaimer";
import HighlightedDocument from "../components/HighlightedDocument";
import { useI18n } from "../i18n";
import { fetchCitation, type CitationRecord } from "../lib/api";

/** Resolve a stable citation id (cite_*) for IC / share links. */
export default function CitationPage() {
  const { t } = useI18n();
  const { citationId } = useParams();
  const [row, setRow] = useState<CitationRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!citationId) return;
    setError(null);
    fetchCitation(citationId)
      .then(setRow)
      .catch((e: Error) => setError(e.message));
  }, [citationId]);

  const quote = row?.quote_span || row?.quote || row?.snippet;
  const original = row?.highlight_url;
  const portal = !original ? row?.source_url || row?.url : null;

  return (
    <section data-testid="citation-page">
      <p className="page-kicker">{t("ui.CitationPage.kicker")}</p>
      <h1>{t("ui.CitationPage.title")}</h1>
      <p className="muted lede">
        {t("ui.CitationPage.lede")}
      </p>
      {error && <p className="error">{error}</p>}
      {!error && !row && <p className="muted">{t("ui.CitationPage.loading")}</p>}
      {row && (
        <>
          <CitationCard citation={row} />
          {(row.document_text || quote) && (
            <div className="panel" style={{ marginTop: 16 }}>
              <h2 style={{ marginTop: 0 }}>{t("ui.CitationPage.document")}</h2>
              <HighlightedDocument
                text={row.document_text || quote || ""}
                quote={quote}
                spanStart={row.span_start}
                spanEnd={row.span_end}
                excerptOnly={Boolean(row.excerpt_only)}
                indexedExcerpt={Boolean(row.indexed_excerpt)}
              />
              {original && (
                <p>
                  <a href={original} target="_blank" rel="noreferrer">
                    {t("ui.CitationPage.openHighlight")}
                  </a>
                </p>
              )}
              {!original && portal && (
                <p>
                  <a href={portal} target="_blank" rel="noreferrer">
                    {row.indexed_excerpt
                      ? t("ui.CitationPage.openIrPortal")
                      : t("ui.CitationPage.openOriginal")}
                  </a>
                </p>
              )}
            </div>
          )}
          {row.company_id && (
            <p>
              <Link to={`/companies/${row.company_id}`}>{t("ui.CitationPage.openDossier")}</Link>
            </p>
          )}
        </>
      )}
      <Disclaimer />
    </section>
  );
}
