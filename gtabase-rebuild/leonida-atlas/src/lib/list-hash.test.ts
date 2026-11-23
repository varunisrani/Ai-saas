import { describe, expect, it } from "vitest";
import {
  applyFilterChange,
  applySortChange,
  defaultListHash,
  effectiveSort,
  initialListHash,
  normalizeListHashOnLoad,
  parseListHash,
  serializeListHash,
  type HashPair,
  listRulesFromConfig,
  validOptionsFromConfig,
} from "./list-hash";
import { VEHICLE_OPTIONS, VEHICLE_RULES, WEAPON_OPTIONS, WEAPON_RULES } from "./test-fixtures";

const V_DEFAULT = "#sort=attr.ct6.frontend_value&sortdir=desc";
const W_DEFAULT = "#sort=name&sortdir=asc";

function filterChange(hash: string, values: Record<string, string | string[]>, rules = VEHICLE_RULES): string {
  return serializeListHash(applyFilterChange(parseListHash(hash), values, rules));
}

describe("R-505 defaults written on a plain visit", () => {
  it("F1-01 vehicles / F1-W01 weapons", () => {
    expect(defaultListHash(VEHICLE_RULES)).toBe(V_DEFAULT);
    expect(initialListHash("", VEHICLE_RULES, VEHICLE_OPTIONS).hash).toBe(V_DEFAULT);
    expect(initialListHash("", WEAPON_RULES, WEAPON_OPTIONS).hash).toBe(W_DEFAULT);
    expect(initialListHash("#", WEAPON_RULES, WEAPON_OPTIONS).hash).toBe(W_DEFAULT);
  });
});

describe("R-525 serialisation (URI-component encoding)", () => {
  it.each([
    ["an", "#sort=attr.ct6.frontend_value&sortdir=desc&name=an&page=1"], // F1-04
    ["AN", "#sort=attr.ct6.frontend_value&sortdir=desc&name=AN&page=1"], // F1-05
    [" an", "#sort=attr.ct6.frontend_value&sortdir=desc&name=%20an&page=1"], // F1-06
    ["an ", "#sort=attr.ct6.frontend_value&sortdir=desc&name=an%20&page=1"], // F1-41
    ["zzqqzz", "#sort=attr.ct6.frontend_value&sortdir=desc&name=zzqqzz&page=1"], // F1-07
    ["án", "#sort=attr.ct6.frontend_value&sortdir=desc&name=%C3%A1n&page=1"], // F1-08
    ["<b>x</b>", "#sort=attr.ct6.frontend_value&sortdir=desc&name=%3Cb%3Ex%3C%2Fb%3E&page=1"], // F1-43
  ])("name filter %j", (query, expected) => {
    expect(filterChange(V_DEFAULT, { name: query })).toBe(expected);
  });

  it("F1-09 / F1-10 real-life filter", () => {
    expect(filterChange(V_DEFAULT, { "attr.ct72.value": "huracan" })).toBe(
      "#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct72.value=huracan&page=1",
    );
    expect(filterChange(V_DEFAULT, { "attr.ct72.value": "Huracán" })).toBe(
      "#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct72.value=Hurac%C3%A1n&page=1",
    );
  });

  it("F1-42 a 128-character query is written as is", () => {
    const q = "x".repeat(128);
    expect(filterChange(V_DEFAULT, { name: q })).toBe(`${V_DEFAULT}&name=${q}&page=1`);
  });

  it("multi values are joined with ',' before encoding and page is last", () => {
    expect(serializeListHash([["page", "3"], ["attr.ct1.value", ["super", "sports"]], ["sort", "name"]])).toBe(
      "#attr.ct1.value=super%2Csports&sort=name&page=3",
    );
    expect(serializeListHash([])).toBe("");
  });
});

