import { Link } from "react-router-dom";
import Disclaimer from "../components/Disclaimer";
import InfoTip from "../components/InfoTip";
import { useI18n } from "../i18n";

const SHOT = "/screenshots/tiers";
/** Bump when recapturing: /screenshots is cached 30 days under unchanged file names. */
const SHOT_VERSION = "2026-09-27";
const shotSrc = (src: string) => `${src}?v=${SHOT_VERSION}`;

type StatusRow = { label: string; status: string };

type Feature = {
  id: string;
  ask: string;
  title: string;
  body: string;
  images: { src: string; alt: string }[];
  rows?: StatusRow[];
};

type Tier = {
  id: string;
  kicker: string;
  title: string;
  tip?: string;
  intro: string;
  features: Feature[];
};

const TIERS: Tier[] = [
  {
    id: "tier1",
    kicker: "ui.TierFeaturesPage.tier1.kicker",
    title: "ui.TierFeaturesPage.tier1.title",
    tip: "tier1",
    intro:
      "ui.TierFeaturesPage.tier1.intro",
    features: [
      {
        id: "ask-1",
        ask: "#1",
        title: "ui.TierFeaturesPage.ask-1.title",
        body: "ui.TierFeaturesPage.ask-1.body",
        images: [{ src: `${SHOT}/01-entity-search.png`, alt: "ui.TierFeaturesPage.ask-1.img0" }],
        rows: [
          { label: "ui.TierFeaturesPage.ask-1.row0", status: "ui.TierFeaturesPage.status.live" },
          { label: "ui.TierFeaturesPage.ask-1.row1", status: "ui.TierFeaturesPage.status.live" },
          { label: "ui.TierFeaturesPage.ask-1.row2", status: "ui.TierFeaturesPage.status.live" },
        ],
      },
      {
        id: "ask-4-5",
        ask: "#4 / #5",
        title: "ui.TierFeaturesPage.ask-4-5.title",
        body: "ui.TierFeaturesPage.ask-4-5.body",
        images: [
          { src: `${SHOT}/05-auto-ingest-crawl.png`, alt: "ui.TierFeaturesPage.ask-4-5.img0" },
          { src: `${SHOT}/05b-corpus-foundation.png`, alt: "ui.TierFeaturesPage.ask-4-5.img1" },
          { src: `${SHOT}/04-period-documents.png`, alt: "ui.TierFeaturesPage.ask-4-5.img2" },
        ],
        rows: [
          { label: "ui.TierFeaturesPage.ask-4-5.row0", status: "ui.TierFeaturesPage.status.live" },
          { label: "ui.TierFeaturesPage.ask-4-5.row1", status: "ui.TierFeaturesPage.status.live_sensex_hl" },
          { label: "ui.TierFeaturesPage.ask-4-5.row2", status: "ui.TierFeaturesPage.status.live" },
          { label: "ui.TierFeaturesPage.ask-4-5.row3", status: "ui.TierFeaturesPage.status.exception_only" },
        ],
      },
      {
        id: "ask-6",
        ask: "#6",
        title: "ui.TierFeaturesPage.ask-6.title",
        body: "ui.TierFeaturesPage.ask-6.body",
        images: [
          { src: `${SHOT}/06-citability-evidence.png`, alt: "ui.TierFeaturesPage.ask-6.img0" },
        ],
        rows: [
          { label: "ui.TierFeaturesPage.ask-6.row0", status: "ui.TierFeaturesPage.status.live_on_hand_labeled" },
          { label: "ui.TierFeaturesPage.ask-6.row1", status: "ui.TierFeaturesPage.status.live" },
          { label: "ui.TierFeaturesPage.ask-6.row2", status: "ui.TierFeaturesPage.status.live" },
        ],
      },
    ],
  },
  {
    id: "tier2",
    kicker: "ui.TierFeaturesPage.tier2.kicker",
    title: "ui.TierFeaturesPage.tier2.title",
    intro: "ui.TierFeaturesPage.tier2.intro",
    features: [
      {
        id: "ask-2",
        ask: "#2",
        title: "ui.TierFeaturesPage.ask-2.title",
        body: "ui.TierFeaturesPage.ask-2.body",
        images: [
          { src: `${SHOT}/02-multi-horizon-deltas.png`, alt: "ui.TierFeaturesPage.ask-2.img0" },
          { src: `${SHOT}/02b-horizon-bars.png`, alt: "ui.TierFeaturesPage.ask-2.img1" },
        ],
      },
      {
        id: "ask-3",
        ask: "#3",
        title: "ui.TierFeaturesPage.ask-3.title",
        body: "ui.TierFeaturesPage.ask-3.body",
        images: [{ src: `${SHOT}/03-delta-charts-trend.png`, alt: "ui.TierFeaturesPage.ask-3.img0" }],
      },
      {
        id: "ask-7",
        ask: "#7",
        title: "ui.TierFeaturesPage.ask-7.title",
        body: "ui.TierFeaturesPage.ask-7.body",
        images: [{ src: `${SHOT}/07-gci-vs-price.png`, alt: "ui.TierFeaturesPage.ask-7.img0" }],
        rows: [
          { label: "ui.TierFeaturesPage.ask-7.row0", status: "ui.TierFeaturesPage.status.yes" },
          { label: "ui.TierFeaturesPage.ask-7.row1", status: "ui.TierFeaturesPage.status.no" },
          { label: "ui.TierFeaturesPage.ask-7.row2", status: "ui.TierFeaturesPage.status.yes" },
        ],
      },
      {
        id: "ask-10",
        ask: "#10",
        title: "ui.TierFeaturesPage.ask-10.title",
        body: "ui.TierFeaturesPage.ask-10.body",
        images: [{ src: `${SHOT}/10-private-notes.png`, alt: "ui.TierFeaturesPage.ask-10.img0" }],
      },
      {
        id: "ask-11",
        ask: "#11",
        title: "ui.TierFeaturesPage.ask-11.title",
        body: "ui.TierFeaturesPage.ask-11.body",
        images: [
          { src: `${SHOT}/11-report-templates-desk.png`, alt: "ui.TierFeaturesPage.ask-11.img0" },
          { src: `${SHOT}/11-report-templates-dossier.png`, alt: "ui.TierFeaturesPage.ask-11.img1" },
        ],
      },
    ],
  },
  {
    id: "tier3",
    kicker: "ui.TierFeaturesPage.tier3.kicker",
    title: "ui.TierFeaturesPage.tier3.title",
    tip: "granger",
    intro:
      "ui.TierFeaturesPage.tier3.intro",
    features: [
      {
        id: "ask-8",
        ask: "#8",
        title: "ui.TierFeaturesPage.ask-8.title",
        body: "ui.TierFeaturesPage.ask-8.body",
        images: [{ src: `${SHOT}/08-lead-lag-granger.png`, alt: "ui.TierFeaturesPage.ask-8.img0" }],
      },
      {
        id: "ask-9",
        ask: "#9",
        title: "ui.TierFeaturesPage.ask-9.title",
        body: "ui.TierFeaturesPage.ask-9.body",
        images: [{ src: `${SHOT}/09-impact-map.png`, alt: "ui.TierFeaturesPage.ask-9.img0" }],
      },
    ],
  },
];

