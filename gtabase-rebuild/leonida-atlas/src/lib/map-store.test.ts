import { describe, expect, it } from "vitest";
import {
  categoryCounter,
  mapFilterRecord,
  mapViewRecord,
  multiSpawnGroup,
  noticeClosedValue,
  noticeVisible,
  readFoundIds,
  readMapFilter,
  restoreMapView,
  setMapFound,
  MAP_VIEW_MAX_AGE_MS,
} from "./map-store";
import { ATMS, CATEGORY_ORDER, F4, HIDDEN_BY_DEFAULT, SAFEHOUSES, WRATH, groupOf } from "./map-fixtures.test-helpers";

const base = { categoryOrder: CATEGORY_ORDER, hiddenByDefault: HIDDEN_BY_DEFAULT };
const ALL = new Set(CATEGORY_ORDER);
const offWhenOnly = (...on: string[]) => CATEGORY_ORDER.filter((id) => !on.includes(id));

describe("R-820 filter memory record", () => {
  it("102 categories in config order", () => {
    expect(CATEGORY_ORDER).toHaveLength(102);
  });
  it("defaults → remove the key (F4-01 nothing written)", () => {
    expect(mapFilterRecord({ ...base, off: HIDDEN_BY_DEFAULT })).toBeNull();
    expect(mapFilterRecord({ ...base, off: [...HIDDEN_BY_DEFAULT].reverse() })).toBeNull();
  });
  it("F4-03 Hide all: every id in config order", () => {
    expect(mapFilterRecord({ ...base, off: ALL })).toBe(F4.find((v) => v.id === "F4-03")!.expect["local:gtab-map-filter"]);
  });
  it("F4-04 Show all → {hidden:[]}", () => {
    expect(mapFilterRecord({ ...base, off: [] })).toBe('{"hidden":[],"dv":1}');
  });
  it("F4-05 Banks off", () => {
    expect(mapFilterRecord({ ...base, off: ["atm", "bank", ...HIDDEN_BY_DEFAULT] })).toBe(
      '{"hidden":["bank","bus-stop","ev-charger","gas-station","atm"],"dv":1}',
    );
  });
  it("F4-07 Robberies group off", () => {
    const robberies = CATEGORY_ORDER.filter((id) => groupOf(id) === "robberies");
    expect(mapFilterRecord({ ...base, off: [...HIDDEN_BY_DEFAULT, ...robberies] })).toBe(
      F4.find((v) => v.id === "F4-07")!.expect["local:gtab-map-filter"],
    );
  });
  it("F4-09 folded group; F4-26 hideFound; F4-67 / F4-69 sidebar — key order hidden, folded, sidebar, hideFound, dv", () => {
    expect(mapFilterRecord({ ...base, off: HIDDEN_BY_DEFAULT, folded: ["robberies"] })).toBe(
      '{"hidden":["bus-stop","ev-charger","gas-station","atm"],"folded":["robberies"],"dv":1}',
    );
    expect(mapFilterRecord({ ...base, off: HIDDEN_BY_DEFAULT, hideFound: true })).toBe(
      '{"hidden":["bus-stop","ev-charger","gas-station","atm"],"hideFound":true,"dv":1}',
    );
    expect(mapFilterRecord({ ...base, off: HIDDEN_BY_DEFAULT, sidebar: "closed" })).toBe(
      '{"hidden":["bus-stop","ev-charger","gas-station","atm"],"sidebar":"closed","dv":1}',
    );
    expect(mapFilterRecord({ ...base, off: HIDDEN_BY_DEFAULT, sidebar: "open" })).toBe(
      '{"hidden":["bus-stop","ev-charger","gas-station","atm"],"sidebar":"open","dv":1}',
    );
    expect(mapFilterRecord({ ...base, off: [], folded: ["a"], sidebar: "open", hideFound: true })).toBe(
      '{"hidden":[],"folded":["a"],"sidebar":"open","hideFound":true,"dv":1}',
    );
  });
  it("F4-11 / F4-13 only Garages; F4-14 Garages + Banks; F4-57 only Safehouses", () => {
    const get = (id: string) => F4.find((v) => v.id === id)!.expect["local:gtab-map-filter"];
    expect(mapFilterRecord({ ...base, off: offWhenOnly("garage") })).toBe(get("F4-11"));
    expect(mapFilterRecord({ ...base, off: offWhenOnly("garage") })).toBe(get("F4-13"));
    expect(mapFilterRecord({ ...base, off: offWhenOnly("garage", "bank") })).toBe(get("F4-14"));
    expect(mapFilterRecord({ ...base, off: offWhenOnly("safehouse") })).toBe(get("F4-57"));
  });
  it("F4-25 opening an ATM marker switches ATMs on", () => {
    expect(mapFilterRecord({ ...base, off: ["bus-stop", "ev-charger", "gas-station"] })).toBe(
      '{"hidden":["bus-stop","ev-charger","gas-station"],"dv":1}',
    );
  });
  it("only categories with markers are listed", () => {
    expect(mapFilterRecord({ ...base, off: [...HIDDEN_BY_DEFAULT, "no-markers-category"] })).toBeNull();
  });
  it("R-821 every recorded record round-trips through readMapFilter", () => {
    const records = F4.map((v) => v.expect["local:gtab-map-filter"]).filter((r): r is string => typeof r === "string");
    expect(records.length).toBeGreaterThan(10);
    for (const r of records) {
      const s = readMapFilter(r)!;
      expect(mapFilterRecord({ ...base, off: s.hidden, folded: s.folded, sidebar: s.sidebar, hideFound: s.hideFound })).toBe(r);
    }
    expect(readMapFilter("{nope")).toBeNull();
    expect(readMapFilter('{"dv":1}')).toBeNull();
  });
});

