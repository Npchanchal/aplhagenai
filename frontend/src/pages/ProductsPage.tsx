import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import Toast from "../components/Toast";
import { useI18n } from "../i18n";
import {
  downloadLedgerPdf,
  downloadOutcomesExport,
  fetchCiteTiers,
  fetchCiteUsage,
  fetchCompanyLedger,
  fetchCompanies,
  fetchDataCatalog,
  fetchKpiDictionary,
  fetchLedgerMirror,
  fetchMetaFlags,
  fetchNarrativeConsistency,
  fetchProductsCatalog,
  fetchRadarCalendar,
  fetchRadarDigestPreview,
  fetchRadarFeed,
  fetchTrustBadgeChannel,
  fetchWorkbenchExtraction,
  postRadarDigestSend,
  type PortfolioProduct,
  type RadarFeedItem,
} from "../lib/api";
import { DESK_GUIDES } from "../lib/deskPaths";
import { severityLabel } from "../lib/severity";

export default function ProductsPage() {
  const { t } = useI18n();
  const location = useLocation();
  const skuLinks = useMemo(
    () =>
      ({
        score: { primary: "/tracker", label: t("products.openTracker") },
        cite: { primary: "/research", label: t("products.openResearch") },
        sights: { primary: "/sights", label: t("products.openSights") },
        radar: { primary: "#radar", label: t("products.viewRadar") },
        ledger: { primary: "#ledger", label: t("products.viewLedger") },
        data: { primary: "#data", label: t("products.viewData") },
      }) as Record<string, { primary: string; label: string }>,
    [t],
  );
  const [products, setProducts] = useState<PortfolioProduct[]>([]);
  const [radar, setRadar] = useState<RadarFeedItem[]>([]);
  const [calendar, setCalendar] = useState<
    { company_id: string; ticker: string; open_promise_count: number; periods: string[] }[]
  >([]);
  const [digestPreview, setDigestPreview] = useState<string>("");
  const [digestEmail, setDigestEmail] = useState("desk@example.com");
  const [citeTiers, setCiteTiers] = useState<{ id: string; name: string; rpm: number }[]>([]);
  const [citeUsage, setCiteUsage] = useState<{
    tier: string;
    citations_served_session: number;
  } | null>(null);
  const [sampleId, setSampleId] = useState<string>("");
  const [sampleTicker, setSampleTicker] = useState<string>("");
  const [ledgerSummary, setLedgerSummary] = useState<string>("");
  const [creditOnly, setCreditOnly] = useState(false);
  const [exports, setExports] = useState<
    { id: string; path: string; description: string }[]
  >([]);
  const [kpiCount, setKpiCount] = useState<number | null>(null);
  const [nciScore, setNciScore] = useState<number | null>(null);
  const [workbench, setWorkbench] = useState<string>("");
  const [badgeGate, setBadgeGate] = useState<string>("");
  const [flags, setFlags] = useState<Record<string, boolean | string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catalog, feed, companies, data, cal, digest, tiers, usage, meta, kpi] =
          await Promise.all([
            fetchProductsCatalog(),
            fetchRadarFeed({ limit: 12 }),
            fetchCompanies({ limit: 5 }),
            fetchDataCatalog(),
            fetchRadarCalendar(8),
            fetchRadarDigestPreview(),
            fetchCiteTiers(),
            fetchCiteUsage().catch(() => null),
            fetchMetaFlags().catch(
              (): { feature_flags?: Record<string, boolean | string> } => ({}),
            ),
            fetchKpiDictionary().catch(() => null),
          ]);
        if (cancelled) return;
        setProducts(catalog.products);
        setRadar(feed.items);
        setCalendar(cal.windows);
        setDigestPreview(
          digest.body.slice(0, 500) + (digest.body.length > 500 ? "…" : ""),
        );
        setCiteTiers(tiers.tiers);
        if (usage) {
          setCiteUsage({
            tier: usage.tier,
            citations_served_session: usage.citations_served_session,
          });
        }
        setExports(data.exports);
        setFlags(meta.feature_flags || {});
        if (kpi) setKpiCount(kpi.metric_count);
        const first = companies[0];
        if (first) {
          setSampleId(first.id);
          setSampleTicker(first.ticker);
          const [led, nci, badge, wb] = await Promise.all([
            fetchCompanyLedger(first.id),
            fetchNarrativeConsistency(first.id).catch(() => null),
            fetchTrustBadgeChannel(first.ticker).catch(() => null),
            fetchWorkbenchExtraction().catch(() => null),
          ]);
          if (!cancelled) {
            setLedgerSummary(
              t("ui.ProductsPage.ledgerSummary", {
                closed: led.summary.closed_count,
                open: led.summary.open_promise_count,
                gci: led.gci_score ?? "—",
              }),
            );
            if (nci) setNciScore(nci.nci_score);
            if (badge) setBadgeGate(badge.gate || t("ui.ProductsPage.channelMetadata"));
            if (wb) {
              setWorkbench(
                t("ui.ProductsPage.workbenchSummary", {
                  n: wb.pending_extract_batches,
                  status: wb.status,
                }),
              );
            }
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t("ui.ProductsPage.failedToLoad"));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sampleId) return;
    let cancelled = false;
    fetchCompanyLedger(sampleId, { creditOnly })
      .then((led) => {
        if (!cancelled) {
          setLedgerSummary(
            `${t("ui.ProductsPage.ledgerSummary", {
              closed: led.summary.closed_count,
              open: led.summary.open_promise_count,
              gci: led.gci_score ?? "—",
            })}${creditOnly ? t("ui.ProductsPage.creditFilterSuffix") : ""}`,
          );
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [sampleId, creditOnly, t]);

  useEffect(() => {
    const id = location.hash.replace(/^#/, "");
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash, products.length]);

  return (
    <div className="page products-page" data-testid="products-page">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      <header className="page-header">
        <p className="kicker">{t("products.kicker")}</p>
        <h1>{t("products.title")}</h1>
        <p className="lede">{t("products.lede")}</p>
      </header>

      <section className="products-section" data-testid="what-you-get">
        <h2>{t("products.whatYouGet")}</h2>
        <div className="desk-guide-grid">
          <article className="desk-guide">
            <h3>{t("products.get.screener.title")}</h3>
            <p>{t("products.get.screener.text")}</p>
            <p>
              <Link to="/tracker">{t("products.openTracker")}</Link>
            </p>
          </article>
          <article className="desk-guide">
            <h3>{t("products.get.workbench.title")}</h3>
            <p>{t("products.get.workbench.text")}</p>
            <p>
              <Link to="/desk">{t("nav.desk")}</Link>
            </p>
          </article>
          <article className="desk-guide">
            <h3>{t("products.get.search.title")}</h3>
            <p>{t("products.get.search.text")}</p>
            <p>
              <Link to="/research">{t("products.openResearch")}</Link>
            </p>
          </article>
          <article className="desk-guide">
            <h3>{t("products.get.api.title")}</h3>
            <p>{t("products.get.api.text")}</p>
            <p>
              <Link to="/developers">Developers</Link>
              {" · "}
              <Link to="/package">{t("footer.package")}</Link>
            </p>
          </article>
        </div>
      </section>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <section
        id="by-desk"
        className="products-section desk-guides"
        data-testid="by-desk-section"
        aria-label={t("products.byDesk")}
      >
        <h2>{t("products.byDesk")}</h2>
        <p className="muted">{t("products.byDesk.lede")}</p>
        <div className="desk-guide-grid">
          {DESK_GUIDES.map((desk) => (
            <article
              key={desk.id}
              id={desk.hash}
              className="desk-guide"
              data-testid={`desk-guide-${desk.id}`}
            >
              <h3>{desk.title}</h3>
              <p>{desk.blurb}</p>
              <p className="muted desk-skus">
                {t("products.skus", { skus: desk.skus.join(" · ") })}
              </p>
              <p className="desk-guide-links">
                <Link to={desk.primary.to}>{desk.primary.label}</Link>
                {desk.links.map((l) => (
                  <span key={l.to}>
                    {" · "}
                    <Link to={l.to}>{l.label}</Link>
                  </span>
                ))}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="sku-grid" aria-label={t("products.byProduct")}>
        <h2 className="sku-grid-heading">{t("products.skuAppendix")}</h2>
        <p className="muted">{t("products.skuAppendix.lede")}</p>
        {products.map((p) => {
          const link = skuLinks[p.id] ?? {
            primary: "/package",
            label: t("footer.package"),
          };
          return (
            <article key={p.id} className="sku-card" data-testid={`sku-${p.id}`}>
              <div className="sku-status">{p.status}</div>
              <h2>{p.name}</h2>
              <p>{p.job}</p>
              <p className="muted">{t("products.buyer", { buyer: p.buyer })}</p>
              {link.primary.startsWith("#") ? (
                <a href={link.primary}>{link.label}</a>
              ) : (
                <Link to={link.primary}>{link.label}</Link>
              )}
            </article>
          );
        })}
      </section>

      <section id="radar" className="products-section" data-testid="radar-section">
        <h2>{t("products.radarFeed")}</h2>
        <ul className="radar-list">
          {radar.length === 0 && <li className="muted">{t("products.radarEmpty")}</li>}
          {radar.map((item, i) => (
            <li key={`${item.company_id}-${item.kind}-${i}`}>
              <Link to={`/companies/${item.company_id}`}>
                <strong>{item.ticker}</strong>
              </Link>{" "}
              <span className={`sev sev-${item.severity}`}>{severityLabel(item.severity)}</span>{" "}
              <span>{item.message}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="products-section" data-testid="radar-calendar-section">
        <h2>{t("ui.ProductsPage.calendar.title")}</h2>
        <ul className="radar-list">
          {calendar.map((w) => (
            <li key={w.company_id}>
              <Link to={`/companies/${w.company_id}`}>
                <strong>{w.ticker}</strong>
              </Link>{" "}
              {t("ui.ProductsPage.calendar.row", {
                n: w.open_promise_count,
                periods: w.periods.join(", ") || "—",
              })}
            </li>
          ))}
        </ul>
      </section>

      <section className="products-section" data-testid="radar-digest-section">
        <details>
          <summary>
            <h2 style={{ display: "inline" }}>{t("ui.ProductsPage.digest.title")}</h2>
          </summary>
          <pre className="digest-preview">{digestPreview || t("ui.ProductsPage.loading")}</pre>
          <div className="queue-ingest-row" style={{ marginTop: 12, flexWrap: "wrap", gap: 8 }}>
            <input
              type="email"
              value={digestEmail}
              onChange={(e) => setDigestEmail(e.target.value)}
              aria-label={t("ui.ProductsPage.digest.emailAria")}
              data-testid="radar-digest-email"
              style={{ minWidth: 200 }}
            />
            <button
              type="button"
              className="btn small"
              data-testid="radar-digest-send"
              onClick={async () => {
                try {
                  const r = await postRadarDigestSend(digestEmail);
                  if (r.status === "disabled") {
                    setToast(t("ui.ProductsPage.digest.disabled"));
                  } else {
                    setToast(
                      `${t("ui.ProductsPage.digest.status", { status: r.status })}${
                        r.mail?.status
                          ? t("ui.ProductsPage.digest.mailStatus", { status: r.mail.status })
                          : ""
                      }`,
                    );
                  }
                } catch (e) {
                  setToast(e instanceof Error ? e.message : t("ui.ProductsPage.digest.sendFailed"));
                }
              }}
            >
              {t("ui.ProductsPage.digest.send")}
            </button>
          </div>
        </details>
      </section>

      <section id="ledger" className="products-section" data-testid="ledger-section">
        <h2>{t("ui.ProductsPage.ledger.title", { ticker: sampleTicker || "…" })}</h2>
        <p>{ledgerSummary || t("ui.ProductsPage.loading")}</p>
        <div className="queue-ingest-row" style={{ flexWrap: "wrap", gap: 8 }}>
          <label className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={creditOnly}
              onChange={(e) => setCreditOnly(e.target.checked)}
              data-testid="products-credit-only"
            />
            {t("ui.ProductsPage.ledger.creditOnly")}
          </label>
          <button
            type="button"
            className="btn small"
            disabled={!sampleId}
            data-testid="products-ledger-pdf"
            onClick={async () => {
              if (!sampleId || !sampleTicker) return;
              try {
                const blob = await downloadLedgerPdf(sampleId, { creditOnly });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `ledger-${sampleTicker}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
                setToast(t("ui.ProductsPage.ledger.pdfDownloaded"));
              } catch (e) {
                setToast(e instanceof Error ? e.message : t("ui.ProductsPage.ledger.pdfFailed"));
              }
            }}
          >
            {t("ui.ProductsPage.ledger.downloadPdf")}
          </button>
          <button
            type="button"
            className="btn ghost small"
            disabled={!sampleId}
            data-testid="products-ir-mirror"
            onClick={async () => {
              if (!sampleId) return;
              try {
                const m = await fetchLedgerMirror(sampleId);
                setLedgerSummary(
                  t("ui.ProductsPage.ledger.irSummary", {
                    closed: m.summary.closed_count,
                    avg: m.peer_context?.sector_avg_gci ?? "—",
                  }),
                );
                setToast(t("ui.ProductsPage.ledger.irLoaded"));
              } catch {
                setToast(t("ui.ProductsPage.ledger.irNeedsFlag"));
              }
            }}
          >
            {t("ui.ProductsPage.ledger.irMirror")}
          </button>
          {sampleId && (
            <Link className="btn ghost small" to={`/companies/${sampleId}#ledger`}>
              {t("ui.ProductsPage.ledger.openDossier")}
            </Link>
          )}
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          {t("ui.ProductsPage.ledger.flag", { value: String(flags.IR_MIRROR ?? false) })}
        </p>
      </section>

      <section id="data" className="products-section" data-testid="data-section">
        <h2>{t("ui.ProductsPage.data.title")}</h2>
        <ul>
          {exports.map((e) => (
            <li key={e.id}>
              <code>{e.path}</code> — {e.description}
            </li>
          ))}
        </ul>
        <div className="queue-ingest-row" style={{ flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {(["json", "csv"] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              className="btn small"
              data-testid={`export-outcomes-${fmt}`}
              onClick={async () => {
                try {
                  const blob = await downloadOutcomesExport(fmt, 50);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `outcomes_bulk.${fmt === "json" ? "json" : "csv"}`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setToast(t("ui.ProductsPage.data.downloaded", { fmt }));
                } catch (e) {
                  setToast(e instanceof Error ? e.message : t("ui.ProductsPage.data.exportFailed"));
                }
              }}
            >
              {t("ui.ProductsPage.data.download", { fmt: fmt.toUpperCase() })}
            </button>
          ))}
        </div>
        {kpiCount != null && (
          <p className="muted" style={{ marginTop: 12 }}>
            {t("ui.ProductsPage.data.kpi", { n: kpiCount })}
          </p>
        )}
      </section>

      <section className="products-section" data-testid="cite-section">
        <h2>Cite API</h2>
        <ul>
          {citeTiers.map((tier) => (
            <li key={tier.id}>
              <strong>{tier.name}</strong> — {t("ui.ProductsPage.cite.rpm", { rpm: tier.rpm })}
            </li>
          ))}
        </ul>
        {citeUsage && (
          <p data-testid="cite-usage">
            {t("ui.ProductsPage.cite.usageBefore")} <strong>{citeUsage.tier}</strong> ·{" "}
            {t("ui.ProductsPage.cite.usageAfter", { n: citeUsage.citations_served_session })}
          </p>
        )}
        <Link className="btn ghost small" to="/research">
          {t("ui.ProductsPage.cite.openResearch")}
        </Link>
      </section>

      <section className="products-section" data-testid="stretch-section">
        <details>
          <summary>
            <h2 style={{ display: "inline" }}>{t("ui.ProductsPage.stretch.title")}</h2>
          </summary>
          <ul className="radar-list">
            <li data-testid="nci-summary">
              {t("ui.ProductsPage.stretch.nci", {
                ticker: sampleTicker || "—",
                score: nciScore ?? "—",
              })}{" "}
              {sampleId && (
                <Link to={`/companies/${sampleId}#ledger`}>{t("ui.ProductsPage.stretch.viewOnDossier")}</Link>
              )}
            </li>
            <li>{t("ui.ProductsPage.stretch.badge", { value: badgeGate || "—" })}</li>
            <li>{t("ui.ProductsPage.stretch.workbench", { value: workbench || "—" })}</li>
          </ul>
        </details>
      </section>

      <p className="muted">
        {t("ui.ProductsPage.footer.before")}{" "}
        <Link to="/package">{t("ui.ProductsPage.footer.link")}</Link>
        {t("ui.ProductsPage.footer.after")}
      </p>
      <Disclaimer />
    </div>
  );
}
