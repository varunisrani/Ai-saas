import { describe, expect, it } from "vitest";
import { addTileLabel, isAddModifier, nextPickedTiles } from "./class-tiles";

describe("R-510 class tiles", () => {
  it("F1-13 a plain click with nothing picked picks it", () => {
    expect(nextPickedTiles([], "super", false)).toEqual(["super"]);
  });
  it("F1-14 / F1-W03 a plain click on an unpicked tile switches", () => {
    expect(nextPickedTiles(["super"], "sports", false)).toEqual(["sports"]);
    expect(nextPickedTiles(["handguns"], "shotguns", false)).toEqual(["shotguns"]);
  });
  it("F1-15 / F1-W04 a modifier click adds, keeping pick order", () => {
    expect(nextPickedTiles(["sports"], "super", true)).toEqual(["sports", "super"]);
    expect(nextPickedTiles(["shotguns"], "handguns", true)).toEqual(["shotguns", "handguns"]);
  });
  it("F1-16 a click on a picked tile removes only that tile, with or without modifier", () => {
    expect(nextPickedTiles(["sports", "super"], "super", false)).toEqual(["sports"]);
    expect(nextPickedTiles(["sports", "super"], "sports", true)).toEqual(["super"]);
  });
  it("the '+' button adds without switching (HYPOTHESIS: no change on a picked tile)", () => {
    expect(nextPickedTiles(["sports"], "boats", false, true)).toEqual(["sports", "boats"]);
    expect(nextPickedTiles(["sports"], "sports", false, true)).toEqual(["sports"]);
    expect(addTileLabel("Super")).toBe("Add Super to the selection");
  });
  it("Ctrl, Cmd or Shift count as the add modifier", () => {
    expect(isAddModifier({ ctrlKey: true })).toBe(true);
    expect(isAddModifier({ metaKey: true })).toBe(true);
    expect(isAddModifier({ shiftKey: true })).toBe(true);
    expect(isAddModifier({})).toBe(false);
  });
});