describe("R-828 / R-829 found ticks", () => {
  it("F4-21 tick → {gta6-map:[id]}; F4-23 untick → remove the key (never {})", () => {
    const ticked = setMapFound(null, ["safehouse-001"], true);
    expect(ticked).toBe('{"gta6-map":["safehouse-001"]}');
    expect(readFoundIds(ticked)).toEqual(["safehouse-001"]);
    expect(setMapFound(ticked, ["safehouse-001"], false)).toBeNull();
  });
  it("F5-37 / R-830 other lists are kept", () => {
    const raw = '{"gta6-missions":["7285"]}';
    const ticked = setMapFound(raw, ["atm-001"], true);
    expect(ticked).toBe('{"gta6-missions":["7285"],"gta6-map":["atm-001"]}');
    expect(setMapFound(ticked, ["atm-001"], false)).toBe(raw);
  });
  it("F4-24 multi-spawn: clicked id first, then same-name markers in list order", () => {
    const group = multiSpawnGroup(WRATH, "card-liberty-city-wrath-001");
    expect(group).toEqual(["card-liberty-city-wrath-001", "card-liberty-city-wrath-013"]);
    expect(setMapFound(null, group, true)).toBe('{"gta6-map":["card-liberty-city-wrath-001","card-liberty-city-wrath-013"]}');
    expect(multiSpawnGroup(WRATH, "card-liberty-city-wrath-013")).toEqual(["card-liberty-city-wrath-013", "card-liberty-city-wrath-001"]);
    expect(multiSpawnGroup(WRATH, "nope")).toEqual(["nope"]);
  });
  it("unreadable JSON is treated as empty", () => {
    expect(readFoundIds("{x")).toEqual([]);
    expect(setMapFound("{x", ["a"], true)).toBe('{"gta6-map":["a"]}');
  });
});

