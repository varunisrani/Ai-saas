/**
 * list-paging — F1 infinite loading (R-523, R-524) and the shared "deferred block" distance (R-1506).
 */

/** R-523: cards per batch. */
export const LIST_BATCH_SIZE = 100;
/** R-523: the sentinel loads the next batch when it comes within this distance of the viewport. */
export const LIST_APPROACH_DISTANCE_PX = 400;
/** R-1506: deferred blocks (pagers, lazy footer) are inserted within this distance of the viewport. */
export const DEFERRED_BLOCK_DISTANCE_PX = 200;

/** Number of cards rendered for `batchesShown` batches (at least one batch; never more than total). */
export function renderedCount(total: number, batchesShown: number): number {
  const batches = Math.max(1, Math.floor(batchesShown));
  return Math.max(0, Math.min(total, batches * LIST_BATCH_SIZE));
}

/** True while some matching cards are not rendered yet. */
export function hasMoreBatches(total: number, batchesShown: number): boolean {
  return renderedCount(total, batchesShown) < total;
}

/** One more batch per approach of the sentinel, until all are shown. */
export function nextBatchesShown(batchesShown: number, total: number): number {
  const current = Math.max(1, Math.floor(batchesShown));
  return hasMoreBatches(total, current) ? current + 1 : current;
}

/**
 * True when an element whose top edge is at `elementTop` (viewport coordinates, px) is within `distance` px of a
 * viewport of height `viewportHeight` (used for the list sentinel and every deferred block).
 */
export function isWithinViewportDistance(elementTop: number, viewportHeight: number, distance: number): boolean {
  return elementTop - viewportHeight <= distance;
}

/** R-524 (DIVERGENCE D-011): a `page` key from a link never changes where rendering starts. */
export function firstRenderedIndex(): number {
  return 0;
}
