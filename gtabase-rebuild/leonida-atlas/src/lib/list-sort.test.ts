import { describe, expect, it } from "vitest";
import { compareTextCharwise, directionButtonLabel, flipDirection, sortEntries, sortValueOf } from "./list-sort";
import { filterEntries } from "./list-filter";
import { SAMPLE_VEHICLES, VEHICLE_RULES, WEAPON_RULES } from "./test-fixtures";

const SPEED = "attr.ct6.frontend_value";

describe("R-521 default order (speed descending)", () => {
  it("F1-38 / F3-05: Thrax (9.2) first, then the three 9.1 Emerus by name Z→A", () => {
    const sorted = sortEntries(SAMPLE_VEHICLES, SPEED, "desc", VEHICLE_RULES).map((v) => v.slug);
    expect(sorted.slice(0, 4)).toEqual(["andrew-nodes-thrax", "seaspray-emerus", "honeycomb-emerus", "black-widow-emerus"]);
  });
  it("F1-25 / F1-26: a vehicle without speed is last in both directions", () => {
    const sports = filterEntries(SAMPLE_VEHICLES, { "attr.ct1.value": ["sports"] }, VEHICLE_RULES);
    expect(sortEntries(sports, SPEED, "desc", VEHICLE_RULES).map((v) => v.slug)).toEqual(["comet-s2-cabrio", "banshee", "slow-wagon"]);
    expect(sortEntries(sports, SPEED, "asc", VEHICLE_RULES).map((v) => v.slug)).toEqual(["banshee", "comet-s2-cabrio", "slow-wagon"]);
  });
  it("ascending equal values fall back to names A→Z", () => {
    const sorted = sortEntries(SAMPLE_VEHICLES, SPEED, "asc", VEHICLE_RULES).map((v) => v.slug);
    expect(sorted.indexOf("black-widow-emerus")).toBeLessThan(sorted.indexOf("honeycomb-emerus"));
    expect(sorted.indexOf("honeycomb-emerus")).toBeLessThan(sorted.indexOf("seaspray-emerus"));
  });
});

describe("R-519 / R-521 other fields", () => {
  it("F1-22 Vehicle Name keeps the descending direction (Z→A)", () => {
    const names = sortEntries(SAMPLE_VEHICLES, "name", "desc", VEHICLE_RULES).map((v) => v.name);
    expect(names[0]).toBe("Slow Wagon");
    expect(names[names.length - 1]).toBe("Andrew Node's Thrax");
  });
  it("F1-27 Vehicle Class compares display labels alphabetically ('Boats' first ascending)", () => {
    const sorted = sortEntries(SAMPLE_VEHICLES, "attr.ct1.frontend_value", "asc", VEHICLE_RULES);
    expect(sorted[0].classLabels).toEqual(["Boats"]);
    // multi-value: ["Helicopters","Emergency"] compares as "Emergency Helicopters"
    expect(sorted[1].slug).toBe("maverick");
  });
  it("numbers compare numerically, not as text", () => {
    const rows = [
      { name: "A", seats: 10 },
      { name: "B", seats: 9 },
      { name: "C", seats: 2 },
    ];
    expect(sortEntries(rows, "attr.ct11.frontend_value", "asc", VEHICLE_RULES).map((r) => r.name)).toEqual(["C", "B", "A"]);
  });
  it("F3-14: weapon names '.38' then '1922' before letters", () => {
    const weapons = [{ name: "Assault Rifle" }, { name: "1922" }, { name: "Bat" }, { name: ".38" }];
    expect(sortEntries(weapons, "name", "asc", WEAPON_RULES).map((w) => w.name)).toEqual([".38", "1922", "Assault Rifle", "Bat"]);
  });
  it("F1-W06..F1-W08: missing damage last in both directions", () => {
    const weapons = [
      { name: "Bat", damage: undefined },
      { name: "Pistol", damage: 4 },
      { name: "Revolver", damage: 7.5 },
      { name: "Taser", damage: null },
    ];
    const asc = sortEntries(weapons, "attr.ct58.frontend_value", "asc", WEAPON_RULES).map((w) => w.name);
    const desc = sortEntries(weapons, "attr.ct58.frontend_value", "desc", WEAPON_RULES).map((w) => w.name);
    expect(asc).toEqual(["Pistol", "Revolver", "Bat", "Taser"]);
    expect(desc).toEqual(["Revolver", "Pistol", "Taser", "Bat"]);
  });
  it("R-522 an unknown sort key orders by name ascending whatever the direction", () => {
    expect(sortEntries(SAMPLE_VEHICLES, "bogus", "desc", VEHICLE_RULES)[0].name).toBe("Andrew Node's Thrax");
  });
});

describe("R-521 text comparison details", () => {
  it("character by character, the longer is larger when one is a prefix", () => {
    expect(compareTextCharwise("Emerus", "Emerus S")).toBe(-1);
    expect(compareTextCharwise("b", "A")).toBe(1);
    expect(compareTextCharwise("a", "B")).toBe(-1);
    expect(compareTextCharwise("same", "same")).toBe(0);
  });
  it("sort values: arrays sorted and joined, empties missing", () => {
    expect(sortValueOf({ c: ["Super", "Emergency"] }, "c")).toEqual({ kind: "text", s: "Emergency Super" });
    expect(sortValueOf({ c: [] }, "c")).toEqual({ kind: "missing" });
    expect(sortValueOf({ c: "" }, "c")).toEqual({ kind: "missing" });
    expect(sortValueOf({ c: "12" }, "c")).toEqual({ kind: "number", n: 12 });
    expect(sortValueOf({ c: Number.NaN }, "c")).toEqual({ kind: "missing" });
  });
});

describe("R-520 direction button", () => {
  it("flips and names what it will do", () => {
    expect(flipDirection("asc")).toBe("desc");
    expect(flipDirection("desc")).toBe("asc");
    expect(directionButtonLabel("asc")).toBe("Sort descending");
    expect(directionButtonLabel("desc")).toBe("Sort ascending");
  });
});
