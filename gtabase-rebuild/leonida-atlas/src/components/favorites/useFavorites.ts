"use client";

/**
 * Browser-local favorites (R-1402..R-1406, HYPOTHESIS, DIVERGENCE D-002): localStorage `atlas-favorites`.
 * Every change is announced on window with the event `atlas-favorites-change` (the same event the side-column block of
 * "@/components/ui" listens to) so it and other buttons on the page update immediately (R-1507); changes in other tabs arrive through the `storage` event.
 */
import { useCallback, useEffect, useState } from "react";
import { FAVORITES_KEY, isFavorite, readFavorites, safeApply, safeRead, toggleFavorite, type Favorites } from "@/lib";

export const FAVORITES_EVENT = "atlas-favorites-change";

/** In-page fallback when storage is unavailable (R-1508): favorites still work for the current page view. */
let memoryRaw: string | null = null;

function readRaw(): string | null {
  const stored = safeRead(FAVORITES_KEY, "local");
  return stored ?? memoryRaw;
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === FAVORITES_KEY) onChange();
  };
  window.addEventListener(FAVORITES_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(FAVORITES_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Toggles one favorite (listKey "gta-6" for items, "gta6-map" for markers) and announces the change. */
export function toggleStoredFavorite(listKey: string, key: string): boolean {
  const next = toggleFavorite(readRaw(), listKey, key);
  memoryRaw = next;
  safeApply(FAVORITES_KEY, next, "local");
  window.dispatchEvent(new Event(FAVORITES_EVENT));
  return isFavorite(next, listKey, key);
}

/** `[saved, toggle, ready]` for one favorite key; `ready` is false until the browser state was read. */
export function useFavorite(listKey: string, key: string): [boolean, () => boolean, boolean] {
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setSaved(isFavorite(readRaw(), listKey, key));
    sync();
    setReady(true);
    return subscribe(sync);
  }, [listKey, key]);
  const toggle = useCallback(() => {
    const now = toggleStoredFavorite(listKey, key);
    setSaved(now);
    return now;
  }, [listKey, key]);
  return [saved, toggle, ready];
}

/** The raw favorites record, kept in sync with the browser (side-column block, R-1405). */
export function useFavoritesRaw(): string | null {
  const [raw, setRaw] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => setRaw(readRaw());
    sync();
    return subscribe(sync);
  }, []);
  return raw;
}

export function useFavoritesRecord(): Favorites {
  return readFavorites(useFavoritesRaw());
}