describe("R-510/R-527 tile and dropdown filter changes", () => {
  it("F1-13..F1-16 super, switch to sports, ctrl-add super, remove super", () => {
    expect(filterChange(V_DEFAULT, { "attr.ct1.value": ["super"] })).toBe(`${V_DEFAULT}&attr.ct1.value=super&page=1`);
    const afterSports = filterChange(`${V_DEFAULT}&attr.ct1.value=super&page=1`, { "attr.ct1.value": ["sports"] });
    expect(afterSports).toBe(`${V_DEFAULT}&attr.ct1.value=sports&page=1`);
    const both = filterChange(afterSports, { "attr.ct1.value": ["sports", "super"] });
    expect(both).toBe(`${V_DEFAULT}&attr.ct1.value=sports%2Csuper&page=1`);
    expect(filterChange(both, { "attr.ct1.value": ["sports"] })).toBe(`${V_DEFAULT}&attr.ct1.value=sports&page=1`);
  });

  it("F1-17 / F1-18 hide standouts then Super: present key updated in place, new key appended before page", () => {
    const h1 = filterChange(V_DEFAULT, { "attr.ct734.value": "hide-standouts" });
    expect(h1).toBe(`${V_DEFAULT}&attr.ct734.value=hide-standouts&page=1`);
    const h2 = filterChange(h1, { "attr.ct734.value": "hide-standouts", "attr.ct1.value": ["super"] });
    expect(h2).toBe("#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct734.value=hide-standouts&attr.ct1.value=super&page=1");
  });

  it("F1-19 / F1-21 / F1-W05 dropdown values", () => {
    expect(filterChange(V_DEFAULT, { "attr.ct734.value": "all-terrain" })).toBe(`${V_DEFAULT}&attr.ct734.value=all-terrain&page=1`);
    expect(filterChange(V_DEFAULT, { "attr.ct2.value": "ubermacht" })).toBe(`${V_DEFAULT}&attr.ct2.value=ubermacht&page=1`);
    expect(filterChange(W_DEFAULT, { "attr.ct246.value": "unique-variant" }, WEAPON_RULES)).toBe(
      `${W_DEFAULT}&attr.ct246.value=unique-variant&page=1`,
    );
  });

  it("F1-W02..F1-W04 weapon tiles", () => {
    expect(filterChange(W_DEFAULT, { "attr.ct55.value": ["handguns"] }, WEAPON_RULES)).toBe(`${W_DEFAULT}&attr.ct55.value=handguns&page=1`);
    expect(filterChange(W_DEFAULT, { "attr.ct55.value": ["shotguns", "handguns"] }, WEAPON_RULES)).toBe(
      `${W_DEFAULT}&attr.ct55.value=shotguns%2Chandguns&page=1`,
    );
  });

  it("F1-34 / F1-W16 Clear Filters removes every filter key and writes page=1", () => {
    const filled = `${V_DEFAULT}&attr.ct1.value=super&name=a&attr.ct734.value=hide-standouts&page=1`;
    expect(filterChange(filled, { name: "", "attr.ct1.value": [], "attr.ct734.value": "" })).toBe(`${V_DEFAULT}&page=1`);
    expect(filterChange(`${W_DEFAULT}&attr.ct55.value=melee&page=1`, {}, WEAPON_RULES)).toBe(`${W_DEFAULT}&page=1`);
  });
});

describe("R-528 sort changes are in place and add no page", () => {
  const sort = (hash: string, field: string, dir: "asc" | "desc") => serializeListHash(applySortChange(parseListHash(hash), field, dir));
  it("F1-22 / F1-23 / F1-24 / F1-27", () => {
    expect(sort(V_DEFAULT, "name", "desc")).toBe("#sort=name&sortdir=desc");
    expect(sort("#sort=name&sortdir=desc", "name", "asc")).toBe("#sort=name&sortdir=asc");
    expect(sort(V_DEFAULT, "attr.ct6.frontend_value", "asc")).toBe("#sort=attr.ct6.frontend_value&sortdir=asc");
    expect(sort(V_DEFAULT, "attr.ct1.frontend_value", "asc")).toBe("#sort=attr.ct1.frontend_value&sortdir=asc");
  });
  it("F1-26 / F1-37 / F1-W07 keep the filter keys and the page", () => {
    expect(sort(`${V_DEFAULT}&attr.ct1.value=sports&page=1`, "attr.ct6.frontend_value", "asc")).toBe(
      "#sort=attr.ct6.frontend_value&sortdir=asc&attr.ct1.value=sports&page=1",
    );
    expect(sort(`${V_DEFAULT}&attr.ct1.value=super&page=1`, "name", "desc")).toBe("#sort=name&sortdir=desc&attr.ct1.value=super&page=1");
    expect(sort(`${W_DEFAULT}&attr.ct55.value=handguns&page=1`, "attr.ct58.frontend_value", "desc")).toBe(
      "#sort=attr.ct58.frontend_value&sortdir=desc&attr.ct55.value=handguns&page=1",
    );
  });
});

