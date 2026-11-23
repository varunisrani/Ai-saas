import { describe, expect, it } from "vitest";
import { chooseInitialHash, listMemoryKey, shouldWriteListMemory } from "./list-memory";

const DEFAULTS = "#sort=attr.ct6.frontend_value&sortdir=desc";
const SUPER = "#sort=attr.ct6.frontend_value&sortdir=desc&attr.ct1.value=super&page=1";

describe("R-530 memory key", () => {
  it("F1-01 / F1-W01 keys", () => {
    expect(listMemoryKey("/gta-6/vehicles/")).toBe("jamg-hash:/gta-6/vehicles/");
    expect(listMemoryKey("/gta-6/weapons/")).toBe("jamg-hash:/gta-6/weapons/");
  });
  it("is not written while leaving after a link click", () => {
    expect(shouldWriteListMemory(true)).toBe(false);
    expect(shouldWriteListMemory(false)).toBe(true);
  });
});

describe("R-531 initial hash choice", () => {
  it("F1-32 Back restores the saved hash when it differs from the URL's", () => {
    expect(chooseInitialHash("back_forward", "", SUPER, DEFAULTS)).toEqual({ hash: SUPER, restored: true });
    expect(chooseInitialHash("back_forward", SUPER, SUPER, DEFAULTS)).toEqual({ hash: SUPER, restored: false });
  });
  it("F1-33 a plain visit to the bare list URL starts from the defaults", () => {
    expect(chooseInitialHash("navigate", "", SUPER, DEFAULTS)).toEqual({ hash: DEFAULTS, restored: false });
    expect(chooseInitialHash("navigate", "#", SUPER, DEFAULTS)).toEqual({ hash: DEFAULTS, restored: false });
  });
  it("F1-28 / F1-29 a link or reload with a hash keeps the URL hash", () => {
    const link = "#sort=name&sortdir=asc&attr.ct1.value=super";
    expect(chooseInitialHash("navigate", link, null, DEFAULTS).hash).toBe(link);
    expect(chooseInitialHash("reload", SUPER, DEFAULTS, DEFAULTS).hash).toBe(SUPER);
  });
});