const METHODS = [
  {
    n: "1",
    name: "ui.TierFeaturesPage.method1.name",
    role: "ui.TierFeaturesPage.method1.role",
    stance: "ui.TierFeaturesPage.method1.stance",
  },
  {
    n: "2",
    name: "ui.TierFeaturesPage.method2.name",
    role: "ui.TierFeaturesPage.method2.role",
    stance: "ui.TierFeaturesPage.method2.stance",
  },
  {
    n: "3",
    name: "ui.TierFeaturesPage.method3.name",
    role: "ui.TierFeaturesPage.method3.role",
    stance: "ui.TierFeaturesPage.method3.stance",
  },
  {
    n: "4",
    name: "ui.TierFeaturesPage.method4.name",
    role: "ui.TierFeaturesPage.method4.role",
    stance: "ui.TierFeaturesPage.method4.stance",
  },
  {
    n: "5",
    name: "ui.TierFeaturesPage.method5.name",
    role: "ui.TierFeaturesPage.method5.role",
    stance: "ui.TierFeaturesPage.method5.stance",
  },
  {
    n: "6",
    name: "ui.TierFeaturesPage.method6.name",
    role: "ui.TierFeaturesPage.method6.role",
    stance: "ui.TierFeaturesPage.method6.stance",
  },
] as const;

