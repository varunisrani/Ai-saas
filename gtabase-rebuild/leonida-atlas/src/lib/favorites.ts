/**
 * favorites — browser-local favorites (HYPOTHESIS, DIVERGENCE D-002; R-1402..R-1406; key `atlas-favorites`).
 */
import { STORAGE_KEYS } from "./storage";
import { isPlainObject, parseJson, stringArray } from "./text";

export const FAVORITES_KEY = STORAGE_KEYS.favorites;
/** R-1403 list keys: items ("<list>/<slug>") and map markers. */
export const FAVORITE_LISTS = { items: "gta-6", map: "gta6-map" } as const;
/** R-1405 side-column block size. */
export const RECENT_FAVORITES_LIMIT = 10;
/** R-1403 route list names allowed in item keys. */
export const FAVORITE_ITEM_LISTS = [
  "vehicles",
  "weapons",
  "animals",
  "characters",
  "properties",
  "radio-stations",
  "missions",
  "gangs",
  "side-missions",
] as const;

export type Favorites = Record<string, string[]>;

/** Parsed favorites; unreadable JSON → {} (only string arrays are kept, empty lists dropped). */
export function readFavorites(raw: string | null | undefined): Favorites {
  const parsed = parseJson(raw);
  if (!isPlainObject(parsed)) return {};
  const out: Favorites = {};
  for (const [k, v] of Object.entries(parsed)) {
    const list = stringArray(v);
    if (list.length) out[k] = list;
  }
  return out;
}

/** R-1403 item key "<list>/<slug>". */
export function favoriteItemKey(list: string, slug: string): string {
  return `${list}/${slug}`;
}

/**
 * R-1402/R-1403: toggles `key` in `listKey` (appended in the order added, removed when present); an emptied list
 * is removed; an emptied object means "remove the key" (returns null).
 */
export function toggleFavorite(raw: string | null | undefined, listKey: string, key: string): string | null {
  const favs = readFavorites(raw);
  const list = favs[listKey] ? favs[listKey].slice() : [];
  const idx = list.indexOf(key);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(key);
  if (list.length) favs[listKey] = list;
  else delete favs[listKey];
  return Object.keys(favs).length ? JSON.stringify(favs) : null;
}

export function isFavorite(raw: string | null | undefined, listKey: string, key: string): boolean {
  return (readFavorites(raw)[listKey] ?? []).includes(key);
}

export interface RecentFavorite {
  listKey: string;
  key: string;
  /** Default link: map markers "/gta-6/map/#<id>", items "/gta-6/<list>/<slug>" (the UI should prefer the
   * item's canonical path, R-008). */
  href: string;
}

/**
 * R-1405 most recent favorites first, at most `limit`. HYPOTHESIS: the storage shape keeps no cross-list
 * timestamps, so recency is the add order inside each list, with the lists taken in object key order
 * (concatenated, then reversed).
 */
export function recentFavorites(raw: string | null | undefined, limit = RECENT_FAVORITES_LIMIT): RecentFavorite[] {
  const favs = readFavorites(raw);
  const all: RecentFavorite[] = [];
  for (const [listKey, keys] of Object.entries(favs)) {
    for (const key of keys) {
      all.push({
        listKey,
        key,
        href: listKey === FAVORITE_LISTS.map ? `/gta-6/map/#${key}` : `/gta-6/${key}`,
      });
    }
  }
  return all.reverse().slice(0, Math.max(0, limit));
}

/** R-1402 button state: "Favorited" + pressed, or "Add To Favorites". */
export function favoriteButtonState(saved: boolean): { text: string; pressed: boolean } {
  return { text: saved ? "Favorited" : "Add To Favorites", pressed: saved };
}

/** R-1402 note shown after the first save. */
export const FAVORITE_SAVED_NOTE = "Saved in this browser";
