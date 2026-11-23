import { describe, expect, it } from "vitest";
import f5 from "../../tests/vectors/f5-checklists.json";
import {
  applyGuestChecklistChange,
  cascadeToggle,
  checkboxLabel,
  checklistPercentage,
  displayPercentage,
  readChecklistIds,
  stripProfileHash,
  type ChecklistItemInput,
} from "./checklist";

/** R-1617 fixture of the 100% list (ids, parents, weights; labels irrelevant here). */
const TASKS = ["bank-jobs", "payday", "smash-grab", "stick-ups", "narcotics", "jewelry", "marked-bills", "vaults", "vehicles-fenced"];
const EXPLORATION = [
  "kenton",
  "cards",
  "waink",
  "underwater",
  "magazines",
  "meditation",
  "flamingos",
  "playlists",
  "styles",
  "races",
  "race-challenges",
  "shooting",
  "video-games",
  "pool",
  "mini-golf",
  "basketball",
  "drones",
  "stunts",
  "challenges",
  "target-decks",
];
const ITEMS: ChecklistItemInput[] = [
  { id: "story", weight: 50 },
  { id: "story-tasks", limit: 27 },
  { id: "optional", parent: "story-tasks", weight: 6 },
  { id: "gang-ops", parent: "story-tasks", weight: 3 },
  ...TASKS.map((id) => ({ id, parent: "story-tasks", weight: 2 })),
  { id: "exploration", weight: 20 },
  ...EXPLORATION.map((id) => ({ id, parent: "exploration" })),
  { id: "discovery", weight: 3 },
  { id: "vehicles", parent: "discovery" },
  { id: "weapons", parent: "discovery" },
  { id: "animals", parent: "discovery" },
];

interface Vector {
  id: string;
  keys: string[];
  expect: Record<string, string | undefined>;
}

/** Plays the clicks of a vector on the 100% list (sec-/toc- copies are the same item, R-904). */
function play(keys: readonly string[], startRaw: string | null = null) {
  let raw = startRaw;
  let ticked = readChecklistIds(raw, "gta6-100");
  const click = (id: string) => {
    const r = cascadeToggle(ITEMS, ticked, id);
    ticked = r.ticked;
    raw = applyGuestChecklistChange(raw, "gta6-100", r.changes);
  };
  for (const k of keys) {
    const m = /^(?:click|focus):(?:sec|toc)-(.+)$/.exec(k);
    if (k === "macro:tick-all-exploration") EXPLORATION.forEach(click);
    else if (m && k.startsWith("click:")) click(m[1]);
    else if (k === "press:Space" && keys.some((x) => x.startsWith("focus:"))) {
      click(/^focus:(?:sec|toc)-(.+)$/.exec(keys.find((x) => x.startsWith("focus:")) as string)![1]);
    }
  }
  return { raw, ticked, pct: displayPercentage(checklistPercentage(ITEMS, ticked)) };
}

