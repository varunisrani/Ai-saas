import { describe, expect, it } from "vitest";
import {
  editDistance,
  enterTargetIndex,
  mapSearchMessages,
  normalizeMapText,
  searchMarkers,
  typoWordMatch,
  visibleCategoryRows,
  MAP_SEARCH_MAX_HITS,
} from "./map-search";
import { ATMS, BANKS, CATEGORY_ORDER, SAFEHOUSES, WRATH, groupOf } from "./map-fixtures.test-helpers";

const CATEGORY_NAMES: Record<string, string> = {
  bank: "Banks",
  safehouse: "Safehouses",
  atm: "ATMs",
  "card-liberty-city-wrath": "Liberty City Wrath",
  "smash-n-grab": "Smash 'n' Grabs",
  "collectible-card": "Other Cards",
  "card-vice-city-club-de-futbol": "Vice City Club De Fútbol",
  bar: "Bars",
  garage: "Garages",
};
const CATEGORIES = CATEGORY_ORDER.map((id) => ({
  id,
  name: CATEGORY_NAMES[id] ?? id.replace(/-/g, " "),
  group: groupOf(id),
  multiSpawn: id.startsWith("card-") || id === "collectible-card",
}));
const GROUPS = [
  { id: "properties", name: "Personal" },
  { id: "robberies", name: "Robberies" },
  { id: "activities", name: "Activities" },
  { id: "collectibles", name: "Collectibles" },
  { id: "collectible-cards", name: "Collectible Cards" },
  { id: "vehicles", name: "Vehicles" },
  { id: "weapons", name: "Weapons" },
  { id: "style", name: "Style" },
  { id: "food-drink", name: "Food & Drink" },
  { id: "local-places", name: "Local Places" },
];
const MARKERS = [...BANKS, ...SAFEHOUSES, ...WRATH, ...ATMS];

describe("R-835 normalisation", () => {
  it.each([
    ["  SAFEHOUSE  ", "safehouse"],
    ["Smash 'n' Grabs", "smash n grabs"],
    ["Food & Drink", "food and drink"],
    ["America's Next Top Hooker", "americas next top hooker"],
    ["Vice City Club De Fútbol", "vice city club de futbol"],
    ["Waink: Curiosities", "waink curiosities"],
    ["<b>zzqxv</b>", "b zzqxv b"],
    ["    ", ""],
  ])("%j → %j", (input, out) => {
    expect(normalizeMapText(input)).toBe(out);
  });
});

describe("edit distance (adjacent swap = 1 edit)", () => {
  it("examples", () => {
    expect(editDistance("safehuose", "safehouse")).toBe(1);
    expect(editDistance("ca", "ac")).toBe(1);
    expect(editDistance("kitten", "sitting")).toBe(3);
    expect(editDistance("", "abc")).toBe(3);
    expect(editDistance("same", "same")).toBe(0);
  });
  it("prefix of a longer word may match; short words get no tolerance", () => {
    expect(typoWordMatch("safehuose", ["safehouses"], 2)).toBe(true);
    expect(typoWordMatch("bnak", ["banks"], 1)).toBe(true);
    expect(typoWordMatch("bnk", ["banks"], 0)).toBe(false);
  });
});

