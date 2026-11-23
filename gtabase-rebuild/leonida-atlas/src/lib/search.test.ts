import { describe, expect, it } from "vitest";
import { SEARCH_EMPTY_MESSAGE, localSearch, searchHref } from "./search";

const DOCS = [
  { type: "vehicle", title: "Banshee", path: "/gta-6/vehicles/banshee" },
  { type: "vehicle", title: "Andrew Node's Thrax", path: "/gta-6/vehicles/andrew-nodes-thrax" },
  { type: "map-category", title: "Banks", path: "/gta-6/map/?feature=bank" },
  { type: "hub", title: "Vice City Guide", path: "/gta-6/map-locations/" },
  { type: "article", title: "How to Find and Use ATMs in GTA 6", extra: "ATM Guide", path: "/gta-6/articles/a", date: "2026-11-22T20:00:00Z" },
  { type: "article", title: "GTA 6 Controls Guide: Full PS5 & Xbox Button Layout", extra: "GTA 6 Controls Guide", path: "/articles/gta-6/b", date: "2026-11-01T00:00:00Z" },
  { type: "article", title: "Vice City Café Tour", extra: "Café", path: "/gta-6/articles/c", date: "2026-11-22T21:00:00Z" },
  { type: "character", title: "Jason Duval", path: "/gta-6/characters/jason" },
  ...Array.from({ length: 25 }, (_, i) => ({ type: "weapon", title: `Pistol Mk ${i}`, path: `/gta-6/weapons/p${i}` })),
];

describe("R-1308 local search (D-003)", () => {
  it("empty q → the empty message", () => {
    expect(localSearch("   ", DOCS)).toEqual({ groups: [], total: 0, message: SEARCH_EMPTY_MESSAGE });
    expect(SEARCH_EMPTY_MESSAGE).toBe("Type a word to search Leonida Atlas.");
  });
  it("no result", () => {
    expect(localSearch("grotti cheetah", DOCS).message).toBe("No results for “grotti cheetah”.");
  });
  it("lower-cased, accent-stripped, every word in the title; grouped in the fixed order", () => {
    const r = localSearch("VICE cafe", DOCS);
    expect(r.total).toBe(1);
    expect(r.groups.map((g) => g.type)).toEqual(["article"]);
    const vice = localSearch("vice", DOCS);
    expect(vice.groups.map((g) => g.type)).toEqual(["hub", "article"]);
    expect(vice.message).toBe("2 results for “vice”");
    expect(localSearch("ban", DOCS).groups.map((g) => g.type)).toEqual(["vehicle", "map-category"]);
  });
  it("articles also match their short title and are newest first", () => {
    const r = localSearch("guide", DOCS);
    expect(r.groups.map((g) => g.type)).toEqual(["hub", "article"]);
    expect(r.groups[1].items.map((d) => d.path)).toEqual(["/gta-6/articles/a", "/articles/gta-6/b"]);
    expect(localSearch("jason", DOCS).message).toBe("1 result for “jason”");
  });
  it("at most 20 links per group, A→Z (natural order)", () => {
    const r = localSearch("pistol", DOCS);
    expect(r.total).toBe(25);
    expect(r.groups[0].items).toHaveLength(20);
    expect(r.groups[0].total).toBe(25);
    expect(r.groups[0].items.slice(0, 3).map((d) => d.title)).toEqual(["Pistol Mk 0", "Pistol Mk 1", "Pistol Mk 2"]);
    expect(r.message).toBe("25 results for “pistol”");
  });
});

describe("R-1307 / R-1315 search URLs (form encoding)", () => {
  it("spaces as '+', nothing trimmed, empty allowed", () => {
    expect(searchHref("grotti cheetah")).toBe("/search?q=grotti+cheetah");
    expect(searchHref("GTA Series")).toBe("/search?q=GTA+Series");
    expect(searchHref("HD Universe")).toBe("/search?q=HD+Universe");
    expect(searchHref("  vice ")).toBe("/search?q=++vice+");
    expect(searchHref("")).toBe("/search?q=");
    expect(searchHref("<b>x</b> café & co")).toBe("/search?q=%3Cb%3Ex%3C%2Fb%3E+caf%C3%A9+%26+co");
  });
});

describe("group labels and the data module's types", () => {
  it("radio stations use type 'radio'; a document typeLabel overrides the default heading", () => {
    const r = localSearch("flash", [
      { type: "radio", title: "Flash FM", path: "/gta-6/radio-stations/flash-fm" },
      { type: "weapon", typeLabel: "GTA 6 Weapons", title: "Flash Grenade", path: "/gta-6/weapons/flash" },
    ]);
    expect(r.groups.map((g) => [g.type, g.label])).toEqual([
      ["weapon", "GTA 6 Weapons"],
      ["radio", "Radio Stations"],
    ]);
  });
});