describe("R-905 / R-906 / R-914 against the recorded F5 vectors", () => {
  const cases = (f5 as unknown as Vector[]).filter(
    (v) => /^F5-(0[2-9]|1[0-4]|17|18)$/.test(v.id) && v.expect["local:guest_checklists"] !== undefined,
  );
  it("covers the recorded 100% cases", () => {
    expect(cases.map((c) => c.id)).toEqual([
      "F5-02",
      "F5-03",
      "F5-04",
      "F5-05",
      "F5-06",
      "F5-07",
      "F5-08",
      "F5-09",
      "F5-10",
      "F5-11",
      "F5-12",
      "F5-13",
      "F5-14",
      "F5-17",
      "F5-18",
    ]);
  });
  for (const c of cases) {
    it(`${c.id}: ${c.keys.join(" ; ")}`, () => {
      const r = play(c.keys);
      expect(r.raw).toBe(c.expect["local:guest_checklists"]);
      if (c.expect["text:pct-text"]) expect(r.pct.text).toBe(c.expect["text:pct-text"]);
      if (c.expect["attr:pct-bar@aria-valuenow"]) expect(r.pct.valueNow).toBe(c.expect["attr:pct-bar@aria-valuenow"]);
      // every requirement appears twice on the page (contents box + section heading, R-904)
      if (c.expect["count:cl-box-checked"]) expect(String(r.ticked.length * 2)).toBe(c.expect["count:cl-box-checked"]);
      if (c.expect["count:sec-exploration-children-checked"]) {
        expect(String(r.ticked.filter((id) => EXPLORATION.includes(id)).length)).toBe(c.expect["count:sec-exploration-children-checked"]);
      }
      if (c.expect["checked:sec-exploration"]) expect(String(r.ticked.includes("exploration"))).toBe(c.expect["checked:sec-exploration"]);
      if (c.expect["checked:sec-story-tasks"]) expect(String(r.ticked.includes("story-tasks"))).toBe(c.expect["checked:sec-story-tasks"]);
      if (c.expect["checked:sec-discovery"]) expect(String(r.ticked.includes("discovery"))).toBe(c.expect["checked:sec-discovery"]);
    });
  }
  it("F5-15 / F5-16 saved progress story + kenton → 51.00", () => {
    const r = play([], '{"gta6-100":["story","kenton"]}');
    expect(r.pct.text).toBe("51.00");
    expect(r.ticked).toEqual(["story", "kenton"]);
  });
  it("F5-01 nothing ticked → 0.00", () => {
    expect(play([]).pct.text).toBe("0.00");
  });
});

describe("R-914 percentage rule (synthetic probes)", () => {
  it("S-A1-like: weight 30 split over 11 sub-items, one ticked → 2.73", () => {
    const items = [{ id: "p", weight: 30 }, ...Array.from({ length: 11 }, (_, i) => ({ id: `c${i}`, parent: "p" }))];
    expect(displayPercentage(checklistPercentage(items, ["c4"])).text).toBe("2.73");
  });
  it("S-B1-like: own weight × multiplier → 5.00; split in proportion to multipliers", () => {
    expect(displayPercentage(checklistPercentage([{ id: "a", weight: 2.5, multiplier: 2 }], ["a"])).text).toBe("5.00");
    const items = [
      { id: "p", weight: 9 },
      { id: "x", parent: "p", multiplier: 2 },
      { id: "y", parent: "p" },
    ];
    expect(checklistPercentage(items, ["x"])).toBeCloseTo(6);
  });
  it("S-C1-like: a group key forms one slot that counts once → 1.50", () => {
    const items = [
      { id: "p", weight: 3 },
      { id: "g1", parent: "p", group: "g" },
      { id: "g2", parent: "p", group: "g" },
      { id: "solo", parent: "p" },
    ];
    expect(displayPercentage(checklistPercentage(items, ["g1"])).text).toBe("1.50");
    expect(displayPercentage(checklistPercentage(items, ["g1", "g2"])).text).toBe("1.50");
    // parent evaluation: one ticked group member is enough (R-905)
    const r = cascadeToggle(items, ["g2"], "solo");
    expect(r.changes).toEqual([
      { id: "solo", on: true },
      { id: "p", on: true },
    ]);
  });
  it("recursion uses the share as the parent weight; limits cap; duplicates count once", () => {
    const nested = [
      { id: "top", weight: 20 },
      { id: "a", parent: "top" },
      { id: "b", parent: "top" },
      { id: "a1", parent: "a" },
      { id: "a2", parent: "a" },
    ];
    expect(checklistPercentage(nested, ["a1"])).toBeCloseTo(5);
    const capped = [
      { id: "cap", limit: 5 },
      { id: "x", parent: "cap", weight: 3 },
      { id: "y", parent: "cap", weight: 3 },
    ];
    expect(checklistPercentage(capped, ["x", "y"])).toBe(5);
    expect(checklistPercentage([...ITEMS, { id: "story", weight: 50 }], ["story"])).toBe(50);
    expect(checklistPercentage(ITEMS, ITEMS.map((i) => i.id))).toBe(100);
  });
});

