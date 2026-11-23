/**
 * map-ui — words, names and small decisions of the map controls (R-809..R-819, R-822, R-826, R-827, R-832, R-833,
 * R-841, R-842, R-847).
 */
import { markerCount } from "./format";

export const MAP_PATH = "/gta-6/map/";
/** R-841: the map is "narrow" below this map-area width. */
export const MAP_NARROW_WIDTH_PX = 700;

export interface LinkKeyCategory {
  id: string;
  slug?: string | null;
}

/** R-812: link key = slug when the category has one, otherwise its id. */
export function linkKey(category: LinkKeyCategory): string {
  return category.slug ? category.slug : category.id;
}

/** R-812/R-809 category link "/gta-6/map/?feature=<key>". */
export function featureHref(category: LinkKeyCategory): string {
  return `${MAP_PATH}?feature=${encodeURIComponent(linkKey(category))}`;
}

/** R-819: the category whose link key equals `key`, or null (an id of a slugged category is not a link key). */
export function resolveFeatureKey<T extends LinkKeyCategory>(key: string | null | undefined, categories: readonly T[]): T | null {
  if (!key) return null;
  return categories.find((c) => linkKey(c) === key) ?? null;
}

export type AllButtonWord = "Hide all" | "Show all";

/**
 * R-814: "Show all" when no category is on (and right after "Only"), "Hide all" when every category is on,
 * otherwise the previous word. Activating it applies its word to every category.
 */
export function allButtonWord(previousWord: AllButtonWord, onCount: number, total: number, afterOnly = false): AllButtonWord {
  if (afterOnly || onCount === 0) return "Show all";
  if (onCount === total) return "Hide all";
  return previousWord;
}

/** R-831 "Hide found"/"Show found" word and tooltip. */
export function foundButton(hiding: boolean): { text: string; title: string } {
  return hiding
    ? { text: "Show found", title: "Put the markers you found back on the map" }
    : { text: "Hide found", title: "Take the markers you found off the map (the counts stay)" };
}

/** R-817 "Only"/"All" button text and accessible name. */
export function onlyButton(name: string, isOnly: boolean): { text: string; label: string } {
  return isOnly ? { text: "All", label: `Show all categories again: ${name}` } : { text: "Only", label: `Show only this category: ${name}` };
}

/** R-817 arrow button accessible name. */
export function arrowButtonLabel(name: string): string {
  return `Show only this category: ${name}`;
}

/** R-816 fold button name/tooltip and expanded state. */
export function foldButton(group: string, open: boolean): { label: string; expanded: boolean } {
  return { label: `${open ? "Hide" : "Show"} ${group}`, expanded: open };
}

/** R-815 group checkbox: ticked when all on, unticked + mixed when some, unticked when none. */
export function groupBoxState(onInGroup: number, size: number): { checked: boolean; mixed: boolean } {
  return { checked: size > 0 && onInGroup === size, mixed: onInGroup > 0 && onInGroup < size };
}

/** R-810 rail button look: "off" when every category of the group is off. */
export function railState(onInGroup: number, isCurrent: boolean): string {
  const words: string[] = [];
  if (isCurrent) words.push("on");
  if (onInGroup === 0) words.push("off");
  return words.join(" ");
}

/**
 * R-818: while exactly the category chosen by "Only"/arrow is the only one on, the address is
 * "/gta-6/map/?feature=<key>"; otherwise "/gta-6/map/".
 */
export function mapAddressPath(
  onIds: ReadonlySet<string> | readonly string[],
  onlyChosenId: string | null,
  categories: readonly LinkKeyCategory[],
): string {
  const on = onIds instanceof Set ? onIds : new Set(onIds as readonly string[]);
  if (onlyChosenId && on.size === 1 && on.has(onlyChosenId)) {
    const cat = categories.find((c) => c.id === onlyChosenId);
    if (cat) return featureHref(cat);
  }
  return MAP_PATH;
}

export interface FoundByCategory {
  id: string;
  name: string;
  /** Found markers of this (trackable) category. */
  count: number;
}

