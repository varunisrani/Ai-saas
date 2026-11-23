import { afterEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS, createMemoryStorage, safeApply, safeRead, safeRemove, safeWrite, type StorageLike } from "./storage";

const throwing: StorageLike = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("R-1508 storage helpers never throw", () => {
  it("read / write / remove on a working store", () => {
    const s = createMemoryStorage();
    expect(safeRead("k", "local", s)).toBeNull();
    expect(safeWrite("k", "v", "local", s)).toBe(true);
    expect(safeRead("k", "local", s)).toBe("v");
    expect(safeRemove("k", "local", s)).toBe(true);
    expect(safeRead("k", "local", s)).toBeNull();
  });
  it("a throwing store (blocked or full) gives null / false", () => {
    expect(safeRead("k", "local", throwing)).toBeNull();
    expect(safeWrite("k", "v", "session", throwing)).toBe(false);
    expect(safeRemove("k", "session", throwing)).toBe(false);
  });
  it("no window (server rendering) → null / false", () => {
    expect(safeRead("k")).toBeNull();
    expect(safeWrite("k", "v")).toBe(false);
  });
  it("a window whose storage accessor throws → null / false", () => {
    vi.stubGlobal("window", {
      get localStorage(): Storage {
        throw new Error("blocked");
      },
      get sessionStorage(): Storage {
        throw new Error("blocked");
      },
    });
    expect(safeRead("k", "local")).toBeNull();
    expect(safeWrite("k", "v", "session")).toBe(false);
  });
  it("uses window storage areas when present", () => {
    const local = createMemoryStorage();
    const session = createMemoryStorage();
    vi.stubGlobal("window", { localStorage: local, sessionStorage: session });
    safeWrite("a", "1", "local");
    safeWrite("b", "2", "session");
    expect(local.dump()).toEqual({ a: "1" });
    expect(session.dump()).toEqual({ b: "2" });
  });
  it("safeApply writes text or removes the key for null (R-828, R-1403)", () => {
    const s = createMemoryStorage({ [STORAGE_KEYS.guestChecklists]: "{}" });
    safeApply(STORAGE_KEYS.guestChecklists, null, "local", s);
    expect(s.dump()).toEqual({});
    safeApply(STORAGE_KEYS.mapFilter, '{"hidden":[],"dv":1}', "local", s);
    expect(s.dump()).toEqual({ "gtab-map-filter": '{"hidden":[],"dv":1}' });
  });
  it("CD2 key names", () => {
    expect(STORAGE_KEYS).toEqual({
      guestChecklists: "guest_checklists",
      mapFilter: "gtab-map-filter",
      mapView: "gtab-map-view",
      mapNoticeClosed: "gtab-contest-closed",
      favorites: "atlas-favorites",
      listMemoryPrefix: "jamg-hash:",
      comparePrefix: "gtabCompare:",
    });
  });
});