describe("R-407 / R-915 display", () => {
  it("clamped, two decimals, bar width, valuenow, heading", () => {
    expect(displayPercentage(0)).toMatchObject({ text: "0.00", width: "0%" });
    expect(displayPercentage(50)).toEqual({ text: "50.00", widthPercent: 50, width: "50%", valueNow: "50.00", heading: "50.00% Completed!" });
    expect(displayPercentage(100.0000001).text).toBe("100.00");
    expect(displayPercentage(130)).toMatchObject({ text: "100.00", width: "100%" });
    expect(displayPercentage(-2)).toMatchObject({ text: "0.00", width: "0%" });
    expect(displayPercentage(Number.NaN).text).toBe("0.00");
  });
});

describe("R-906 / R-909 guest storage", () => {
  it("F5-23 / F5-26: lists share one object; new lists are appended", () => {
    const missions = applyGuestChecklistChange(null, "gta6-missions", [{ id: "7285", on: true }]);
    expect(missions).toBe('{"gta6-missions":["7285"]}');
    expect(applyGuestChecklistChange(missions, "gta6-100", [{ id: "story", on: true }])).toBe(
      '{"gta6-missions":["7285"],"gta6-100":["story"]}',
    );
  });
  it("F5-04 the object is always written: {} after the last untick", () => {
    expect(applyGuestChecklistChange('{"gta6-100":["story"]}', "gta6-100", [{ id: "story", on: false }])).toBe("{}");
  });
  it("unreadable JSON is treated as {} and overwritten", () => {
    expect(applyGuestChecklistChange("{broken", "gta6-missions", [{ id: "6644", on: true }])).toBe('{"gta6-missions":["6644"]}');
    expect(readChecklistIds("{broken", "gta6-missions")).toEqual([]);
    expect(readChecklistIds('{"gta6-missions":"x"}', "gta6-missions")).toEqual([]);
  });
  it("an id is appended once and other ids keep their order", () => {
    const raw = '{"gta6-100":["a","b","c"]}';
    expect(
      applyGuestChecklistChange(raw, "gta6-100", [
        { id: "b", on: true },
        { id: "a", on: false },
        { id: "d", on: true },
      ]),
    ).toBe('{"gta6-100":["b","c","d"]}');
  });
  it("mission lists have no parents: a toggle changes only that id (F5-23, F5-35)", () => {
    const missions = [{ id: "6644" }, { id: "7285" }, { id: "7291" }];
    expect(cascadeToggle(missions, [], "7285")).toEqual({ ticked: ["7285"], changes: [{ id: "7285", on: true }] });
    expect(cascadeToggle(missions, ["9999"], "6644").ticked).toEqual(["6644", "9999"]);
  });
});

describe("R-910 accessible names", () => {
  it.each([
    ["Story Completion (50%)", "Mark as completed: Story Completion (50%)"], // F5-20
    ["5 of 7 Kenton Sets Completed (1%)", "Mark as completed: 5 of 7 Kenton Sets Completed (1%)"], // F5-20
    ["1.  Prologue", "Mark as completed: Prologue"], // F5-24
    ["2. Gone Fishing\n   CHAPTER 1 POINT OF NO RETURN", "Mark as completed: Gone Fishing CHAPTER 1 POINT OF NO RETURN"], // F5-24
    ["Get Shirley's Rum OPTIONALMISSABLE", "Mark as completed: Get Shirley's Rum OPTIONALMISSABLE"], // F5-24
    ["  Search for the Skunk Ape ", "Mark as completed: Search for the Skunk Ape"], // F5-27
    ["3) Third", "Mark as completed: Third"],
    ["Mission Completed", "Mark as completed: Mission Completed"], // R-917
    ["", "Mark as completed"],
  ])("%j", (row, name) => {
    expect(checkboxLabel(row)).toBe(name);
  });
  it("cut to 100 characters", () => {
    expect(checkboxLabel("y".repeat(140))).toBe(`Mark as completed: ${"y".repeat(100)}`);
  });
});

describe("R-911 profile hash", () => {
  it("F5-19 '#profile=3' is removed; other hashes stay", () => {
    expect(stripProfileHash("#profile=3")).toBe("");
    expect(stripProfileHash("#story")).toBe("#story");
    expect(stripProfileHash("")).toBe("");
  });
});
