import { describe, expect, it } from "vitest";
import {
  DEFERRED_BLOCK_DISTANCE_PX,
  LIST_APPROACH_DISTANCE_PX,
  LIST_BATCH_SIZE,
  firstRenderedIndex,
  hasMoreBatches,
  isWithinViewportDistance,
  nextBatchesShown,
  renderedCount,
} from "./list-paging";

describe("R-523 infinite loading", () => {
  it("first 100, then one batch per approach until all (fixture 280 → 100, 200, 280)", () => {
    expect(LIST_BATCH_SIZE).toBe(100);
    let batches = 1;
    const seen: number[] = [renderedCount(280, batches)];
    for (let i = 0; i < 6; i++) {
      batches = nextBatchesShown(batches, 280);
      seen.push(renderedCount(280, batches));
    }
    expect(seen).toEqual([100, 200, 280, 280, 280, 280, 280]); // F1-03: six approaches, stays complete
    expect(hasMoreBatches(280, 3)).toBe(false);
  });
  it("small results and empty results (F1-07, F3-12 count:card=6)", () => {
    expect(renderedCount(6, 1)).toBe(6);
    expect(renderedCount(0, 1)).toBe(0);
    expect(nextBatchesShown(1, 6)).toBe(1);
  });
  it("approach distance 400 px; deferred blocks 200 px (R-1506)", () => {
    expect(LIST_APPROACH_DISTANCE_PX).toBe(400);
    expect(DEFERRED_BLOCK_DISTANCE_PX).toBe(200);
    expect(isWithinViewportDistance(1300, 900, 400)).toBe(true);
    expect(isWithinViewportDistance(1301, 900, 400)).toBe(false);
  });
  it("R-524 rendering always starts at the first item (D-011)", () => {
    expect(firstRenderedIndex()).toBe(0);
  });
});
