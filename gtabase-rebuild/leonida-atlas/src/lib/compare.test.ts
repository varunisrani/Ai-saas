import { describe, expect, it } from "vitest";
import {
  addSlotTitle,
  bestValueFlags,
  canonicalComparison,
  compareBarHidden,
  compareBarLabel,
  compareCountText,
  compareLink,
  compareNamesText,
  compareStorageKey,
  compareToHref,
  compareToggleLabel,
  comparisonNote,
  isToggleDisabled,
  readPicks,
  removeFromComparisonHref,
  removeFromComparisonLabel,
  serializePicks,
  showComparisonNote,
  togglePick,
  type ComparePick,
} from "./compare";

const THRAX = { id: "andrew-nodes-thrax", name: "Andrew Node's Thrax" };
const SEASPRAY = { id: "seaspray-emerus", name: "Seaspray Emerus" };
const HONEYCOMB = { id: "honeycomb-emerus", name: "Honeycomb Emerus" };
const WIDOW = { id: "black-widow-emerus", name: "Black Widow Emerus" };
const FIFTH = { id: "dantes-vitello", name: "Dantes Vitello" };
const V = "/gta-6/vehicles/";

describe("R-703 storage", () => {
  it("keys per list", () => {
    expect(compareStorageKey("/gta-6/vehicles/")).toBe("gtabCompare:/gta-6/vehicles/");
    expect(compareStorageKey("/gta-6/weapons/")).toBe("gtabCompare:/gta-6/weapons/");
  });
  it("F3-02..F3-08 pick sequence and exact storage text", () => {
    let picks: readonly ComparePick[] = [];
    picks = togglePick(picks, THRAX);
    expect(serializePicks(picks)).toBe('[{"id":"andrew-nodes-thrax","name":"Andrew Node\'s Thrax"}]');
    picks = togglePick(picks, SEASPRAY);
    expect(serializePicks(picks)).toBe(
      '[{"id":"andrew-nodes-thrax","name":"Andrew Node\'s Thrax"},{"id":"seaspray-emerus","name":"Seaspray Emerus"}]',
    );
    expect(serializePicks(togglePick(picks, THRAX))).toBe('[{"id":"seaspray-emerus","name":"Seaspray Emerus"}]'); // F3-04
    picks = togglePick(togglePick(picks, HONEYCOMB), WIDOW);
    expect(picks.map((p) => p.id)).toEqual(["andrew-nodes-thrax", "seaspray-emerus", "honeycomb-emerus", "black-widow-emerus"]);
    expect(togglePick(picks, FIFTH)).toBe(picks); // F3-06: 5th ignored
    expect(serializePicks(togglePick(picks, WIDOW))).toBe(
      '[{"id":"andrew-nodes-thrax","name":"Andrew Node\'s Thrax"},{"id":"seaspray-emerus","name":"Seaspray Emerus"},{"id":"honeycomb-emerus","name":"Honeycomb Emerus"}]',
    ); // F3-07
    expect(serializePicks([])).toBe("[]"); // F3-08 Clear
  });
  it("F3-14 weapon picks with numeric-looking keys", () => {
    const picks = togglePick(togglePick([], { id: "38", name: ".38" }), { id: "heavy-pistol", name: "1922" });
    expect(serializePicks(picks)).toBe('[{"id":"38","name":".38"},{"id":"heavy-pistol","name":"1922"}]');
    expect(compareLink("/gta-6/weapons/", "weapon", picks)).toBe("/gta-6/weapons/comparison/?weapon1=38&weapon2=heavy-pistol");
  });
  it("unreadable stored JSON counts as no picks; round trip", () => {
    expect(readPicks("{oops")).toEqual([]);
    expect(readPicks(null)).toEqual([]);
    expect(readPicks('{"id":"x"}')).toEqual([]);
    expect(readPicks('[{"id":"38","name":".38"},{"id":38},{"name":"x"},{"id":"38","name":"dup"}]')).toEqual([
      { id: "38", name: ".38" },
    ]);
    const raw = '[{"id":"andrew-nodes-thrax","name":"Andrew Node\'s Thrax"}]';
    expect(serializePicks(readPicks(raw))).toBe(raw);
  });
});

describe("R-702 / R-705 / R-706 bar and toggles", () => {
  const four = [THRAX, SEASPRAY, HONEYCOMB, WIDOW];
  it("F3-05: with 4 picked the other toggles are disabled, the picked ones are not", () => {
    expect(isToggleDisabled(four, FIFTH.id)).toBe(true);
    expect(isToggleDisabled(four, WIDOW.id)).toBe(false);
    expect(isToggleDisabled(four.slice(0, 3), FIFTH.id)).toBe(false); // F3-07
  });
  it("F3-01..F3-05 bar texts and links", () => {
    expect(compareCountText(0)).toBe("0/4");
    expect(compareBarHidden(0)).toBe(true);
    expect(compareBarHidden(1)).toBe(false);
    expect(compareBarLabel(0).toUpperCase()).toBe("PICK 1 MORE");
    expect(compareBarLabel(1)).toBe("Pick 1 more");
    expect(compareBarLabel(2).toUpperCase()).toBe("COMPARE (2)");
    expect(compareLink(V, "vehicle", [THRAX])).toBe("#");
    expect(compareLink(V, "vehicle", [THRAX, SEASPRAY])).toBe("/gta-6/vehicles/comparison/?vehicle1=andrew-nodes-thrax&vehicle2=seaspray-emerus");
    expect(compareLink(V, "vehicle", four)).toBe(
      "/gta-6/vehicles/comparison/?vehicle1=andrew-nodes-thrax&vehicle2=black-widow-emerus&vehicle3=honeycomb-emerus&vehicle4=seaspray-emerus",
    );
    expect(compareLink(V, "vehicle", four.slice(0, 3))).toBe(
      "/gta-6/vehicles/comparison/?vehicle1=andrew-nodes-thrax&vehicle2=honeycomb-emerus&vehicle3=seaspray-emerus",
    );
    expect(compareNamesText([THRAX, SEASPRAY])).toBe("Andrew Node's Thrax · Seaspray Emerus");
  });
  it("F3-01 / F3-14 toggle accessible name", () => {
    expect(compareToggleLabel("Andrew Node's Thrax")).toBe("Compare Andrew Node's Thrax");
    expect(compareToggleLabel(".38")).toBe("Compare .38");
  });
});

