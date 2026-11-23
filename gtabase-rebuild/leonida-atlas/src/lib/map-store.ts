/**
 * map-store — F4 personal state: found ticks, counters, filter memory, view memory, notice (R-811, R-820, R-821,
 * R-828..R-831, R-840, R-846; CD2 keys `guest_checklists`, `gtab-map-filter`, `gtab-map-view`, `gtab-contest-closed`).
 */
import { STORAGE_KEYS } from "./storage";
import { isPlainObject, parseJson, stringArray } from "./text";

export const MAP_LIST_ID = "gta6-map";
export const MAP_FILTER_KEY = STORAGE_KEYS.mapFilter;
export const MAP_VIEW_KEY = STORAGE_KEYS.mapView;
export const MAP_NOTICE_KEY = STORAGE_KEYS.mapNoticeClosed;

/** R-805 zoom range, close zoom ("Zoom in" in the popup), start zoom; R-804 clustering; R-803 hit radius. */
export const MAP_ZOOM_MIN = 0;
export const MAP_ZOOM_MAX = 8;
export const MAP_CLOSE_ZOOM = 5;
export const MAP_START_ZOOM = 2;
export const MAP_ARROW_MIN_ZOOM = 4;
/** Below this zoom markers are clustered (R-804). */
export const MAP_CLUSTER_BELOW_ZOOM = 2;
export const MAP_CLUSTER_RADIUS_PX = 40;
export const MAP_HIT_RADIUS_PX = 12;
/** R-840: saved views older than this are ignored. */
export const MAP_VIEW_MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000;
/** R-826 "Copied!" feedback duration. */
export const COPIED_FEEDBACK_MS = 1500;

export interface MapMarkerInput {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  description?: string | null;
}

/** R-829: same-name test ignores case and repeated spaces. */
export function markerNameKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Ids of `gta6-map` in `guest_checklists` (unreadable JSON → none). */
export function readFoundIds(raw: string | null | undefined): string[] {
  const parsed = parseJson(raw);
  if (!isPlainObject(parsed)) return [];
  return stringArray(parsed[MAP_LIST_ID]);
}

/**
 * R-828: ticking appends the ids (in the given order, once) to list `gta6-map`, unticking removes them; other lists
 * are kept; an emptied `gta6-map` list is deleted and an emptied object means "remove the key" (returns null —
 * the map never writes `{}`).
 */
export function setMapFound(raw: string | null | undefined, ids: readonly string[], on: boolean): string | null {
  const parsed = parseJson(raw);
  const obj: Record<string, unknown> = isPlainObject(parsed) ? { ...parsed } : {};
  const list = stringArray(obj[MAP_LIST_ID]);
  for (const id of ids) {
    const idx = list.indexOf(id);
    if (on && idx < 0) list.push(id);
    else if (!on && idx >= 0) list.splice(idx, 1);
  }
  if (list.length) obj[MAP_LIST_ID] = list;
  else delete obj[MAP_LIST_ID];
  return Object.keys(obj).length ? JSON.stringify(obj) : null;
}

/**
 * R-829: in a multi-spawn category the markers sharing the clicked marker's name (case and repeated spaces
 * ignored) are one collectible: the clicked id first, then the others of that category in list order.
 */
export function multiSpawnGroup(markers: readonly MapMarkerInput[], id: string): string[] {
  const clicked = markers.find((m) => m.id === id);
  if (!clicked) return [id];
  const key = markerNameKey(clicked.name);
  const others = markers.filter((m) => m.id !== id && m.category === clicked.category && markerNameKey(m.name) === key);
  return [id, ...others.map((m) => m.id)];
}

export const COUNTER_TOOLTIP_TRACKED = "Found so far, out of all markers of this category";
export const COUNTER_TOOLTIP_UNTRACKED = "Markers in this category";

export interface CategoryCounter {
  /** DOM text of the counter ("found 1 / 5", "<n>", "" when switched off). */
  text: string;
  /** Parts for rendering "found " and the spaces visually hidden (reads "f/n"). */
  found: number | null;
  total: number;
  /** Screen-reader text "found <f> of <n>" (trackable only). */
  srText: string | null;
  tooltip: string;
  /** Trackable counters are hidden from screen readers (they read `srText`). */
  ariaHidden: boolean;
}

/**
 * R-811/R-411: trackable "found <f> / <n>" + sr "found <f> of <n>"; non-trackable "<n>"; switched-off → "".
 * Multi-spawn categories count distinct names (R-829).
 */
export function categoryCounter(
  markers: readonly MapMarkerInput[],
  foundIds: Iterable<string>,
  categoryId: string,
  trackable: boolean,
  multiSpawn = false,
  on = true,
): CategoryCounter {
  const found = new Set(foundIds);
  const own = markers.filter((m) => m.category === categoryId);
  let total: number;
  let f: number;
  if (multiSpawn) {
    const names = new Set(own.map((m) => markerNameKey(m.name)));
    const foundNames = new Set(own.filter((m) => found.has(m.id)).map((m) => markerNameKey(m.name)));
    total = names.size;
    f = foundNames.size;
  } else {
    total = own.length;
    f = own.filter((m) => found.has(m.id)).length;
  }
  if (!trackable) {
    return { text: on ? String(total) : "", found: null, total, srText: null, tooltip: COUNTER_TOOLTIP_UNTRACKED, ariaHidden: false };
  }
  return {
    text: on ? `found ${f} / ${total}` : "",
    found: f,
    total,
    srText: on ? `found ${f} of ${total}` : null,
    tooltip: COUNTER_TOOLTIP_TRACKED,
    ariaHidden: true,
  };
}

