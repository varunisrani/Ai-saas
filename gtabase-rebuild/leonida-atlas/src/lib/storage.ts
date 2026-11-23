/**
 * storage — thin, never-throwing wrappers around browser storage (R-1508, R-007, U-F5-3).
 *
 * Every function accepts an optional `store` override (any object with the Storage methods) so the
 * rules can be unit-tested without a browser.
 */

export type StorageArea = "local" | "session";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Browser-storage keys of the rebuild (CD2; section 1.2). */
export const STORAGE_KEYS = {
  guestChecklists: "guest_checklists",
  mapFilter: "gtab-map-filter",
  mapView: "gtab-map-view",
  mapNoticeClosed: "gtab-contest-closed",
  favorites: "atlas-favorites",
  listMemoryPrefix: "jamg-hash:",
  comparePrefix: "gtabCompare:",
} as const;

function resolveStore(area: StorageArea, store?: StorageLike | null): StorageLike | null {
  if (store) return store;
  try {
    if (typeof window === "undefined") return null;
    return area === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Reads a value; `null` when absent or when storage is unavailable. Never throws. */
export function safeRead(key: string, area: StorageArea = "local", store?: StorageLike | null): string | null {
  try {
    const s = resolveStore(area, store);
    if (!s) return null;
    return s.getItem(key);
  } catch {
    return null;
  }
}

/** Writes a value; returns false when storage is unavailable or full. Never throws. */
export function safeWrite(key: string, value: string, area: StorageArea = "local", store?: StorageLike | null): boolean {
  try {
    const s = resolveStore(area, store);
    if (!s) return false;
    s.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Removes a key; returns false when storage is unavailable. Never throws. */
export function safeRemove(key: string, area: StorageArea = "local", store?: StorageLike | null): boolean {
  try {
    const s = resolveStore(area, store);
    if (!s) return false;
    s.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Applies the result of a rule that returns "new raw text, or null = remove the key"
 * (map found ticks R-828, map filter R-820, favorites R-1403).
 */
export function safeApply(
  key: string,
  valueOrRemove: string | null,
  area: StorageArea = "local",
  store?: StorageLike | null,
): boolean {
  return valueOrRemove === null ? safeRemove(key, area, store) : safeWrite(key, valueOrRemove, area, store);
}

/** In-memory StorageLike (used by tests and as a fallback when the browser blocks storage). */
export function createMemoryStorage(initial: Record<string, string> = {}): StorageLike & { dump(): Record<string, string> } {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? (data.get(k) as string) : null),
    setItem: (k, v) => {
      data.set(k, String(v));
    },
    removeItem: (k) => {
      data.delete(k);
    },
    dump: () => Object.fromEntries(data),
  };
}
