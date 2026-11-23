import { describe, expect, it } from "vitest";
import {
  FAVORITES_KEY,
  favoriteButtonState,
  favoriteItemKey,
  isFavorite,
  readFavorites,
  recentFavorites,
  toggleFavorite,
} from "./favorites";

describe("R-1403 storage (HYPOTHESIS, D-002)", () => {
  it("key and shape: items and map markers in the order added", () => {
    expect(FAVORITES_KEY).toBe("atlas-favorites");
    let raw = toggleFavorite(null, "gta-6", favoriteItemKey("vehicles", "sunset-sanchez"));
    expect(raw).toBe('{"gta-6":["vehicles/sunset-sanchez"]}');
    raw = toggleFavorite(raw, "gta6-map", "garage-003");
    raw = toggleFavorite(raw, "gta-6", "weapons/assault-rifle");
    expect(raw).toBe('{"gta-6":["vehicles/sunset-sanchez","weapons/assault-rifle"],"gta6-map":["garage-003"]}');
    expect(isFavorite(raw, "gta6-map", "garage-003")).toBe(true);
  });
  it("removing deletes the entry; an emptied list is removed; an emptied object removes the key", () => {
    const raw = '{"gta-6":["vehicles/sunset-sanchez"],"gta6-map":["garage-003"]}';
    const afterMap = toggleFavorite(raw, "gta6-map", "garage-003");
    expect(afterMap).toBe('{"gta-6":["vehicles/sunset-sanchez"]}');
    expect(toggleFavorite(afterMap, "gta-6", "vehicles/sunset-sanchez")).toBeNull();
  });
  it("unreadable JSON counts as empty", () => {
    expect(readFavorites("{x")).toEqual({});
    expect(readFavorites('{"gta-6":"x","gta6-map":["a",1]}')).toEqual({ "gta6-map": ["a"] });
    expect(toggleFavorite("{x", "gta-6", "animals/gray-fox")).toBe('{"gta-6":["animals/gray-fox"]}');
  });
});

describe("R-1402 / R-1405 button and recent block", () => {
  it("button texts", () => {
    expect(favoriteButtonState(false)).toEqual({ text: "Add To Favorites", pressed: false }); // F10-01
    expect(favoriteButtonState(true)).toEqual({ text: "Favorited", pressed: true });
  });
  it("up to 10 most recent, map markers linking to the map", () => {
    const raw = JSON.stringify({ "gta-6": Array.from({ length: 12 }, (_, i) => `vehicles/v${i}`), "gta6-map": ["garage-003"] });
    const recent = recentFavorites(raw);
    expect(recent).toHaveLength(10);
    expect(recent[0]).toEqual({ listKey: "gta6-map", key: "garage-003", href: "/gta-6/map/#garage-003" });
    expect(recent[1]).toEqual({ listKey: "gta-6", key: "vehicles/v11", href: "/gta-6/vehicles/v11" });
    expect(recentFavorites(null)).toEqual([]);
  });
});
