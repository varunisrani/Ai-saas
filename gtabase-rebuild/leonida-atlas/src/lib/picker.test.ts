import { describe, expect, it } from "vitest";
import { PICKER_MAX_ROWS, normalizeForPicker, pickHref, pickerResults, slotTarget, wrapIndex } from "./picker";

const OWN_WORDS = ["Drug Mule", "Harbor", "Swamp", "Neon", "Gilded", "Rusted"];
const WEAPONS = [
  { key: "38", name: ".38" },
  { key: "heavy-pistol", name: "1922" },
  { key: "assault-rifle", name: "KZ-59" },
  ...OWN_WORDS.map((w, i) => ({ key: `kz-variant-${i}`, name: `${w} KZ-59` })),
  { key: "knife", name: "Knife" },
  { key: "hunting-knife", name: "Hunting Knife" },
  { key: "switch-knife", name: "Switch Knife" },
  { key: "flight-knife", name: "Flight Knife" },
  ...Array.from({ length: 168 }, (_, i) => ({ key: `filler-${i}`, name: `Filler ${String(i).padStart(3, "0")}` })),
];

describe("R-710 picker matching", () => {
  it("normalises case and accents", () => {
    expect(normalizeForPicker("KNÍFE")).toBe("knife");
  });
  it("F3-20: an empty query lists everything A→Z, 150 rows + '<rest> more: keep typing'", () => {
    const r = pickerResults("", WEAPONS);
    expect(WEAPONS.length).toBe(181);
    expect(r.rows).toHaveLength(PICKER_MAX_ROWS);
    expect(r.rows[0].name).toBe(".38");
    expect(r.moreText).toBe("31 more: keep typing");
  });
  it("F3-21 'KNIFE' and F3-25b 'knífe': every Knife, no more-row", () => {
    for (const q of ["KNIFE", "knífe"]) {
      const r = pickerResults(q, WEAPONS);
      expect(r.rows.map((x) => x.name)).toEqual(["Flight Knife", "Hunting Knife", "Knife", "Switch Knife"]);
      expect(r.moreText).toBeNull();
    }
  });
  it("F3-23 '59 kz': words in any order, substring", () => {
    const r = pickerResults("59 kz", WEAPONS);
    expect(r.total).toBe(7);
    expect(r.rows.every((x) => x.name.includes("KZ-59"))).toBe(true);
  });
  it("F3-22 'zzqx' → No match", () => {
    const r = pickerResults("zzqx", WEAPONS);
    expect(r.noMatch).toBe(true);
    expect(r.rows).toHaveLength(0);
  });
  it("items already in the comparison are not offered", () => {
    expect(pickerResults(".38", WEAPONS).rows).toHaveLength(1);
    expect(pickerResults(".38", WEAPONS, ["38"]).rows).toHaveLength(0);
  });
});

describe("R-711 keys", () => {
  it("F3-24: down, up, up wraps to the last", () => {
    let i = 0; // first highlighted on open
    i = wrapIndex(i, 1, 4);
    expect(i).toBe(1);
    i = wrapIndex(i, -1, 4);
    expect(i).toBe(0);
    i = wrapIndex(i, -1, 4);
    expect(i).toBe(3);
    expect(wrapIndex(3, 1, 4)).toBe(0);
    expect(wrapIndex(-1, 1, 4)).toBe(0);
    expect(wrapIndex(0, 1, 0)).toBe(-1);
  });
});

describe("R-712 picking navigates", () => {
  it("F3-26: the empty page uses <type>1 on the comparison path", () => {
    const t = slotTarget("weapon", [], "/gta-6/weapons/comparison/", "/gta-6/weapons/comparison/");
    expect(pickHref(t.url, t.param, "38")).toBe("/gta-6/weapons/comparison/?weapon1=38");
  });
  it("a filled page appends <type><count+1> to the canonical URL", () => {
    const canonical = "/gta-6/vehicles/comparison/?vehicle1=banshee&vehicle2=dodo";
    const t = slotTarget("vehicle", ["banshee", "dodo"], canonical, "/gta-6/vehicles/comparison/");
    expect(pickHref(t.url, t.param, "maverick")).toBe(`${canonical}&vehicle3=maverick`);
  });
});
