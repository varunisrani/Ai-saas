/**
 * Article list layout shared by News, Guides, Videos and All news (R-1101..R-1110).
 */
import Link from "next/link";
import type { ArtRef, GuideEntry } from "@/data";
import { dateLine, pageCounterText } from "@/lib";
import { ArtImage, Breadcrumbs, GTA6_CRUMB, PageHeading, ShareActions, type Crumb } from "@/components/ui";
import { GameFilter } from "./GameFilter";
import { ListPager } from "./ListPager";

export type ArticleListKind = "news" | "guides" | "videos" | "all";

export interface ArticleListProps {
  kind: ArticleListKind;
  /** Current page (1-based) and page count. */
  page: number;
  last: number;
  items: GuideEntry[];
  heading: string;
  /** "- Page N" suffix element (pages ≥ 2). */
  suffix: string | null;
  /** Page-1 description block (banner, intro, filter button). */
  showDescription: boolean;
  intro: string;
  banner?: ArtRef;
  /** Pager list URL (page 1). */
  listUrl: string;
  crumbs: Crumb[];
}

const CATEGORY = { label: "Grand Theft Auto VI", href: "/gta-6/news/" };

function Item({ entry, kind }: { entry: GuideEntry; kind: ArticleListKind }) {
  const a = entry.article;
  const showAuthor = a && a.showAuthor && (kind === "news" || kind === "all");
  const showDate = a && (kind === "news" || kind === "videos" || kind === "all");
  const showCategory = kind === "news" || kind === "guides";
  return (
    <li className="atlas-item" data-testid="list-item">
      <Link href={entry.path} className="atlas-item-thumb-link" data-testid="item-thumb-link" tabIndex={-1} aria-hidden="true">
        <ArtImage art={entry.image} alt={entry.title} width={320} height={180} className="atlas-item-thumb" data-testid="item-thumb" />
      </Link>
      <div className="atlas-item-body">
        <h2 className="atlas-item-title">
          <Link href={entry.path} data-testid="item-title-link">
            {entry.title}
          </Link>
        </h2>
        {a ? <p className="atlas-item-summary">{a.summary}</p> : null}
        <dl className="atlas-meta">
          <dt className="atlas-sr-zero" data-testid="item-details-label">
            Details
          </dt>
          {showAuthor ? <dd data-testid="item-author">by {a.author}</dd> : null}
          {showDate ? (
            <dd>
              <time dateTime={a.publishedAt} data-testid="item-date">
                {dateLine("published", a.publishedAt)}
              </time>
            </dd>
          ) : null}
          {showCategory ? (
            <dd>
              <Link href={CATEGORY.href} className="atlas-cat-link" data-testid="item-category">
                {CATEGORY.label}
              </Link>
            </dd>
          ) : null}
          {kind === "all" ? (
            <dd data-testid="item-tags">
              <Link href="/gta-6/news/" className="atlas-tag">
                GTA 6
              </Link>
              {a?.guide ? (
                <Link href="/news/" className="atlas-tag">
                  Guide
                </Link>
              ) : null}
            </dd>
          ) : null}
        </dl>
      </div>
    </li>
  );
}

export function ArticleList(props: ArticleListProps) {
  const { kind, page, last, items, heading, suffix, showDescription, intro, banner, listUrl, crumbs } = props;
  const paged = kind !== "videos";
  const hasParent = kind === "guides" || kind === "videos";
  const hasFilter = kind === "news" || kind === "all";

  return (
    <div className={`atlas-list atlas-list-${kind}`}>
      <Breadcrumbs items={crumbs} />
      {showDescription ? (
        <div className="atlas-list-head">
          {hasParent ? (
            <Link href="/news/" className="atlas-parent-link" data-testid="parent-category">
              Rockstar Games News &amp; Guides
            </Link>
          ) : null}
          <div className="atlas-list-intro" data-testid="list-intro">
            <PageHeading suffix={suffix}>{heading}</PageHeading>
            {hasFilter ? (
              <div className="atlas-list-toolbar">
                <GameFilter />
              </div>
            ) : null}
            {hasParent ? <ShareActions /> : null}
            {banner ? (
              <ArtImage art={banner} alt="" width={1200} height={320} className="atlas-banner" loading="eager" data-testid="list-banner" />
            ) : null}
            <p>{intro}</p>
          </div>
        </div>
      ) : (
        <div className="atlas-list-head">
          {hasParent ? (
            <Link href="/news/" className="atlas-parent-link" data-testid="parent-category">
              Rockstar Games News &amp; Guides
            </Link>
          ) : null}
          <PageHeading suffix={suffix}>{heading}</PageHeading>
        </div>
      )}

      <ol className="atlas-items">
        {items.map((e) => (
          <Item key={`${e.kind}-${e.slug}`} entry={e} kind={kind} />
        ))}
      </ol>

      {paged ? (
        <div className="atlas-list-foot">
          <p className="atlas-page-counter" data-testid="page-counter">
            {pageCounterText(page, last)}
          </p>
          <ListPager page={page} last={last} listUrl={listUrl} />
        </div>
      ) : null}
    </div>
  );
}

export const NEWS_CRUMBS = (label: string): Crumb[] => [GTA6_CRUMB, { label }];