function FeatureBlock({ feature }: { feature: Feature }) {
  const { t } = useI18n();
  return (
    <article className="tier-feature" id={feature.id} data-testid={`tier-feature-${feature.id}`}>
      <header className="tier-feature-head">
        <span className="tier-ask">{feature.ask}</span>
        <h3>{t(feature.title)}</h3>
      </header>
      <p className="muted">{t(feature.body)}</p>
      <div className={`tier-shots ${feature.images.length > 1 ? "multi" : ""}`}>
        {feature.images.map((img) => (
          <figure key={img.src} className="tier-shot">
            <a href={shotSrc(img.src)} target="_blank" rel="noreferrer">
              <img src={shotSrc(img.src)} alt={t(img.alt)} loading="lazy" />
            </a>
            <figcaption>{t(img.alt)}</figcaption>
          </figure>
        ))}
      </div>
      {feature.rows && feature.rows.length > 0 && (
        <table className="table tier-status-table">
          <thead>
            <tr>
              <th>{t("ui.TierFeaturesPage.th.whatYouSee")}</th>
              <th>{t("ui.TierFeaturesPage.th.status")}</th>
            </tr>
          </thead>
          <tbody>
            {feature.rows.map((r) => (
              <tr key={r.label}>
                <td>{t(r.label)}</td>
                <td>{t(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}

export default function TierFeaturesPage() {
  const { t } = useI18n();
  return (
    <section className="about-page tier-features-page" data-testid="tier-features-page">
      <p className="page-kicker">
        <Link to="/about">{t("ui.TierFeaturesPage.kicker.about")}</Link>
        {" · "}
        {t("ui.TierFeaturesPage.kicker.tiers")}
      </p>
      <h1>
        {t("ui.TierFeaturesPage.title")} <InfoTip termId="tier1" />
      </h1>
      <p className="muted lede">
        {t("ui.TierFeaturesPage.lede")}
      </p>

      <nav className="about-toc" aria-label={t("ui.TierFeaturesPage.tocAria")}>
        <a href="#tier1">{t("ui.TierFeaturesPage.toc.tier1")}</a>
        <a href="#tier2">{t("ui.TierFeaturesPage.toc.tier2")}</a>
        <a href="#tier3">{t("ui.TierFeaturesPage.toc.tier3")}</a>
        <a href="#methodology">{t("ui.TierFeaturesPage.toc.methodology")}</a>
        <Link to="/about#tiers">{t("ui.TierFeaturesPage.toc.back")}</Link>
      </nav>

      <div className="panel tier-hero-shots">
        <figure className="tier-shot">
          <img
            src={shotSrc(`${SHOT}/00-tracker-overview.png`)}
            alt={t("ui.TierFeaturesPage.hero.trackerAlt")}
            loading="eager"
          />
          <figcaption>{t("ui.TierFeaturesPage.hero.trackerCaption")}</figcaption>
        </figure>
        <figure className="tier-shot">
          <img
            src={shotSrc(`${SHOT}/00-about-tiers.png`)}
            alt={t("ui.TierFeaturesPage.hero.aboutAlt")}
            loading="eager"
          />
          <figcaption>{t("ui.TierFeaturesPage.hero.aboutCaption")}</figcaption>
        </figure>
      </div>

      {TIERS.map((tier) => (
        <div className="panel" id={tier.id} key={tier.id}>
          <p className="tier-section-kicker">{t(tier.kicker)}</p>
          <h2 style={{ marginTop: 0 }}>
            {t(tier.title)} {tier.tip ? <InfoTip termId={tier.tip} /> : null}
          </h2>
          <p className="muted" style={{ marginTop: 0 }}>
            {t(tier.intro)}
          </p>
          <div className="tier-feature-list">
            {tier.features.map((f) => (
              <FeatureBlock key={f.id} feature={f} />
            ))}
          </div>
        </div>
      ))}

      <div className="panel" id="methodology">
        <h2 style={{ marginTop: 0 }}>
          {t("ui.TierFeaturesPage.methodology.title")} <InfoTip termId="granger" />
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {t("ui.TierFeaturesPage.methodology.intro")}
        </p>
        <div className="table-scroll">
          <table className="table" data-testid="methodology-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("ui.TierFeaturesPage.methodology.th.method")}</th>
                <th>{t("ui.TierFeaturesPage.methodology.th.role")}</th>
                <th>{t("ui.TierFeaturesPage.methodology.th.stance")}</th>
              </tr>
            </thead>
            <tbody>
              {METHODS.map((m) => (
                <tr key={m.n}>
                  <td>{m.n}</td>
                  <td>
                    <strong>{t(m.name)}</strong>
                  </td>
                  <td>{t(m.role)}</td>
                  <td>{t(m.stance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="about-cta-row">
        <Link to="/about" className="btn ghost">
          {t("ui.TierFeaturesPage.cta.about")}
        </Link>
        <Link to="/tracker" className="btn">
          {t("ui.TierFeaturesPage.cta.tracker")}
        </Link>
        <Link to="/companies/infy" className="btn ghost">
          {t("ui.TierFeaturesPage.cta.infy")}
        </Link>
      </div>

      <Disclaimer />
    </section>
  );
}
