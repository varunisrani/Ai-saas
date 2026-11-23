/**
 * Frame of every detail page of this builder (R-603..R-605, R-620, R-621, R-622): header block (breadcrumb link to
 * the list/guide page, the h1, share actions, vehicle header images), the action row (rating, "Add To Favorites",
 * "Compare To" for vehicles and weapons), the content sections, the deferred previous/next links and the comments
 * placeholder. No tabs or accordions.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import type { ArtRef, Rating } from "@/data";
import { breadcrumbHref, breadcrumbLabel, type DetailType } from "@/lib";
import { ArtImage, Breadcrumbs, GTA6_CRUMB, PageHeading, ShareActions, type Crumb } from "@/components/ui";
import { FavoriteButton } from "@/components/favorites";
import { CompareToMenu, type CompareToEntryLink } from "./CompareToMenu";
import { DeferredPager, type PagerTarget } from "./DeferredPager";
import { CommentsPlaceholder, RatingBlock } from "./parts";

export interface DetailShellProps {
  type: DetailType;
  h1: string;
  /** Footer trail section crumb (e.g. "Vehicles" → /gta-6/vehicles/). */
  section: Crumb;
  /** Route list name for favorites (R-1403). */
  list: string;
  slug: string;
  rating: Rating;
  heroImages?: { art: ArtRef; alt: string; logo?: boolean }[];
  compareTo?: CompareToEntryLink[];
  prev?: PagerTarget;
  next?: PagerTarget;
  /** Optional lead under the heading (own text). */
  lead?: ReactNode;
  children: ReactNode;
}

export function DetailShell(p: DetailShellProps) {
  return (
    <article className="flex flex-col gap-5" aria-labelledby="detail-h1">
      <Breadcrumbs items={[GTA6_CRUMB, p.section, { label: p.h1 }]} />
      <header className="flex flex-col gap-3">
        <Link href={breadcrumbHref(p.type)} data-testid="breadcrumb" className="self-start text-sm font-semibold">
          {breadcrumbLabel(p.type)}
        </Link>
        <PageHeading id="detail-h1">{p.h1}</PageHeading>
        {p.lead ? <div className="max-w-3xl text-muted">{p.lead}</div> : null}
        <ShareActions title={p.h1} />
        {p.heroImages?.length ? (
          <div className="relative">
            {p.heroImages
              .filter((h) => !h.logo)
              .map((h) => (
                <ArtImage
                  key={h.alt}
                  art={h.art}
                  alt={h.alt}
                  loading="eager"
                  data-testid="hero-image"
                  className="aspect-[16/9] w-full rounded-card border border-sand-dark bg-sand object-cover"
                />
              ))}
            {p.heroImages
              .filter((h) => h.logo)
              .map((h) => (
                <ArtImage
                  key={h.alt}
                  art={h.art}
                  alt={h.alt}
                  loading="eager"
                  data-testid="hero-image"
                  className="absolute right-3 top-3 h-16 w-16 rounded-full border-2 border-white shadow-soft"
                />
              ))}
          </div>
        ) : null}
      </header>
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-sand-dark bg-white px-4 py-3">
        <RatingBlock average={p.rating.average} votes={p.rating.votes} />
        <span className="hidden h-6 w-px bg-sand-dark sm:block" aria-hidden="true" />
        <FavoriteButton list={p.list} slug={p.slug} />
        {p.compareTo ? <CompareToMenu entries={p.compareTo} /> : null}
      </div>
      <div className="flex flex-col gap-5">{p.children}</div>
      <DeferredPager prev={p.prev} next={p.next} />
      <CommentsPlaceholder />
    </article>
  );
}
