import type { Metadata } from "next";
import Link from "next/link";
import { articles, hub } from "@/data";
import { countdownState, dateLine, orderArticles, RELEASE_LOCAL } from "@/lib";
import { ArtImage, Breadcrumbs, GTA6_CRUMB, PageHeading } from "@/components/ui";
import { CountdownTimer } from "@/components/content/Countdown";

export const metadata: Metadata = {
  title: "GTA 6 Hub: Map, Database, Guides & Release Info | Leonida Atlas",
  description: "Everything on GTA 6 in one place: database, interactive map, checklists, guides, cheats and media.",
};

export const dynamic = "force-dynamic";

/** GTA 6 hub (R-1314..R-1318). */
export default function HubPage() {
  const latest = orderArticles(articles).slice(0, hub.latestNewsCount);
  const offset = new Date(RELEASE_LOCAL.year, RELEASE_LOCAL.monthIndex, RELEASE_LOCAL.day).getTimezoneOffset();
  const initial = countdownState(Date.now(), offset);
  const [headGrid, ...sectionGrids] = hub.cardGrids;

  return (
    <div className="atlas-hub">
      <Breadcrumbs items={[GTA6_CRUMB, { label: "Overview" }]} />
      <PageHeading>{hub.title}</PageHeading>
      <ArtImage art={hub.banner} alt="GTA 6 — Leonida Atlas banner" className="atlas-banner" loading="eager" />

      <div className="atlas-hub-top">
        <section className="atlas-countdown" data-testid="countdown" aria-labelledby="atlas-countdown-title">
          <h2 id="atlas-countdown-title" className="atlas-countdown-title caps">
            <Link href="/gta-6/" data-testid="countdown-title">
              {hub.countdownTitle}
            </Link>
          </h2>
          <CountdownTimer initial={initial} />
        </section>

        <section className="atlas-info" aria-labelledby="atlas-info-title">
          <h2 id="atlas-info-title" className="atlas-info-title caps" data-testid="info-title hub-section-headings">
            {hub.infoTitle}
          </h2>
          <dl className="atlas-info-rows">
            {hub.infoRows.map((row) => (
              <div key={row.label} className="atlas-info-row">
                <dt data-testid="info-labels">{row.label}</dt>
                <dd data-testid="info-values">
                  {row.values.map((v, i) => (
                    <span key={v.text}>
                      {i > 0 ? ", " : null}
                      {v.href ? (
                        <Link href={v.href} data-testid="info-links">
                          {v.text}
                        </Link>
                      ) : (
                        v.text
                      )}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="atlas-hub-about">
        <h2 className="atlas-hub-h2 caps" data-testid="hub-section-headings">
          {hub.aboutHeading}
        </h2>
        {hub.about.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </section>

      <HubGrid cards={headGrid.cards} />

      {sectionGrids.map((grid) => (
        <section key={grid.id} className="atlas-hub-section">
          <h2 className="atlas-hub-h2 caps" data-testid="hub-section-headings">
            {grid.heading}
          </h2>
          <HubGrid cards={grid.cards} />
        </section>
      ))}

      <section className="atlas-hub-section">
        <h2 className="atlas-hub-h2 caps" data-testid="hub-section-headings">
          {hub.latestNewsHeading}
        </h2>
        <ol className="atlas-hub-news">
          {latest.map((a) => (
            <li key={a.slug} data-testid="hub-news-items" className="atlas-hub-news-item">
              <Link href={a.canonicalPath} className="atlas-hub-news-link">
                <ArtImage art={a.hero} alt="" width={160} height={90} className="atlas-hub-news-thumb" />
                <span className="atlas-hub-news-title">{a.title}</span>
              </Link>
              <time dateTime={a.publishedAt} data-testid="hub-news-dates" className="atlas-hub-news-date">
                {dateLine("hub", a.publishedAt)}
              </time>
            </li>
          ))}
        </ol>
        <p>
          <Link href={hub.allNewsLink.href} className="atlas-pill atlas-pill-primary" data-testid="hub-all-news-link">
            {hub.allNewsLink.text}
          </Link>
        </p>
      </section>
    </div>
  );
}

function HubGrid({ cards }: { cards: { label: string; path: string; image: import("@/data").ArtRef }[] }) {
  return (
    <ul className="atlas-hub-grid">
      {cards.map((c) => (
        <li key={c.label}>
          <Link href={c.path} className="atlas-hub-card atlas-card" data-testid="hub-cards">
            <ArtImage art={c.image} alt="" width={320} height={180} className="atlas-hub-card-img" />
            <span className="atlas-hub-card-title caps" data-testid="hub-card-titles">
              {c.label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