describe("R-811 / R-411 counters", () => {
  it("trackable: 'found f / n' (reads f/n) + sr text + tooltip", () => {
    const c = categoryCounter(SAFEHOUSES, ["safehouse-001"], "safehouse", true);
    expect(c).toEqual({
      text: "found 1 / 5",
      found: 1,
      total: 5,
      srText: "found 1 of 5",
      tooltip: "Found so far, out of all markers of this category",
      ariaHidden: true,
    });
  });
  it("F4-24 multi-spawn counts distinct names: '1/9'", () => {
    const c = categoryCounter(WRATH, ["card-liberty-city-wrath-001", "card-liberty-city-wrath-013"], "card-liberty-city-wrath", true, true);
    expect(`${c.found}/${c.total}`).toBe("1/9");
  });
  it("non-trackable '<n>' with its tooltip; switched off → empty text", () => {
    const c = categoryCounter(ATMS, [], "atm", false);
    expect(c.text).toBe("30");
    expect(c.tooltip).toBe("Markers in this category");
    expect(c.srText).toBeNull();
    expect(c.ariaHidden).toBe(false);
    expect(categoryCounter(ATMS, [], "atm", false, false, false).text).toBe("");
    expect(categoryCounter(SAFEHOUSES, [], "safehouse", true, false, false).text).toBe("");
  });
});

describe("R-840 view memory", () => {
  it("F4-58 one zoom-in from the start view", () => {
    const rec = mapViewRecord({ x: -2352, y: -5532 }, 3, 1795430000000);
    expect(rec.replace(/"t":\d+/, '"t":0')).toBe('{"lat":-5532,"lng":-2352,"z":3,"t":0}');
    expect(mapViewRecord({ x: 10.04, y: -0.04 }, 4, 1)).toBe('{"lat":0,"lng":10,"z":4,"t":1}');
    expect(mapViewRecord({ x: 1.26, y: 2.35 }, 4, 1)).toBe('{"lat":2.4,"lng":1.3,"z":4,"t":1}');
  });
  it("restores a young view inside the bounds; clamps zoom; else start view", () => {
    const now = 1_800_000_000_000;
    const rec = mapViewRecord({ x: -2352, y: -5532 }, 3, now - 1000);
    expect(restoreMapView(rec, now)).toEqual({ center: { x: -2352, y: -5532 }, zoom: 3 });
    expect(restoreMapView(mapViewRecord({ x: 0, y: 0 }, 12, now), now)!.zoom).toBe(8);
    expect(restoreMapView(mapViewRecord({ x: 0, y: 0 }, 3, now - MAP_VIEW_MAX_AGE_MS), now)).toBeNull();
    expect(restoreMapView(mapViewRecord({ x: 9000, y: 0 }, 3, now), now)).toBeNull();
    expect(restoreMapView("{bad", now)).toBeNull();
    expect(restoreMapView('{"lat":"1","lng":2,"z":3,"t":4}', now)).toBeNull();
  });
});

describe("R-846 notice", () => {
  it("closed value and visibility window (R-1612)", () => {
    expect(noticeClosedValue("2026-11-01", "2027-12-31")).toBe("2026-11-01|2027-12-31|on");
    const now = Date.parse("2026-11-23T12:00:00Z");
    expect(noticeVisible(now, "2026-11-01", "2027-12-31", null)).toBe(true);
    expect(noticeVisible(now, "2026-11-01", "2027-12-31", "2026-11-01|2027-12-31|on")).toBe(false);
    expect(noticeVisible(now, "2026-11-01", "2027-12-31", "2025-01-01|2025-12-31|on")).toBe(true);
    expect(noticeVisible(Date.parse("2026-10-31T23:59:59Z"), "2026-11-01", "2027-12-31", null)).toBe(false);
    expect(noticeVisible(Date.parse("2027-12-31T23:59:59Z"), "2026-11-01", "2027-12-31", null)).toBe(true);
    expect(noticeVisible(Date.parse("2028-01-01T00:00:00Z"), "2026-11-01", "2027-12-31", null)).toBe(false);
  });
});