describe("R-836 marker hits", () => {
  it("F4-35 / F4-45 'safehouse' (any case/spaces): category+number match, ordered by number", () => {
    for (const q of ["safehouse", "  SAFEHOUSE  "]) {
      const r = searchMarkers(q, MARKERS, CATEGORIES);
      expect(r.total).toBe(5);
      expect(r.hits.every((h) => h.score === 3)).toBe(true);
      expect(r.hits.map((h) => h.line)).toEqual(["Safehouses #1", "Safehouses #2", "Safehouses #3", "Safehouses #4", "Safehouses #5"]);
      expect(r.hits[0].marker.id).toBe("safehouse-001");
    }
  });
  it("F4-40 'safehuose' finds the safehouses through typo tolerance (score 2)", () => {
    const r = searchMarkers("safehuose", MARKERS, CATEGORIES);
    expect(r.total).toBe(5);
    expect(r.hits.every((h) => h.score === 2)).toBe(true);
  });
  it("name match ranks first (score 4); description words score 1", () => {
    expect(searchMarkers("Pegassi", MARKERS, CATEGORIES).hits[0]).toMatchObject({ score: 4, line: "Safehouses #2" });
    expect(searchMarkers("pegassiresidences", MARKERS, CATEGORIES).hits[0].score).toBe(4);
    const desc = searchMarkers("lighthouse", MARKERS, CATEGORIES);
    expect(desc.total).toBe(1);
    expect(desc.hits[0]).toMatchObject({ score: 1 });
  });
  it("order: score, then category order, then number", () => {
    const r = searchMarkers("wrath", MARKERS, CATEGORIES);
    expect(r.total).toBe(13);
    const nums = r.hits.map((h) => h.number);
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
  });
  it("F4-43 more than 30 hits: 30 listed + total", () => {
    const r = searchMarkers("cash point", MARKERS, CATEGORIES);
    expect(r.hits).toHaveLength(MAP_SEARCH_MAX_HITS);
    expect(r.total).toBe(30);
    const many = searchMarkers("a", MARKERS, CATEGORIES);
    expect(many.hits).toHaveLength(30);
    expect(many.total).toBeGreaterThan(30);
  });
  it("F4-42 an empty normalised query lists nothing", () => {
    expect(searchMarkers("    ", MARKERS, CATEGORIES)).toEqual({ hits: [], total: 0 });
  });
});

describe("R-838 category rows", () => {
  it("F4-39 no row left", () => {
    expect(visibleCategoryRows("zzqxv", CATEGORIES, GROUPS).rowsLeft).toBe(0);
  });
  it("group name matches keep every row of the group ('card' → Collectible Cards)", () => {
    const r = visibleCategoryRows("card", CATEGORIES, GROUPS);
    expect(r.groupIds.has("collectible-cards")).toBe(true);
    expect(CATEGORIES.filter((c) => c.group === "collectible-cards").every((c) => r.categoryIds.has(c.id))).toBe(true);
  });
  it("typo tolerance from 5 letters; empty query shows all rows", () => {
    expect(visibleCategoryRows("safehuose", CATEGORIES, GROUPS).categoryIds.has("safehouse")).toBe(true);
    expect(visibleCategoryRows("bnak", CATEGORIES, GROUPS).categoryIds.has("bank")).toBe(false);
    expect(visibleCategoryRows("baks", CATEGORIES, GROUPS).categoryIds.has("bank")).toBe(false);
    expect(visibleCategoryRows("bnaks", CATEGORIES, GROUPS).categoryIds.has("bank")).toBe(true);
    expect(visibleCategoryRows("", CATEGORIES, GROUPS).rowsLeft).toBe(102);
  });
});

describe("R-837 messages", () => {
  it("F4-39 / F4-41 no match texts (query shown as text, trimmed)", () => {
    expect(mapSearchMessages("zzqxv", 0, 0)).toEqual({
      marker: 'No marker matches "zzqxv".',
      category: 'No category matches "zzqxv".',
    });
    expect(mapSearchMessages("<b>zzqxv</b>", 0, 0).category).toBe('No category matches "<b>zzqxv</b>".');
    expect(mapSearchMessages("  zz  ", 0, 3).marker).toBe('No marker matches "zz".');
  });
  it("more than 30 hits", () => {
    expect(mapSearchMessages("card", 117, 20)).toEqual({ marker: "87 more, type a bit more of the name.", category: null });
    expect(mapSearchMessages("safehouse", 5, 1)).toEqual({ marker: null, category: null });
  });
  it("F4-42 an empty normalised query shows no message", () => {
    expect(mapSearchMessages("    ", 0, 102)).toEqual({ marker: null, category: null });
  });
  it("R-839 Enter opens the active hit or the first", () => {
    expect(enterTargetIndex(-1, 5)).toBe(0);
    expect(enterTargetIndex(1, 5)).toBe(1);
    expect(enterTargetIndex(-1, 0)).toBe(-1);
  });
});
