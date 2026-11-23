import { describe, expect, it } from "vitest";
import {
  counterText,
  galleryPageHref,
  galleryPagerModel,
  galleryPaging,
  lightboxHasArrows,
  nextIndex,
  preloadSet,
  prevIndex,
  swipeStep,
  wheelStep,
} from "./gallery";

describe("R-1206 / R-1209 counter and wrap", () => {
  it("F8-02..F8-07 on a page of 100", () => {
    let i = 0;
    expect(counterText(i, 100)).toBe("1/100");
    i = nextIndex(i, 100);
    expect(counterText(i, 100)).toBe("2/100"); // F8-03
    i = prevIndex(prevIndex(i, 100), 100);
    expect(counterText(i, 100)).toBe("100/100"); // F8-04
    i = nextIndex(i, 100);
    expect(counterText(i, 100)).toBe("1/100"); // F8-05
  });
  it("F8-20 / F8-21 artworks block 2; F8-15 last page", () => {
    expect(counterText(prevIndex(0, 14), 14)).toBe("14/14");
    expect(counterText(prevIndex(0, 60), 60)).toBe("60/60");
  });
  it("F8-24 / F8-25 one image stays 1/1 and has no arrows", () => {
    expect(counterText(nextIndex(0, 1), 1)).toBe("1/1");
    expect(prevIndex(0, 1)).toBe(0);
    expect(lightboxHasArrows(1)).toBe(false);
    expect(lightboxHasArrows(2)).toBe(true);
  });
});

describe("R-1210 loading", () => {
  it("F8-02: 5 loaded after opening", () => {
    expect([...preloadSet(0, 100)].sort((a, b) => a - b)).toEqual([0, 1, 2, 98, 99]);
  });
  it("F8-34..F8-36: open at 100 → 5, six moves further → 11", () => {
    let i = 99;
    let loaded = preloadSet(i, 100);
    expect(loaded.size).toBe(5);
    for (let k = 0; k < 6; k++) {
      i = nextIndex(i, 100);
      loaded = preloadSet(i, 100, loaded);
    }
    expect(counterText(i, 100)).toBe("6/100");
    expect(loaded.size).toBe(11);
  });
  it("small blocks load every image", () => {
    expect(preloadSet(0, 3).size).toBe(3);
    expect(preloadSet(0, 0).size).toBe(0);
  });
});

describe("R-1209 wheel and swipe", () => {
  it("wheel up = next, down = previous, one step per 800 ms, none on macOS", () => {
    expect(wheelStep(-120, null, 1000, false)).toBe(1);
    expect(wheelStep(120, null, 1000, false)).toBe(-1);
    expect(wheelStep(-120, 500, 1000, false)).toBe(0);
    expect(wheelStep(-120, 200, 1000, false)).toBe(1);
    expect(wheelStep(-120, null, 1000, true)).toBe(0);
  });
  it("swipe more than 10 px", () => {
    expect(swipeStep(-11)).toBe(1);
    expect(swipeStep(30)).toBe(-1);
    expect(swipeStep(10)).toBe(0);
  });
});

describe("R-1204 gallery paging", () => {
  const PATH = "/gta-6/screenshots/";
  it("F8-01 hrefs and pagination items (fixture 260 images → 3 pages)", () => {
    expect(galleryPaging(260)).toEqual({ page: 1, pages: 3, start: 0, end: 100 });
    expect(galleryPageHref(PATH, 1)).toBe("/gta-6/screenshots/");
    expect(galleryPageHref(PATH, 2)).toBe("/gta-6/screenshots/?thumb_limitstart=100&limit=100");
    expect(galleryPageHref(PATH, 3)).toBe("/gta-6/screenshots/?thumb_limitstart=200&limit=100");
    const m = galleryPagerModel(1, 3, PATH);
    expect(m).toHaveLength(7);
    expect(m.filter((e) => e.disabled)).toHaveLength(2);
    expect(m.find((e) => e.current)!.label).toBe("Page 1");
    expect(m.find((e) => e.kind === "last")!.href).toBe("/gta-6/screenshots/?thumb_limitstart=200&limit=100");
  });
  it("F8-14 page 2 has no disabled item; F8-15 page 3 has two", () => {
    expect(galleryPaging(260, "100")).toEqual({ page: 2, pages: 3, start: 100, end: 200 });
    expect(galleryPagerModel(2, 3, PATH).filter((e) => e.disabled)).toHaveLength(0);
    expect(galleryPaging(260, 200)).toEqual({ page: 3, pages: 3, start: 200, end: 260 });
    expect(galleryPagerModel(3, 3, PATH).filter((e) => e.disabled)).toHaveLength(2);
  });
  it("invalid or too large offsets (HYPOTHESIS)", () => {
    expect(galleryPaging(260, "x").page).toBe(1);
    expect(galleryPaging(260, 5000).page).toBe(3);
    expect(galleryPaging(0)).toEqual({ page: 1, pages: 1, start: 0, end: 0 });
  });
});
