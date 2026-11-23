/**
 * Building blocks of the mission and activity detail pages (F2 family, R-604, R-605, R-607, R-611, R-620, R-621):
 * header with the breadcrumb link and share actions, read-only rating, info rows, the lazy previous/next pager and
 * the comments placeholder.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ratingText } from "@/lib";
import { LazyReveal, PageHeading, ShareActions } from "@/components/ui";
import { FavoriteButton } from "@/components/favorites";

export function DetailHeader({
  title,
  crumbLabel,
  crumbHref,
}: {
  title: string;
  crumbLabel: string;
  crumbHref: string;
}) {
  return (
    <header className="flex flex-col gap-3">
      <PageHeading>{title}</PageHeading>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={crumbHref}
          data-testid="breadcrumb"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal underline-offset-2 hover:underline"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {crumbLabel}
        </Link>
        <ShareActions title={title} />
      </div>
    </header>
  );
}

function Star({ fill, index }: { fill: number; index: number }) {
  const id = `la-star-${index}`;
  return (
    <svg data-testid="rating-stars" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="#ff6a4d" />
          <stop offset={`${fill * 100}%`} stopColor="#ff6a4d" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8z"
        fill={`url(#${id})`}
        stroke="#ff6a4d"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** R-611 (DIVERGENCE D-005): five read-only stars filled to the average and the rating line (R-410). */
export function RatingBlock({ average, votes }: { average: number; votes: number }) {
  const line = ratingText(average, votes);
  return (
    <div data-testid="rating-block" className="inline-flex items-center gap-2" role="img" aria-label={`Rating: ${line}`}>
      <span className="inline-flex" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} index={i} fill={Math.max(0, Math.min(1, average - i))} />
        ))}
      </span>
      <span data-testid="rating-total" className="text-sm text-muted" aria-hidden="true">
        {line}
      </span>
    </div>
  );
}

/** R-605 action row: rating block and "Add To Favorites" (R-1401). */
export function ActionRow({ list, slug, average, votes }: { list: string; slug: string; average: number; votes: number }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-sand-dark bg-white px-4 py-3">
      <RatingBlock average={average} votes={votes} />
      <FavoriteButton list={list} slug={slug} />
    </div>
  );
}

export function SectionTitle({ id, children, caps = true }: { id?: string; children: ReactNode; caps?: boolean }) {
  return (
    <h2
      id={id}
      data-testid="section-titles"
      className={`mt-10! scroll-mt-24 font-display text-xl font-bold text-ink ${caps ? "uppercase tracking-wide" : ""}`}
    >
      {children}
    </h2>
  );
}

/** R-607 info rows (label/value pairs; a row without value is omitted). */
export function InfoRows({ rows }: { rows: [label: string, value: ReactNode | undefined | null][] }) {
  const shown = rows.filter(([, v]) => v !== undefined && v !== null && v !== "");
  return (
    <dl className="mt-4 overflow-hidden rounded-2xl border border-sand-dark bg-white">
      {shown.map(([label, value], i) => (
        <div key={label} className={`grid grid-cols-[minmax(140px,40%)_1fr] gap-3 px-4 py-2.5 ${i % 2 ? "bg-sand/60" : ""}`}>
          <dt data-testid="info-labels" className="text-sm font-semibold text-ink">
            {label}
          </dt>
          <dd className="text-sm text-muted">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** R-620: previous/next in catalogue order, inserted when the comments placeholder nears the viewport. */
export function NeighbourPager({ prev, next }: { prev?: { name: string; path: string }; next?: { name: string; path: string } }) {
  if (!prev && !next) return null;
  return (
    <LazyReveal margin={200} minHeight={72} className="mt-10">
      <nav data-testid="pager" aria-label="Previous and next" className="flex flex-wrap justify-between gap-3">
        {prev ? (
          <Link
            href={prev.path}
            rel="prev"
            data-testid="pager-prev"
            className="inline-flex max-w-[48%] items-center gap-2 rounded-full border border-sand-dark bg-white px-4 py-2 text-sm font-semibold text-teal hover:bg-sand"
          >
            <span aria-hidden="true">‹</span>
            {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={next.path}
            rel="next"
            data-testid="pager-next"
            className="ml-auto inline-flex max-w-[48%] items-center gap-2 rounded-full border border-sand-dark bg-white px-4 py-2 text-sm font-semibold text-teal hover:bg-sand"
          >
            {next.name}
            <span aria-hidden="true">›</span>
          </Link>
        ) : null}
      </nav>
    </LazyReveal>
  );
}

/** R-621 (DIVERGENCE D-004). */
export function CommentsPlaceholder() {
  return (
    <section data-testid="comments" aria-labelledby="la-comments-title" className="mt-10 rounded-2xl border border-dashed border-sand-dark bg-white/60 p-5">
      <h3 id="la-comments-title" className="font-display text-base font-bold text-ink">
        Comments
      </h3>
      <p className="mt-1 text-sm text-muted">Comments are coming later.</p>
    </section>
  );
}
