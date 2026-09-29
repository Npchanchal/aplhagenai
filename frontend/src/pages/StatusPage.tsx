import { useEffect, useState } from "react";
import Disclaimer from "../components/Disclaimer";
import { useI18n } from "../i18n";

type StatusPayload = {
  ok: boolean;
  api: string;
  index_file?: { name?: string; sha256?: string } | null;
};

export default function StatusPage() {
  const { t } = useI18n();
  const [data, setData] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/status");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const body = (await r.json()) as StatusPayload;
        if (!cancelled) setData(body);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t("common.error"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <section className="help-page" data-testid="status-page">
      <p className="page-kicker">{t("status.kicker")}</p>
      <h1>{t("status.title")}</h1>
      <p className="muted lede">{t("status.lede")}</p>
      {error && <p className="error">{error}</p>}
      {data && (
        <div className="panel">
          <ul className="about-list">
            <li>
              API: <strong>{data.ok ? "up" : "down"}</strong> ({data.api})
            </li>
            <li>
              Latest index file:{" "}
              {data.index_file?.name ? (
                <>
                  <code>{data.index_file.name}</code>
                  {data.index_file.sha256 ? (
                    <>
                      {" "}
                      · sha256 <code>{data.index_file.sha256.slice(0, 12)}…</code>
                    </>
                  ) : null}
                </>
              ) : (
                "—"
              )}
            </li>
          </ul>
        </div>
      )}
      <Disclaimer />
    </section>
  );
}