/** R-832 reset options: "All categories (<n> found)" (value "") then each category with found markers. */
export function resetOptions(found: readonly FoundByCategory[]): Array<{ value: string; label: string }> {
  const total = found.reduce((s, f) => s + f.count, 0);
  return [
    { value: "", label: `All categories (${total} found)` },
    ...found.filter((f) => f.count > 0).map((f) => ({ value: f.id, label: `${f.name} (${f.count} found)` })),
  ];
}

export const RESET_NOTHING = "Nothing to reset: no marker is ticked as found yet.";

/** R-832 dialog text for the current choice ("" or null = all categories). */
export function resetDialogText(found: readonly FoundByCategory[], chosenCategory: string | null | undefined): string {
  const total = found.reduce((s, f) => s + f.count, 0);
  if (total === 0) return RESET_NOTHING;
  const chosen = chosenCategory ? found.find((f) => f.id === chosenCategory) : undefined;
  if (!chosen) return `This unticks the ${markerCount(total)} you found, in every category. There is no undo.`;
  return `This unticks the ${markerCount(chosen.count)} you found in ${chosen.name}. There is no undo.`;
}

/** R-833 text after a successful local reset. */
export function resetDoneText(n: number): string {
  return `Done: ${markerCount(n)} unticked.`;
}

/** R-826: "<page address without query>#<marker id>" (any existing hash dropped too). */
export function copyLinkValue(pageUrl: string, markerId: string): string {
  const cut = pageUrl.search(/[?#]/);
  const base = cut >= 0 ? pageUrl.slice(0, cut) : pageUrl;
  return `${base}#${markerId}`;
}

/** R-827 shared spot `#spot=<x>,<y>` (map units, may be negative); null when the hash is not one. */
export function parseSpotHash(hash: string): { x: number; y: number } | null {
  const m = /^#?spot=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(hash.trim());
  if (!m) return null;
  return { x: Number(m[1]), y: Number(m[2]) };
}

export type MapHashTarget = { kind: "marker"; id: string } | { kind: "spot"; x: number; y: number } | null;

/** R-822/R-827: what an address hash opens (an unknown marker id is resolved by the caller → nothing). */
export function parseMapHash(hash: string): MapHashTarget {
  const spot = parseSpotHash(hash);
  if (spot) return { kind: "spot", ...spot };
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!id || id.includes("=")) return null;
  try {
    return { kind: "marker", id: decodeURIComponent(id) };
  } catch {
    return { kind: "marker", id };
  }
}

/** R-827 shared-spot popup texts. */
export const SHARED_SPOT = {
  title: "Shared spot",
  text: "Somebody shared this place on the map with you.",
  pill: "Suggest this location",
} as const;

/** R-824 star button (R-1406 pressed state). */
export function starButton(pressed: boolean): { label: string; pressed: boolean } {
  return { label: pressed ? "Remove from favourites" : "Add to favourites", pressed };
}

/** R-847 full-screen button name/tooltip. */
export function fullscreenLabel(isFullscreen: boolean): string {
  return isFullscreen ? "Exit full screen" : "Full screen";
}

/** R-841 narrow layout test. */
export function isNarrowMap(mapAreaWidth: number): boolean {
  return mapAreaWidth < MAP_NARROW_WIDTH_PX;
}

export interface EscapeState {
  about?: boolean;
  reset?: boolean;
  panel?: boolean;
  popup?: boolean;
  /** Narrow-screen sidebar open. */
  narrowSidebar?: boolean;
  fullscreen?: boolean;
}

export type EscapeTarget = "about" | "reset" | "panel" | "popup" | "narrowSidebar" | "fullscreen" | null;

/** R-842: what Escape closes, by priority. */
export function escapeTarget(state: EscapeState): EscapeTarget {
  const order: Exclude<EscapeTarget, null>[] = ["about", "reset", "panel", "popup", "narrowSidebar", "fullscreen"];
  return order.find((k) => state[k]) ?? null;
}

/** R-843 member-action panel titles. */
export const MAP_PANEL_TITLES = {
  suggest: "Suggest a location",
  personal: "Personal marker",
  contest: "Map Contest",
  feedback: "Feedback",
} as const;
