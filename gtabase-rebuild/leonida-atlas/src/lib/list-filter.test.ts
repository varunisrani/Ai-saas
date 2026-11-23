import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  clearedFilterState,
  filterEntries,
  optionCounts,
  optionLabel,
  presentOptionValues,
  textMatches,
} from "./list-filter";
import { SAMPLE_VEHICLES, VEHICLE_RULES } from "./test-fixtures";

describe("R-508 text filter match", () => {
  it("contains, ignoring letter case (F1-04/F1-05, F1-W09/F1-W10)", () => {
    expect(textMatches("an", "Andrew Node's Thrax")).toBe(true);
    expect(textMatches("AN", "Banshee")).toBe(true);
    expect(textMatches("a", "KZ-59")).toBe(false);
    expect(textMatches("A", "Assault Rifle")).toBe(true);
  });
  it("the query is not trimmed (F1-06 ' an', F1-41 'an ')", () => {
    expect(textMatches(" an", "Andrew Node's Thrax")).toBe(false);
    expect(textMatches(" an", "Big Andes")).toBe(true);
    expect(textMatches("an ", "Titan Cruiser")).toBe(true);
    expect(textMatches("an ", "Titan")).toBe(false);
  });
  it("every non-letter character is literal (F1-43)", () => {
    expect(textMatches("<b>x</b>", "Thrax")).toBe(false);
    expect(textMatches("<b>x</b>", "Model <b>x</b> Edition")).toBe(true);
    expect(textMatches(".", "Andrew Node's Thrax")).toBe(false);
    expect(textMatches("'", "Andrew Node's Thrax")).toBe(true);
  });
  it("empty query matches all; a missing value never matches a non-empty query (F1-R2)", () => {
    expect(textMatches("", undefined)).toBe(true);
    expect(textMatches("", "x")).toBe(true);
    expect(textMatches("a", undefined)).toBe(false);
    expect(textMatches("a", null)).toBe(false);
    expect(textMatches("a", "")).toBe(false);
  });
  it("F1-07 no match", () => {
    expect(SAMPLE_VEHICLES.filter((v) => textMatches("zzqqzz", v.name))).toHaveLength(0);
  });
});

describe("R-509 one-way accent folding", () => {
  it("F1-09 'huracan' and F1-10 'Huracán' both find 'Huracán'", () => {
    expect(textMatches("huracan", "Huracán Tribute")).toBe(true);
    expect(textMatches("Huracán", "Huracán Tribute")).toBe(true);
    expect(textMatches("HURACAN", "huracán")).toBe(true);
  });
  it("F1-08 an accented query letter matches only itself", () => {
    expect(textMatches("án", "Banshee")).toBe(false);
    expect(textMatches("án", "Huracán")).toBe(true);
    expect(textMatches("Án", "huracán")).toBe(true);
  });
  it("covers every listed base letter", () => {
    const pairs: Array<[string, string]> = [
      ["a", "æ"],
      ["a", "ẵ"],
      ["e", "ể"],
      ["i", "ı"],
      ["o", "ø"],
      ["u", "ü"],
      ["y", "ÿ"],
      ["c", "ç"],
      ["d", "đ"],
      ["n", "ñ"],
      ["g", "ğ"],
      ["s", "ş"],
    ];
    for (const [q, v] of pairs) expect(textMatches(q, v)).toBe(true);
    expect(textMatches("uber", "Übermacht")).toBe(true);
    expect(textMatches("z", "ž")).toBe(false);
  });
});

