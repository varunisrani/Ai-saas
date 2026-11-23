/**
 * list-memory — per-tab memory of the list hash (R-530, R-531; CD2 `jamg-hash:<list path>`).
 */
import { STORAGE_KEYS } from "./storage";

/** R-530: sessionStorage key, e.g. "jamg-hash:/gta-6/vehicles/". */
export function listMemoryKey(path: string): string {
  return `${STORAGE_KEYS.listMemoryPrefix}${path}`;
}

/** The Navigation Timing types (PerformanceNavigationTiming.type). */
export type NavigationKind = "navigate" | "reload" | "back_forward" | "prerender";

function hasHash(hash: string | null | undefined): hash is string {
  return typeof hash === "string" && hash.length > 1 && hash.startsWith("#");
}

export interface InitialHashChoice {
  hash: string;
  /** True when the saved hash replaced the URL's (Back/Forward only). */
  restored: boolean;
}

/**
 * R-531: only a Back/Forward navigation restores the saved hash, and only when it differs from the URL's; any
 * other visit uses the URL hash, or the defaults for a bare list URL (and then overwrites the saved value).
 */
export function chooseInitialHash(
  navigationType: NavigationKind | string,
  urlHash: string,
  saved: string | null,
  defaults: string,
): InitialHashChoice {
  if (navigationType === "back_forward" && hasHash(saved) && saved !== urlHash) {
    return { hash: saved, restored: true };
  }
  return { hash: hasHash(urlHash) ? urlHash : defaults, restored: false };
}

/** R-530: every hash write is copied to the memory, except while the page is being left after a link click. */
export function shouldWriteListMemory(leavingAfterLinkClick: boolean): boolean {
  return !leavingAfterLinkClick;
}
