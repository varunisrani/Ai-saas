/**
 * Gang detail page (F2 family, R-601..R-621 as they apply to gangs): h1, breadcrumb link, share actions, rating
 * block + "Add To Favorites", sections "<NAME>: GTA 6 Info" (Gang Type, Territory) and "<NAME> Description:",
 * the lazy previous/next pager and the comments placeholder.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { gangs, getNeighbours, type Gang } from "@/data";
import { breadcrumbHref, breadcrumbLabel, detailSectionTitles, detailTitle, ratingText } from "@/lib";
import { ArtImage, Breadcrumbs, GTA6_CRUMB, PageHeading, ShareActions } from "@/components/ui";
import { ArticlePager } from "./ArticlePager";
import { FavoriteButton } from "@/components/favorites";

export function gangMetadata(g: Gang): Metadata {
  return { title: detailTitle("gang", g.name), description: g.description, alternates: { canonical: g.canonicalPath } };
}

export function findGang(slug: string): Gang | undefined {
  return gangs.find((g) => g.slug === slug);
}

function Stars({ average }: { average: number }) {
  return (
    <span className="atlas-stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, average - (i - 1)));
        return (
          <svg key={i} viewBox="0 0 24 24" width="18" height="18" data-testid="rating-stars" focusable="false">
            <defs>
              <linearGradient id={`star-${i}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="#FF6A4D" />
                <stop offset={`${fill * 100}%`} stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
              fill={`url(#star-${i}-${Math.round(fill * 100)})`}
              stroke="#B23A22"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </span>
  );
}

export function GangDetail({ gang: g }: { gang: Gang }) {
  const titles = detailSectionTitles("gang", g.name);
  const info = titles.find((t) => t.key === "info");
  const desc = titles.find((t) => t.key === "description");
  const { prev, next } = getNeighbours("gangs", g.slug);
  const rows = [
    { label: "Gang Type", value: g.type },
    { label: "Territory", value: g.territory },
  ].filter((r) => r.value);
  return (
    <article className="atlas-article atlas-detail">
      <Breadcrumbs items={[GTA6_CRUMB, { label: "Gangs & Factions", href: "/gta-6/gangs/" }, { label: g.name }]} />
      <PageHeading>{g.name}</PageHeading>
      <p>
        <Link href={breadcrumbHref("gang")} data-testid="breadcrumb">
          {breadcrumbLabel("gang")}
        </Link>
      </p>
      <ShareActions title={g.name} />
      <div className="atlas-action-row">
        <div className="atlas-rating" data-testid="rating-block" role="img" aria-label={ratingText(g.rating.average, g.rating.votes)}>
          <Stars average={g.rating.average} />
          <span data-testid="rating-total">{ratingText(g.rating.average, g.rating.votes)}</span>
        </div>
        <FavoriteButton list="gangs" slug={g.slug} />
      </div>
      <div className="atlas-article-body atlas-prose">
        <ArtImage art={g.image} alt={g.name} className="atlas-article-hero" />
        {info ? (
          <section>
            <h2 className={info.caps ? "caps" : undefined} data-testid="section-titles">
              {info.text}
            </h2>
            <dl className="atlas-info-rows">
              {rows.map((r) => (
                <div key={r.label} className="atlas-info-row">
                  <dt data-testid="info-labels">{r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
        {desc ? (
          <section>
            <h2 className={desc.caps ? "caps" : undefined} data-testid="section-titles">
              {desc.text}
            </h2>
            <p>{g.description}</p>
          </section>
        ) : null}
      </div>
      <section className="atlas-comments" data-testid="comments" aria-labelledby={`comments-${g.slug}`}>
        <h3 id={`comments-${g.slug}`}>Comments</h3>
        <p>Comments are coming later.</p>
      </section>
      <ArticlePager
        label="More gangs"
        prev={prev ? { title: prev.name, href: prev.path } : null}
        next={next ? { title: next.name, href: next.path } : null}
      />
    </article>
  );
}
