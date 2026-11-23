/**
 * gallery — lightbox counter, wrap, preloading, wheel/swipe steps and gallery paging (R-1204, R-1206, R-1209,
 * R-1210). Indices are 0-based; the counter shows index + 1.
 */
import { pagerModel, type PagerEntry } from "./news";

/** R-1204 thumbnails per gallery page. */
export const GALLERY_PAGE_SIZE = 100;
/** R-1210 neighbours loaded on each side of the current image. */
export const LIGHTBOX_PRELOAD_RADIUS = 2;
/** R-1209 at most one wheel step per this many ms. */
export const LIGHTBOX_WHEEL_INTERVAL_MS = 800;
/** R-1209 minimum horizontal swipe/drag distance. */
export const LIGHTBOX_SWIPE_MIN_PX = 10;

/** R-1206 counter "k/N" (no spaces) for a 0-based index. */
export function counterText(index: number, total: number): string {
  return `${index + 1}/${total}`;
}

/** R-1209 next with wrap (next of the last is the first; one image stays). */
export function nextIndex(index: number, total: number): number {
  if (total <= 1) return 0;
  return (index + 1) % total;
}

/** R-1209 previous with wrap (previous of the first is the last). */
export function prevIndex(index: number, total: number): number {
  if (total <= 1) return 0;
  return (index - 1 + total) % total;
}

/** R-1210: loaded slots = already loaded ∪ the current image and two neighbours on each side (wrapping). */
export function preloadSet(index: number, total: number, alreadyLoaded: Iterable<number> = []): Set<number> {
  const out = new Set<number>(alreadyLoaded);
  if (total <= 0) return out;
  for (let d = -LIGHTBOX_PRELOAD_RADIUS; d <= LIGHTBOX_PRELOAD_RADIUS; d++) {
    out.add((((index + d) % total) + total) % total);
  }
  return out;
}

/** R-1206: arrows exist only with more than one image. */
export function lightboxHasArrows(total: number): boolean {
  return total > 1;
}

/**
 * R-1209 mouse wheel (not on macOS): up = next, down = previous, at most one step per 800 ms.
 * Returns +1, −1 or 0 (no step).
 */
export function wheelStep(deltaY: number, lastStepAtMs: number | null, nowMs: number, isMac: boolean): 1 | -1 | 0 {
  if (isMac || deltaY === 0) return 0;
  if (lastStepAtMs !== null && nowMs - lastStepAtMs < LIGHTBOX_WHEEL_INTERVAL_MS) return 0;
  return deltaY < 0 ? 1 : -1;
}

/** R-1209 horizontal swipe/drag of more than 10 px: leftwards = next, rightwards = previous (HYPOTHESIS for the side). */
export function swipeStep(deltaX: number): 1 | -1 | 0 {
  if (Math.abs(deltaX) <= LIGHTBOX_SWIPE_MIN_PX) return 0;
  return deltaX < 0 ? 1 : -1;
}

export interface GalleryPaging {
  /** Current page (1-based). */
  page: number;
  pages: number;
  /** Slice bounds of the page in the block's image list. */
  start: number;
  end: number;
}

/**
 * R-1204: 100 per page, pages = ⌈T/100⌉ (at least 1); `thumb_limitstart` selects page ⌊start/100⌋+1
 * (HYPOTHESIS: a missing/invalid start is page 1; a start past the end shows the last page).
 */
export function galleryPaging(total: number, thumbLimitstart?: number | string | null): GalleryPaging {
  const pages = Math.max(1, Math.ceil(Math.max(0, total) / GALLERY_PAGE_SIZE));
  const n = typeof thumbLimitstart === "string" ? Number.parseInt(thumbLimitstart, 10) : thumbLimitstart ?? 0;
  const startOffset = Number.isFinite(n) && (n as number) > 0 ? Math.floor(n as number) : 0;
  const page = Math.min(pages, Math.floor(startOffset / GALLERY_PAGE_SIZE) + 1);
  const start = (page - 1) * GALLERY_PAGE_SIZE;
  return { page, pages, start, end: Math.min(total, start + GALLERY_PAGE_SIZE) };
}

/** R-1204: page 1 = the gallery path; page p = "<path>?thumb_limitstart=<(p−1)×100>&limit=100". */
export function galleryPageHref(path: string, page: number): string {
  if (page <= 1) return path;
  return `${path}?thumb_limitstart=${(page - 1) * GALLERY_PAGE_SIZE}&limit=${GALLERY_PAGE_SIZE}`;
}

/** R-1204: the gallery pagination (one item per page, no window). */
export function galleryPagerModel(current: number, pages: number, path: string): PagerEntry[] {
  return pagerModel(current, pages, (p) => galleryPageHref(path, p), Number.POSITIVE_INFINITY);
}
