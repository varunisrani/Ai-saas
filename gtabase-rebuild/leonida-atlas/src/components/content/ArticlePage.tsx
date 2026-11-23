/**
 * Article page (R-1111..R-1118): h1 = title, meta list (hidden "Details" term, "by <author>", exactly one date,
 * category link), share actions, hero, body with table of contents and section anchors, video placeholder and
 * author box for video items, then the lazy previous/next pager, the related box and the comments placeholder.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { articles, type Article } from "@/data";
import { articleNeighbours, dateLine, orderArticles } from "@/lib";
import { ArtImage, Breadcrumbs, GTA6_CRUMB, PageHeading, ShareActions } from "@/components/ui";
import { ArticlePager } from "./ArticlePager";

export function articleMetadata(a: Article): Metadata {
  return {
    title: a.title,
    description: a.summary,
    alternates: { canonical: a.canonicalPath },
  };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ArticlePage({ article: a }: { article: Article }) {
  const ordered = orderArticles(articles);
  const { prev, next } = articleNeighbours(ordered, a.slug);
  const indexed = a.sections.filter((s) => !s.noIndex);
  const lastIndex = a.sections.length - 1;

  return (
    <article className="atlas-article">
      <Breadcrumbs items={[GTA6_CRUMB, { label: "News", href: "/gta-6/news/" }, { label: a.title }]} />
      <PageHeading>{a.title}</PageHeading>
      <dl className="atlas-meta" data-testid="article-meta">
        <dt className="atlas-sr-zero" data-testid="article-info-term item-details-label">
          Details
        </dt>
        {a.showAuthor ? <dd data-testid="article-author">by {a.author}</dd> : null}
        {a.showModified && a.modifiedAt ? (
          <dd>
            <time dateTime={a.modifiedAt} data-testid="article-modified">
              {dateLine("modified", a.modifiedAt)}
            </time>
          </dd>
        ) : (
          <dd>
            <time dateTime={a.publishedAt} data-testid="article-published">
              {dateLine("published", a.publishedAt)}
            </time>
          </dd>
        )}
        <dd>
          <Link href="/gta-6/news/" className="atlas-cat-link" data-testid="article-category">
            Grand Theft Auto VI
          </Link>
        </dd>
      </dl>
      <ShareActions title={a.title} />
      <ArtImage art={a.hero} alt={a.heroAlt} className="atlas-article-hero" loading="eager" data-testid="article-hero" />

      <div className="atlas-article-body atlas-prose">
        {a.video && a.videoPlaceholder ? (
          <figure className="atlas-video" role="figure" aria-label="Video player" data-testid="video-embed">
            <ArtImage art={a.videoPlaceholder} alt="" />
            <figcaption>Video playback is coming later — here is a still for now.</figcaption>
          </figure>
        ) : null}

        {a.toc && indexed.length ? (
          <nav className="atlas-toc" aria-labelledby={`toc-${a.slug}`} data-testid="toc">
            <p id={`toc-${a.slug}`} className="atlas-toc-title" data-testid="toc-heading">
              <strong>{a.shortTitle}</strong>
            </p>
            <ol>
              {indexed.map((s, i) => {
                const t = ["toc-links", "toc-link"];
                if (i === 0) t.push("toc-first-link");
                t.push(`toc-link-${i + 1}`);
                return (
                  <li key={s.anchor}>
                    <a href={`${a.canonicalPath}#${s.anchor}`} data-testid={t.join(" ")}>
                      {s.heading}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : null}

        {a.sections.map((s, i) => (
          <section key={`${s.anchor}-${i}`} data-testid={i === lastIndex && !a.video ? "article-end" : undefined}>
            <h2 data-testid={s.noIndex || !a.toc ? "section-headings" : "section-headings indexed-heading"}>
              {!s.noIndex && a.toc ? <span id={s.anchor} className="atlas-anchor" data-testid="section-anchors" /> : null}
              {s.heading}
            </h2>
            {s.body.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
          </section>
        ))}

        {a.video ? (
          <aside className="atlas-author-box" data-testid="author-block article-end">
            <span className="atlas-author-avatar" aria-hidden="true">
              {initials(a.author)}
            </span>
            <div>
              <strong>Author: {a.author}</strong>
              {a.authorBio ? <p>{a.authorBio}</p> : null}
            </div>
          </aside>
        ) : null}
      </div>

      <ArticlePager
        prev={prev ? { title: prev.title, href: prev.canonicalPath } : null}
        next={next ? { title: next.title, href: next.canonicalPath } : null}
      />

      {a.related ? (
        <section className="atlas-related" data-testid="related-block">
          <h2 className="atlas-related-title caps" data-testid="related-heading">
            {a.related.heading}
          </h2>
          <ul className="atlas-related-grid">
            {a.related.cards.map((c) => (
              <li key={c.path}>
                <Link href={c.path} className="atlas-related-card atlas-card" data-testid="related-cards">
                  <ArtImage art={c.image} alt="" width={320} height={180} />
                  <span>{c.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="atlas-comments" data-testid="comments" aria-labelledby={`comments-${a.slug}`}>
        <h3 id={`comments-${a.slug}`}>Comments</h3>
        <p>Comments are coming later.</p>
      </section>
    </article>
  );
}
