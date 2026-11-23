import { describe, expect, it } from "vitest";
import {
  articleNeighbours,
  itemsForStart,
  listPageHref,
  orderArticles,
  pageCount,
  pageCounterText,
  pageFromStart,
  pageSlice,
  pagerModel,
  resolvePageSegment,
} from "./news";

const NEWS = "/gta-6/news/";
const linkTexts = (entries: ReturnType<typeof pagerModel>) =>
  entries.filter((e) => !e.disabled).map((e) => (e.kind === "page" ? String(e.page) : ""));

describe("R-1102 order", () => {
  it("newest first, ties by slug descending, section links by their sort date", () => {
    const items = [
      { slug: "a", publishedAt: "2026-11-21T10:00:00Z" },
      { slug: "c", publishedAt: "2026-11-22T21:46:04Z" },
      { slug: "b", publishedAt: "2026-11-21T10:00:00Z" },
      { path: "/gta-6/map-locations/", sortDate: "2026-11-22T00:00:00Z" },
      { slug: "old", publishedAt: "2019-03-24T00:00:00Z" },
    ];
    expect(orderArticles(items).map((i) => i.slug ?? i.path)).toEqual(["c", "/gta-6/map-locations/", "b", "a", "old"]);
  });
});

describe("R-1106 paging", () => {
  it("30 per page; R-1613 84 articles → pages 30 / 30 / 24", () => {
    const items = Array.from({ length: 84 }, (_, i) => i);
    expect(pageCount(84)).toBe(3);
    expect(pageSlice(items, 1)).toHaveLength(30);
    expect(pageSlice(items, 3)).toHaveLength(24);
    expect(pageCount(0)).toBe(1);
    expect(pageCount(61)).toBe(3); // R-1615 guides 30 / 30 / 1
  });
  it("F7-11 ?start=30 → page 2; F7-12 ?start=999 → last page counter, no items", () => {
    const items = Array.from({ length: 84 }, (_, i) => i);
    expect(pageFromStart(30, 84)).toEqual({ page: 2, pastEnd: false, start: 30 });
    expect(pageFromStart("999", 84)).toEqual({ page: 3, pastEnd: true, start: 999 });
    expect(itemsForStart(items, 999)).toEqual({ page: 3, items: [] });
    expect(itemsForStart(items, "45").items[0]).toBe(30);
    expect(pageFromStart("abc", 84).page).toBe(1);
  });
  it("F7-08..F7-10 / F7-15 / F7-16 page-N segments", () => {
    expect(resolvePageSegment("page-1", 84)).toBeNull();
    expect(resolvePageSegment("page-2", 84)).toBe(2);
    expect(resolvePageSegment("page-3", 61)).toBe(3);
    expect(resolvePageSegment("page-4", 61)).toBeNull();
    expect(resolvePageSegment("page-99", 84)).toBeNull();
    expect(resolvePageSegment("page-02", 84)).toBeNull();
    expect(resolvePageSegment("page-2", 7)).toBeNull(); // F7-18 videos: single page
  });
  it("hrefs and counter", () => {
    expect(listPageHref(NEWS, 1)).toBe("/gta-6/news/");
    expect(listPageHref(NEWS, 2)).toBe("/gta-6/news/page-2");
    expect(listPageHref("/gta-6/articles", 3)).toBe("/gta-6/articles/page-3");
    expect(pageCounterText(2, 6).replace(/of \d+/, "of M")).toBe("Page 2 of M");
  });
});

describe("R-1107 pager", () => {
  const href = (p: number) => listPageHref(NEWS, p);
  it("F7-02 page 1 of 6: numbers + next + last are links; first/prev disabled", () => {
    const m = pagerModel(1, 6, href);
    expect(linkTexts(m).join(" || ")).toBe("1 || 2 || 3 || 4 || 5 || 6 ||  || ");
    expect(m.filter((e) => e.disabled)).toHaveLength(2);
    const current = m.find((e) => e.current)!;
    expect(current).toMatchObject({ label: "Page 1", href: "#" });
    expect(m.find((e) => e.kind === "page" && e.page === 2)).toMatchObject({ label: "Go to page 2", href: "/gta-6/news/page-2" });
    expect(m.find((e) => e.kind === "next")).toMatchObject({ label: "Go to next page", href: "/gta-6/news/page-2" });
    expect(m.find((e) => e.kind === "last")!.href).toBe("/gta-6/news/page-6"); // D-015
  });
  it("F7-04 page 2: first and previous go to the list URL", () => {
    const m = pagerModel(2, 6, href);
    expect(linkTexts(m).join(" || ")).toBe(" ||  || 1 || 2 || 3 || 4 || 5 || 6 ||  || ");
    expect(m.find((e) => e.kind === "first")!.href).toBe("/gta-6/news/");
    expect(m.find((e) => e.kind === "prev")!.href).toBe("/gta-6/news/");
    expect(m.find((e) => e.kind === "next")!.href).toBe("/gta-6/news/page-3");
    expect(m.filter((e) => e.disabled)).toHaveLength(0);
  });
  it("F7-07 last page: next and last disabled", () => {
    const m = pagerModel(6, 6, href);
    expect(linkTexts(m).join(" || ")).toBe(" ||  || 1 || 2 || 3 || 4 || 5 || 6");
    expect(m.find((e) => e.kind === "prev")!.href).toBe("/gta-6/news/page-5");
    expect(m.filter((e) => e.disabled).map((e) => e.label)).toEqual(["Go to next page", "Go to last page"]);
  });
  it("F7-42 guides page 1 of 3", () => {
    const m = pagerModel(1, 3, (p) => listPageHref("/gta-6/guides/", p));
    expect(linkTexts(m).join(" || ")).toBe("1 || 2 || 3 ||  || ");
    expect(m.find((e) => e.kind === "last")!.href).toBe("/gta-6/guides/page-3");
  });
  it("HYPOTHESIS window of 10 beyond 10 pages: start = max(1, min(N−4, M−9))", () => {
    const pages = (n: number, m: number) => pagerModel(n, m).filter((e) => e.kind === "page").map((e) => e.page);
    expect(pages(1, 20)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(pages(8, 20)).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    expect(pages(20, 20)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });
});

describe("R-1114 article neighbours", () => {
  it("F7-29: previous = next newer, next = next older; none at the ends", () => {
    const ordered = [
      "how-to-claim-ultimate-edition-benefits-in-gta-6",
      "gta-6-phone-guide-every-app-explained",
      "gta-6-driving-tips",
      "gta-6-review-bombed-on-metacritic",
    ].map((slug) => ({ slug }));
    expect(articleNeighbours(ordered, "gta-6-driving-tips")).toEqual({
      prev: { slug: "gta-6-phone-guide-every-app-explained" },
      next: { slug: "gta-6-review-bombed-on-metacritic" },
    });
    expect(articleNeighbours(ordered, ordered[0].slug).prev).toBeNull();
    expect(articleNeighbours(ordered, ordered[3].slug).next).toBeNull();
    expect(articleNeighbours(ordered, "nope")).toEqual({ prev: null, next: null });
  });
});
