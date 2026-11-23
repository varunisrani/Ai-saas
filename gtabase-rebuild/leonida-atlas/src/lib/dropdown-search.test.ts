import { describe, expect, it } from "vitest";
import {
  dropdownButtonText,
  dropdownHasSearch,
  moveHighlight,
  noResultsText,
  searchDropdownOptions,
  wordStartMatches,
} from "./dropdown-search";

const MAKES = [
  { value: "bravado", label: "Bravado (12)" },
  { value: "maibatsu", label: "Maibatsu (9)" },
  { value: "ubermacht", label: "Übermacht (3)" },
  { value: "western", label: "Western Motor (4)" },
];

describe("R-515 dropdown search", () => {
  it("F1-20 'Uber' matches nothing (no accent folding) → one no-match row", () => {
    expect(wordStartMatches("Übermacht (3)", "Uber")).toBe(false);
    const r = searchDropdownOptions(MAKES, "Uber");
    expect(r.options).toHaveLength(0);
    expect(r.noResults).toBe("No results match Uber");
    expect(r.highlight).toBe(-1);
  });
  it("F1-21 'Über' matches Übermacht and it is highlighted first", () => {
    const r = searchDropdownOptions(MAKES, "Über");
    expect(r.options.map((o) => o.value)).toEqual(["ubermacht"]);
    expect(r.highlight).toBe(0);
    expect(wordStartMatches("Übermacht (3)", "über")).toBe(true);
  });
  it("word starts only, ignoring case", () => {
    expect(wordStartMatches("Western Motor (4)", "mot")).toBe(true);
    expect(wordStartMatches("Western Motor (4)", "otor")).toBe(false);
    expect(wordStartMatches("All-Terrain (12)", "terr")).toBe(true);
    expect(wordStartMatches("Hide Standout Vehicles (319)", "hide stand")).toBe(true);
    expect(wordStartMatches("Anything", "")).toBe(true);
  });
  it("search box only for filter dropdowns with more than 10 options, never for sort", () => {
    expect(dropdownHasSearch(10)).toBe(false);
    expect(dropdownHasSearch(11)).toBe(true);
    expect(dropdownHasSearch(40, true)).toBe(false);
  });
  it("highlight moves with arrows; no-results text; button placeholder", () => {
    expect(moveHighlight(0, 1, 3)).toBe(1);
    expect(moveHighlight(2, 1, 3)).toBe(2);
    expect(moveHighlight(0, -1, 3)).toBe(0);
    expect(moveHighlight(-1, 1, 0)).toBe(-1);
    expect(noResultsText("zz")).toBe("No results match zz");
    expect(dropdownButtonText("Manufacturer", null)).toBe("Select Manufacturer"); // F1-01
    expect(dropdownButtonText("Weapon Type", "")).toBe("Select Weapon Type"); // F1-W01
    expect(dropdownButtonText("Standout Set", "All-Terrain")).toBe("All-Terrain");
  });
});
