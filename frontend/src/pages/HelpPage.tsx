import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import InfoTip from "../components/InfoTip";
import { GLOSSARY, HELP_SECTIONS } from "../lib/glossary";
import { useTour } from "../lib/TourProvider";
import { TOURS, type TourId } from "../lib/tours";
import { useI18n } from "../i18n";

function TermSection({
  title,
  ids,
  needle,
}: {
  title: string;
  ids: string[];
  needle: string;
}) {
  const rows = ids
    .map((id) => GLOSSARY[id])
    .filter(Boolean)
    .filter((item) => {
      if (!needle) return true;
      return (
        item.term.toLowerCase().includes(needle) ||
        item.tip.toLowerCase().includes(needle) ||
        item.id.toLowerCase().includes(needle)
      );
    });
  if (rows.length === 0) return null;
  return (
    <div className="help-section">
      <h2>{title}</h2>
      <dl className="glossary">
        {rows.map((item) => (
          <div className="glossary-row" key={item.id}>
            <dt>
              {item.term} <InfoTip termId={item.id} />
            </dt>
            <dd>{item.tip}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const QUICK = [
  {
    to: "/about",
    title: "About IntelLens",
    tip: "gci",
    text: "What it is, why it matters, how it works, who uses it",
  },
  {
    to: "/",
    title: "Guidance Credibility Index",
    tip: "tracker",
    text: "Screen Sensex GCI · open evidence + charts",
  },
  {
    to: "/desk",
    title: "Desk",
    tip: "desk_sku",
    text: "Review, Corpus foundation, cite-only Reports, PIT, Parameters",
  },
  {
    to: "/research",
    title: "Research",
    tip: "research_terminal",
    text: "Search, cite-only chat, MoM/QoQ/YoY snapshot",
  },
  {
    to: "/help",
    title: "Glossary",
    tip: "tier1",
    text: "Tier 1 / citability / Granger terms",
  },
  {
    to: "/package",
    title: "Package",
    tip: "one_stop",
    text: "Plans and One-Stop commercial map",
  },
];

export default function HelpPage() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const { startTour, seen, resetSeen } = useTour();
  const navigate = useNavigate();

  function launch(id: TourId) {
    const tour = TOURS.find((x) => x.id === id);
    if (!tour) return;
    navigate(tour.startRoute);
    window.setTimeout(() => startTour(id), 150);
  }

  return (
    <section className="help-page" data-testid="help-page">
      <p className="page-kicker">{t("help.kicker")}</p>
      <h1>
        {t("help.title")} <InfoTip termId="gci" />
      </h1>
      <p className="muted lede">{t("help.lede")}</p>

      <div className="panel" data-testid="tours-hub">
        <h2 style={{ marginTop: 0 }}>Guided tours</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Spotlight walkthroughs of each surface. Use <strong>Tours</strong> in the
          header anytime. Esc skips · ←/→ navigate steps.
        </p>
        <div className="help-quick">
          {TOURS.map((tour) => (
            <button
              key={tour.id}
              type="button"
              className="help-quick-card"
              data-testid={`help-tour-${tour.id}`}
              onClick={() => launch(tour.id)}
              style={{ cursor: "pointer", textAlign: "left", border: "none", width: "100%" }}
            >
              <strong>
                {tour.title}
                {seen[tour.id] ? " · seen" : ""}
              </strong>
              <span className="muted">{tour.blurb}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn ghost"
          style={{ marginTop: 12 }}
          onClick={() => resetSeen()}
        >
          Reset tour progress
        </button>
      </div>

      <label className="universe-search help-search">
        Find a term
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="GCI, citeable, Granger, PIT, MoM…"
          data-testid="help-search"
          autoComplete="off"
        />
      </label>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Start here</h2>
        <div className="help-quick">
          {QUICK.map((item) => (
            <Link key={item.to} to={item.to} className="help-quick-card">
              <strong>
                {item.title} <InfoTip termId={item.tip} />
              </strong>
              <span className="muted">{item.text}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0 }}>
          Source policy <InfoTip termId="source_policy" />
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          What can feed GCI vs what stays out of the score.
        </p>
        <div className="source-pills" style={{ marginTop: 12 }}>
          {[
            { ok: true, label: "Transcripts" },
            { ok: true, label: "Filings / PDF text" },
            { ok: true, label: "IR HTML / PPT text" },
            { ok: true, label: "ASR → transcript" },
            { ok: true, label: "Reported actuals" },
            { ok: false, label: "Raw audio/video scoring" },
            { ok: false, label: "Technicals" },
            { ok: false, label: "Shenanigans" },
            { ok: false, label: "Sentiment-only" },
          ].map((s) => (
            <span key={s.label} className={`source-pill ${s.ok ? "in" : "out"}`}>
              {s.ok ? "✓" : "✕"} {s.label}
            </span>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}>
          Full catalog:{" "}
          <Link to="/desk" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Desk → Parameters
          </Link>{" "}
          · API <code className="inline-code">GET /api/metrics</code>
        </p>
      </div>

      <div className="panel">
        {HELP_SECTIONS.map((section) => (
          <TermSection
            key={section.title}
            title={section.title}
            ids={section.ids}
            needle={needle}
          />
        ))}
        {needle &&
          HELP_SECTIONS.every((section) =>
            section.ids.every((id) => {
              const item = GLOSSARY[id];
              if (!item) return true;
              return !(
                item.term.toLowerCase().includes(needle) ||
                item.tip.toLowerCase().includes(needle) ||
                item.id.toLowerCase().includes(needle)
              );
            })
          ) && (
            <div className="empty">No glossary terms match “{q.trim()}”.</div>
          )}
      </div>
      <Disclaimer />
    </section>
  );
}