describe("R-619 Compare To links", () => {
  it("F2-13: two parameters sorted by plain string order", () => {
    expect(compareToHref(V, "vehicle", "sunset-sanchez", "western-nightblade")).toBe(
      "/gta-6/vehicles/comparison/?vehicle1=sunset-sanchez&vehicle2=western-nightblade",
    );
    expect(compareToHref(V, "vehicle", "sunset-sanchez", "maibatsu-sanchez")).toBe(
      "/gta-6/vehicles/comparison/?vehicle1=maibatsu-sanchez&vehicle2=sunset-sanchez",
    );
  });
});

describe("R-713 canonical comparison (HYPOTHESIS)", () => {
  const known = ["maibatsu-sanchez", "sunset-sanchez", "western-nightblade", "banshee", "dodo"];
  it("already canonical → no redirect (F3-27 form)", () => {
    const r = canonicalComparison("?vehicle1=maibatsu-sanchez&vehicle2=sunset-sanchez", "vehicle", known);
    expect(r).toEqual({
      keys: ["maibatsu-sanchez", "sunset-sanchez"],
      redirect: false,
      href: "/gta-6/vehicles/comparison/?vehicle1=maibatsu-sanchez&vehicle2=sunset-sanchez",
    });
  });
  it("F3-28 unsorted → redirect to the sorted form", () => {
    const r = canonicalComparison("vehicle1=sunset-sanchez&vehicle2=maibatsu-sanchez", "vehicle", known);
    expect(r.redirect).toBe(true);
    expect(r.href).toBe("/gta-6/vehicles/comparison/?vehicle1=maibatsu-sanchez&vehicle2=sunset-sanchez");
  });
  it("unknown keys and duplicates dropped, first 4 kept, renumbered", () => {
    const r = canonicalComparison(
      "vehicle3=dodo&vehicle1=nope&vehicle2=dodo&vehicle7=banshee&vehicle4=western-nightblade&vehicle5=sunset-sanchez&vehicle6=maibatsu-sanchez",
      "vehicle",
      new Set(known),
    );
    expect(r.keys).toEqual(["banshee", "dodo", "sunset-sanchez", "western-nightblade"]);
    expect(r.redirect).toBe(true);
  });
  it("0 valid keys → bare comparison path; utm alone does not redirect (R-003)", () => {
    expect(canonicalComparison("vehicle1=nope", "vehicle", known)).toEqual({ keys: [], redirect: true, href: "/gta-6/vehicles/comparison/" });
    expect(canonicalComparison("utm_source=test", "vehicle", known).redirect).toBe(false);
    expect(canonicalComparison("weapon1=38&utm_source=x", "weapon", ["38"]).redirect).toBe(false);
    expect(canonicalComparison(new URLSearchParams("weapon1=38"), "weapon", ["38"]).href).toBe("/gta-6/weapons/comparison/?weapon1=38");
  });
});

describe("R-714 filled board helpers", () => {
  it("remove link drops the key and renumbers", () => {
    expect(removeFromComparisonHref(["banshee", "dodo", "sunset-sanchez"], "dodo", V, "vehicle")).toBe(
      "/gta-6/vehicles/comparison/?vehicle1=banshee&vehicle2=sunset-sanchez",
    );
    expect(removeFromComparisonHref(["banshee"], "banshee", V, "vehicle")).toBe("/gta-6/vehicles/comparison/");
    expect(removeFromComparisonLabel("Banshee")).toBe("Remove Banshee from the comparison");
  });
  it("best values: all tied highest, missing never", () => {
    expect(bestValueFlags([7, 9, null, 9])).toEqual([false, true, false, true]);
    expect(bestValueFlags([null, undefined])).toEqual([false, false]);
  });
  it("R-708 texts", () => {
    expect(addSlotTitle("vehicle")).toBe("Add a vehicle");
    expect(addSlotTitle("weapon").toUpperCase()).toBe("ADD A WEAPON");
    expect(comparisonNote("vehicle")).toBe("Add at least two GTA 6 vehicles to see the comparison.");
    expect(comparisonNote("weapon")).toBe("Add at least two GTA 6 weapons to see the comparison.");
    expect(showComparisonNote(1)).toBe(true);
    expect(showComparisonNote(2)).toBe(false);
  });
});