describe("R-511 filter combination", () => {
  it("several picked classes combine with OR (F1-15)", () => {
    const r = filterEntries(SAMPLE_VEHICLES, { "attr.ct1.value": ["sports", "super"] }, VEHICLE_RULES);
    expect(r.map((v) => v.slug)).toEqual([
      "andrew-nodes-thrax",
      "banshee",
      "black-widow-emerus",
      "comet-s2-cabrio",
      "honeycomb-emerus",
      "seaspray-emerus",
      "slow-wagon",
    ]);
  });
  it("different filters combine with AND (F1-18 hide standouts + Super → none here; Sports → regular only)", () => {
    expect(filterEntries(SAMPLE_VEHICLES, { "attr.ct1.value": ["super"], "attr.ct734.value": "hide-standouts" }, VEHICLE_RULES)).toHaveLength(0);
    const r = filterEntries(SAMPLE_VEHICLES, { "attr.ct1.value": ["sports"], name: "an" }, VEHICLE_RULES);
    expect(r.map((v) => v.slug)).toEqual(["banshee"]);
  });
  it("R-514 a standout set lists only that set; hide-standouts lists regular vehicles", () => {
    expect(filterEntries(SAMPLE_VEHICLES, { "attr.ct734.value": "all-terrain" }, VEHICLE_RULES).map((v) => v.slug)).toEqual([
      "andrew-nodes-thrax",
      "black-widow-emerus",
    ]);
    expect(filterEntries(SAMPLE_VEHICLES, { "attr.ct734.value": "hide-standouts" }, VEHICLE_RULES).every((v) => v.standout === "hide-standouts")).toBe(true);
  });
  it("a second class counts for the tile (multi-class vehicles)", () => {
    expect(filterEntries(SAMPLE_VEHICLES, { "attr.ct1.value": ["emergency"] }, VEHICLE_RULES).map((v) => v.slug)).toEqual(["maverick"]);
  });
});

describe("R-512 / R-513 option counts", () => {
  const classes = ["super", "sports", "motorcycles", "planes", "helicopters", "boats", "emergency"];
  it("no active filter: all items", () => {
    expect(optionCounts(SAMPLE_VEHICLES, {}, VEHICLE_RULES, "attr.ct1.value", classes)).toEqual({
      super: 4,
      sports: 3,
      motorcycles: 1,
      planes: 0,
      helicopters: 1,
      boats: 1,
      emergency: 1,
    });
  });
  it("the only active filter keeps its full counts", () => {
    expect(optionCounts(SAMPLE_VEHICLES, { "attr.ct1.value": ["super"] }, VEHICLE_RULES, "attr.ct1.value", classes).sports).toBe(3);
  });
  it("an active filter combined with others counts within the others' result", () => {
    const state = { "attr.ct1.value": ["super"], "attr.ct734.value": "hide-standouts" };
    expect(optionCounts(SAMPLE_VEHICLES, state, VEHICLE_RULES, "attr.ct1.value", classes)).toMatchObject({ super: 0, sports: 3 });
    expect(optionCounts(SAMPLE_VEHICLES, state, VEHICLE_RULES, "attr.ct734.value")).toEqual({
      "all-terrain": 2,
      "hide-standouts": 0,
      mudder: 2,
    });
  });
  it("an inactive filter counts within the current result; no match → every option 0 (R-518)", () => {
    const state = { name: "emerus" };
    expect(optionCounts(SAMPLE_VEHICLES, state, VEHICLE_RULES, "attr.ct2.value")).toEqual({
      truffade: 0,
      bravado: 0,
      progen: 3,
      ubermacht: 0,
      maibatsu: 0,
    });
    const none = optionCounts(SAMPLE_VEHICLES, { name: "zzqqzz" }, VEHICLE_RULES, "attr.ct1.value", classes);
    expect(Object.values(none).every((n) => n === 0)).toBe(true);
  });
  it("R-507 options are the values present in the data, empty skipped; R-506 labels", () => {
    expect(presentOptionValues([{ m: "a" }, { m: "" }, { m: null }, { m: "b" }, { m: "a" }], "m")).toEqual(["a", "b"]);
    expect(optionLabel("Super", 29)).toBe("Super (29)");
    expect(optionLabel("Hide Standout Vehicles", 319)).toBe("Hide Standout Vehicles (319)");
    expect(optionLabel("Base Weapon", 84)).toBe("Base Weapon (84)");
  });
});

describe("R-517 Clear Filters", () => {
  it("visible only while a filter is active; clearing empties every filter", () => {
    expect(activeFilterCount({}, VEHICLE_RULES)).toBe(0);
    expect(activeFilterCount({ name: "", "attr.ct1.value": [] }, VEHICLE_RULES)).toBe(0);
    expect(activeFilterCount({ name: "a", "attr.ct1.value": ["super"], "attr.ct734.value": "hide-standouts" }, VEHICLE_RULES)).toBe(3);
    const cleared = clearedFilterState(VEHICLE_RULES);
    expect(activeFilterCount(cleared, VEHICLE_RULES)).toBe(0);
    expect(filterEntries(SAMPLE_VEHICLES, cleared, VEHICLE_RULES)).toHaveLength(SAMPLE_VEHICLES.length);
  });
});