export interface MapFilterInput {
  /** Ids of the switched-off categories (any order). */
  off: Iterable<string>;
  /** Category ids with markers in config order (defines the `hidden` order; others are never listed). */
  categoryOrder: readonly string[];
  /** The hidden-by-default category ids. */
  hiddenByDefault: readonly string[];
  /** Folded group ids; undefined until the visitor folded or unfolded a group. */
  folded?: readonly string[] | null;
  /** Wide-screen sidebar state; undefined until toggled on a wide screen. */
  sidebar?: "open" | "closed" | null;
  hideFound?: boolean;
}

/**
 * R-820: `{"hidden":[…config order],"folded":[…]?,"sidebar":…?,"hideFound":true?,"dv":1}` in exactly that key
 * order, or null (= remove the key) when the record equals the defaults (hidden = exactly the hidden-by-default
 * categories, no folded, no sidebar, no hideFound).
 */
export function mapFilterRecord(input: MapFilterInput): string | null {
  const off = new Set(input.off);
  const hidden = input.categoryOrder.filter((id) => off.has(id));
  const defaults = input.hiddenByDefault.filter((id) => input.categoryOrder.includes(id));
  const isDefaultHidden = hidden.length === defaults.length && defaults.every((id) => off.has(id));
  const hasFolded = Array.isArray(input.folded);
  const hasSidebar = input.sidebar === "open" || input.sidebar === "closed";
  const hideFound = input.hideFound === true;
  if (isDefaultHidden && !hasFolded && !hasSidebar && !hideFound) return null;
  const record: Record<string, unknown> = { hidden };
  if (hasFolded) record.folded = [...(input.folded as readonly string[])];
  if (hasSidebar) record.sidebar = input.sidebar;
  if (hideFound) record.hideFound = true;
  record.dv = 1;
  return JSON.stringify(record);
}

export interface MapFilterState {
  hidden: string[];
  folded?: string[];
  sidebar?: "open" | "closed";
  hideFound: boolean;
}

/** R-821: restores the record; unreadable JSON (or a wrong shape) → null = defaults. */
export function readMapFilter(raw: string | null | undefined): MapFilterState | null {
  const parsed = parseJson(raw);
  if (!isPlainObject(parsed) || !Array.isArray(parsed.hidden)) return null;
  const out: MapFilterState = { hidden: stringArray(parsed.hidden), hideFound: parsed.hideFound === true };
  if (Array.isArray(parsed.folded)) out.folded = stringArray(parsed.folded);
  if (parsed.sidebar === "open" || parsed.sidebar === "closed") out.sidebar = parsed.sidebar;
  return out;
}

function round1(v: number): number {
  const r = Math.round(v * 10) / 10;
  return Object.is(r, -0) ? 0 : r;
}

/** R-840: `{"lat":<y 0.1>,"lng":<x 0.1>,"z":<zoom>,"t":<epoch ms>}`. */
export function mapViewRecord(center: { x: number; y: number }, zoom: number, nowMs: number): string {
  return JSON.stringify({ lat: round1(center.y), lng: round1(center.x), z: zoom, t: Math.round(nowMs) });
}

export interface MapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** R-1611 map bounds of the fixture island. */
export const MAP_BOUNDS: MapBounds = { minX: -8000, maxX: 4000, minY: -9000, maxY: 3000 };

/**
 * R-840: a saved view younger than 60 days whose centre lies inside the bounds is restored, zoom clamped to 0–8;
 * otherwise null (start view). HYPOTHESIS: a timestamp in the future is not restored.
 */
export function restoreMapView(
  raw: string | null | undefined,
  nowMs: number,
  bounds: MapBounds = MAP_BOUNDS,
): { center: { x: number; y: number }; zoom: number } | null {
  const p = parseJson(raw);
  if (!isPlainObject(p)) return null;
  const { lat, lng, z, t } = p;
  if (![lat, lng, z, t].every((v) => typeof v === "number" && Number.isFinite(v))) return null;
  const age = nowMs - (t as number);
  if (age < 0 || age >= MAP_VIEW_MAX_AGE_MS) return null;
  const x = lng as number;
  const y = lat as number;
  if (x < bounds.minX || x > bounds.maxX || y < bounds.minY || y > bounds.maxY) return null;
  return { center: { x, y }, zoom: Math.min(MAP_ZOOM_MAX, Math.max(MAP_ZOOM_MIN, z as number)) };
}

/** R-846: the stored value of a closed notice, "<start>|<end>|on". */
export function noticeClosedValue(start: string, end: string): string {
  return `${start}|${end}|on`;
}

/**
 * R-846: the notice shows while the date is inside the window and it was not closed for that window.
 * Window dates are whole UTC days, both inclusive (HYPOTHESIS).
 */
export function noticeVisible(nowMs: number, start: string, end: string, storedClosed: string | null | undefined): boolean {
  const s = Date.parse(`${start}T00:00:00Z`);
  const e = Date.parse(`${end}T00:00:00Z`) + 24 * 60 * 60 * 1000;
  if (!Number.isFinite(s) || !Number.isFinite(e)) return false;
  if (nowMs < s || nowMs >= e) return false;
  return storedClosed !== noticeClosedValue(start, end);
}