describe("R-526 / R-522 load normalisation", () => {
  it("F1-28 a valid filter from the link rewrites with page=1", () => {
    const r = initialListHash("#sort=name&sortdir=asc&attr.ct1.value=super", VEHICLE_RULES, VEHICLE_OPTIONS);
    expect(r.hash).toBe("#sort=name&sortdir=asc&attr.ct1.value=super&page=1");
    expect(r.state["attr.ct1.value"]).toEqual(["super"]);
    expect(r.sort).toEqual({ key: "name", dir: "asc", known: true });
  });

  it("F1-30 defaults appended after the link's pairs, then page=1", () => {
    const r = initialListHash("#attr.ct1.value=super,sports&attr.ct734.value=hide-standouts", VEHICLE_RULES, VEHICLE_OPTIONS);
    expect(r.hash).toBe(
      "#attr.ct1.value=super%2Csports&attr.ct734.value=hide-standouts&sort=attr.ct6.frontend_value&sortdir=desc&page=1",
    );
    expect(r.state).toEqual({ "attr.ct1.value": ["super", "sports"], "attr.ct734.value": "hide-standouts" });
  });

  it("F1-31 unknown sort kept, bad direction → asc, unknown filter value ignored but kept, page kept", () => {
    const r = initialListHash("#sort=bogus&sortdir=sideways&attr.ct1.value=nonexistent&page=3", VEHICLE_RULES, VEHICLE_OPTIONS);
    expect(r.hash).toBe("#sort=bogus&sortdir=asc&attr.ct1.value=nonexistent&page=3");
    expect(r.applied).toBe(false);
    expect(r.state).toEqual({});
    expect(r.sort).toEqual({ key: "name", dir: "asc", known: false });
  });

  it("F1-44 a page key without filters is kept unchanged (D-011)", () => {
    expect(initialListHash("#sort=name&sortdir=asc&page=2", VEHICLE_RULES, VEHICLE_OPTIONS).hash).toBe("#sort=name&sortdir=asc&page=2");
  });

  it("F1-W12 weapon tiles + sort from the link", () => {
    const r = initialListHash("#attr.ct55.value=handguns,shotguns&sort=attr.ct58.frontend_value&sortdir=desc", WEAPON_RULES, WEAPON_OPTIONS);
    expect(r.hash).toBe("#attr.ct55.value=handguns%2Cshotguns&sort=attr.ct58.frontend_value&sortdir=desc&page=1");
  });

  it("reports validity per filter key and keeps unknown keys", () => {
    const n = normalizeListHashOnLoad(parseListHash("#foo=bar&attr.ct2.value=nobody&name=an"), VEHICLE_RULES, VEHICLE_OPTIONS);
    expect(n.valid).toEqual({ "attr.ct2.value": false, name: true });
    expect(n.applied).toBe(true);
    expect(n.pairs).toEqual([
      ["foo", "bar"],
      ["attr.ct2.value", "nobody"],
      ["name", "an"],
      ["sort", "attr.ct6.frontend_value"],
      ["sortdir", "desc"],
    ]);
  });
});

describe("parseListHash edge cases (19.2)", () => {
  it("empty hash, duplicate keys (first wins), '=' inside a piece, decoding", () => {
    expect(parseListHash("")).toEqual([]);
    expect(parseListHash("#")).toEqual([]);
    expect(parseListHash("#sort=name&sort=attr.ct6.frontend_value")).toEqual([["sort", "name"]]);
    expect(parseListHash("#name=a=b&sortdir=asc&junk&=x")).toEqual([["sortdir", "asc"]]);
    expect(parseListHash("#name=%3Cb%3Ex%3C%2Fb%3E&x=%E0%A4%A")).toEqual<HashPair[]>([
      ["name", "<b>x</b>"],
      ["x", "%E0%A4%A"],
    ]);
  });
  it("effectiveSort without pairs uses the defaults", () => {
    expect(effectiveSort([], WEAPON_RULES)).toEqual({ key: "name", dir: "asc", known: true });
  });
});

describe("adapter from the data module's list config", () => {
  it("maps hash keys, kinds, fields, defaults and valid options", () => {
    const config = {
      filters: [
        { hashKey: "name", kind: "text", field: "name" },
        { hashKey: "attr.ct1.value", kind: "tiles", field: "classIds", options: [{ value: "super" }, { value: "sports" }] },
        { hashKey: "attr.ct2.value", kind: "dropdown-search", field: "makeId", options: [{ value: "ubermacht" }] },
        { hashKey: "attr.ct246.value", kind: "dropdown", field: "weaponType", options: [{ value: "base-weapon" }] },
      ],
      sortFields: [
        { hashKey: "name", field: "name", label: "Vehicle Name" },
        { hashKey: "attr.ct6.frontend_value", field: "speed", label: "Speed" },
      ],
      defaultSort: { hashKey: "attr.ct6.frontend_value", direction: "desc" as const },
    };
    const rules = listRulesFromConfig(config);
    expect(rules.filters.map((f) => f.kind)).toEqual(["text", "tiles", "dropdown", "dropdown"]);
    expect(rules.defaultSort).toBe("attr.ct6.frontend_value");
    expect(rules.defaultDir).toBe("desc");
    const valid = validOptionsFromConfig(config);
    expect(valid).toEqual({ "attr.ct1.value": ["super", "sports"], "attr.ct2.value": ["ubermacht"], "attr.ct246.value": ["base-weapon"] });
    expect(initialListHash("#attr.ct2.value=ubermacht", rules, valid).hash).toBe(
      "#attr.ct2.value=ubermacht&sort=attr.ct6.frontend_value&sortdir=desc&page=1",
    );
  });
});
