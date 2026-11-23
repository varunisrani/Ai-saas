"use client";

/**
 * Article list pager (R-1107): the navigation "Pagination" is inserted only when the counter comes within
 * 200 px of the viewport (before that the page contains no pager link).
 */
import { LazyReveal, Pagination } from "@/components/ui";
import { listPageHref, pagerModel } from "@/lib";

export function ListPager({ page, last, listUrl }: { page: number; last: number; listUrl: string }) {
  const entries = pagerModel(page, last, (p) => listPageHref(listUrl, p));
  return (
    <LazyReveal minHeight={40} margin={200}>
      <Pagination entries={entries} variant="news" />
    </LazyReveal>
  );
}
