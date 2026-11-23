/**
 * news — article list order, paging and pager, article neighbours (R-1102, R-1106, R-1107, R-1114, R-1204).
 */

/** R-1106 items per list page. */
export const NEWS_PAGE_SIZE = 30;
/** R-1107 maximum numbered links. */
export const PAGER_WINDOW = 10;

export interface OrderableArticle {
  slug?: string;
  path?: string;
  publishedAt?: string;
  /** Own sort date of guide section links (R-1102). */
  sortDate?: string;
}

function dateMs(a: OrderableArticle): number {
  const ms = Date.parse(a.publishedAt ?? a.sortDate ?? "");
  return Number.isFinite(ms) ? ms : -Infinity;
}

function tieKey(a: OrderableArticle): string {
  return a.slug ?? a.path ?? "";
}

/**
 * R-1102: newest first (publishedAt, or sortDate for section links); ties by slug descending
 * (HYPOTHESIS U-F7-01; section links tie on their path).
 */
export function orderArticles<T extends OrderableArticle>(articles: readonly T[]): T[] {
  return articles.slice().sort((a, b) => {
    const d = dateMs(b) - dateMs(a);
    if (d !== 0 && !Number.isNaN(d)) return d;
    const ka = tieKey(a);
    const kb = tieKey(b);
    return ka < kb ? 1 : ka > kb ? -1 : 0;
  });
}

/** R-1106: pages = ⌈total / 30⌉, at least 1. */
export function pageCount(total: number, pageSize = NEWS_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
}

/** R-1106: items of page N (1-based). */
export function pageSlice<T>(items: readonly T[], page: number, pageSize = NEWS_PAGE_SIZE): T[] {
  const p = Math.max(1, Math.floor(page));
  return items.slice((p - 1) * pageSize, p * pageSize);
}

/**
 * R-1106 `?start=<offset>`: page ⌊offset/30⌋+1; an offset past the end shows the last page's counter with no items.
 * HYPOTHESIS: a negative or non-numeric offset means page 1.
 */
export function pageFromStart(offset: number | string, total: number, pageSize = NEWS_PAGE_SIZE): { page: number; pastEnd: boolean; start: number } {
  const n = typeof offset === "string" ? Number.parseInt(offset, 10) : Math.floor(offset);
  const start = Number.isFinite(n) && n > 0 ? n : 0;
  const last = pageCount(total, pageSize);
  const page = Math.floor(start / pageSize) + 1;
  if (page > last) return { page: last, pastEnd: true, start };
  return { page, pastEnd: false, start };
}

/** Items shown for a `?start=` offset (empty past the end; the slice starts at the page boundary). */
export function itemsForStart<T>(items: readonly T[], offset: number | string, pageSize = NEWS_PAGE_SIZE): { page: number; items: T[] } {
  const r = pageFromStart(offset, items.length, pageSize);
  return { page: r.page, items: r.pastEnd ? [] : pageSlice(items, r.page, pageSize) };
}

/**
 * R-1106 `page-N` segment: N ≥ 2 and ≤ the last page is served; "page-1", N past the end or anything else is 404.
 * Returns the page number or null (= 404).
 */
export function resolvePageSegment(segment: string, total: number, pageSize = NEWS_PAGE_SIZE): number | null {
  const m = /^page-(\d+)$/.exec(segment);
  if (!m) return null;
  const n = Number(m[1]);
  if (String(n) !== m[1] || n < 2 || n > pageCount(total, pageSize)) return null;
  return n;
}

/** R-1106/R-1107: page 1 = the list URL, page N = "<list URL>page-N". */
export function listPageHref(listUrl: string, page: number): string {
  if (page <= 1) return listUrl;
  return `${listUrl.endsWith("/") ? listUrl : `${listUrl}/`}page-${page}`;
}

/** R-1107 counter "Page N of M". */
export function pageCounterText(page: number, last: number): string {
  return `Page ${page} of ${last}`;
}

export type PagerEntryKind = "first" | "prev" | "page" | "next" | "last";

export interface PagerEntry {
  kind: PagerEntryKind;
  /** Target page (for disabled entries the page it would go to). */
  page: number;
  /** Accessible name: "Go to first page", "Page N" (current), "Go to page N", … */
  label: string;
  disabled: boolean;
  current: boolean;
  /** href when a link (current page: "#"); null for disabled entries or when no URL builder was given. */
  href: string | null;
}

/**
 * R-1107/R-1204 pager: first, previous (disabled on page 1), numbered links (all when M ≤ window, otherwise a
 * window of 10 starting at max(1, min(N−4, M−9)) — HYPOTHESIS beyond 10 pages), next, last (disabled on the last
 * page). The current page is a link labelled "Page N" with href "#".
 */
export function pagerModel(
  current: number,
  last: number,
  hrefFor?: (page: number) => string,
  windowSize: number = PAGER_WINDOW,
): PagerEntry[] {
  const M = Math.max(1, last);
  const N = Math.min(Math.max(1, current), M);
  const href = (p: number) => (hrefFor ? hrefFor(p) : null);
  const entries: PagerEntry[] = [];
  const edge = (kind: PagerEntryKind, page: number, label: string, disabled: boolean) =>
    entries.push({ kind, page, label, disabled, current: false, href: disabled ? null : href(page) });
  edge("first", 1, "Go to first page", N === 1);
  edge("prev", Math.max(1, N - 1), "Go to previous page", N === 1);
  let start = 1;
  let end = M;
  if (M > windowSize) {
    start = Math.max(1, Math.min(N - 4, M - windowSize + 1));
    end = start + windowSize - 1;
  }
  for (let p = start; p <= end; p++) {
    const isCurrent = p === N;
    entries.push({
      kind: "page",
      page: p,
      label: isCurrent ? `Page ${p}` : `Go to page ${p}`,
      disabled: false,
      current: isCurrent,
      href: isCurrent ? "#" : href(p),
    });
  }
  edge("next", Math.min(M, N + 1), "Go to next page", N === M);
  edge("last", M, "Go to last page", N === M);
  return entries;
}

/**
 * R-1114: neighbours in the News order — "previous" = the next newer article, "next" = the next older article;
 * none at the ends.
 */
export function articleNeighbours<T extends { slug?: string }>(ordered: readonly T[], slug: string): { prev: T | null; next: T | null } {
  const i = ordered.findIndex((a) => a.slug === slug);
  if (i < 0) return { prev: null, next: null };
  return { prev: i > 0 ? ordered[i - 1] : null, next: i < ordered.length - 1 ? ordered[i + 1] : null };
}
