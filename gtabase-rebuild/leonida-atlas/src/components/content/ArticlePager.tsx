"use client";

/**
 * Previous/next pager of an article (R-1114) or detail page (R-620): inserted only when its placeholder (right
 * after the article end) comes within 200 px of the viewport. prev = rel "prev" (left chevron), next = rel "next".
 */
import Link from "next/link";
import { LazyReveal } from "@/components/ui";

export interface PagerLink {
  title: string;
  href: string;
}

export function ArticlePager({ prev, next, label = "More articles" }: { prev: PagerLink | null; next: PagerLink | null; label?: string }) {
  if (!prev && !next) return null;
  return (
    <LazyReveal minHeight={72}>
      <nav className="atlas-article-pager" aria-label={label} data-testid="pager">
        {prev ? (
          <Link href={prev.href} rel="prev" data-testid="pager-prev">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{prev.title}</span>
          </Link>
        ) : null}
        {next ? (
          <Link href={next.href} rel="next" data-testid="pager-next">
            <span>{next.title}</span>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : null}
      </nav>
    </LazyReveal>
  );
}
