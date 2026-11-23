/**
 * compare — compare picks, compare bar, comparison URLs (R-619, R-701..R-714; CD2 `gtabCompare:<list path>`).
 */
import { STORAGE_KEYS } from "./storage";
import { isPlainObject, parseJson } from "./text";

export type CompareType = "vehicle" | "weapon";

export interface ComparePick {
  /** compareKey of the item. */
  id: string;
  /** Display name of the item. */
  name: string;
}

/** R-702: at most 4 picks per list. */
export const MAX_COMPARE_PICKS = 4;

/** R-703: sessionStorage key, e.g. "gtabCompare:/gta-6/vehicles/". */
export function compareStorageKey(listPath: string): string {
  return `${STORAGE_KEYS.comparePrefix}${listPath}`;
}

/**
 * R-703: stored picks; unreadable JSON or a non-array counts as no picks. Entries without a string/number id are
 * skipped; duplicates are dropped and at most 4 kept (HYPOTHESIS for those two clean-ups).
 */
export function readPicks(raw: string | null | undefined): ComparePick[] {
  const parsed = parseJson(raw);
  if (!Array.isArray(parsed)) return [];
  const out: ComparePick[] = [];
  for (const p of parsed) {
    if (!isPlainObject(p)) continue;
    const id = typeof p.id === "string" ? p.id : typeof p.id === "number" ? String(p.id) : null;
    if (!id || out.some((o) => o.id === id)) continue;
    out.push({ id, name: typeof p.name === "string" ? p.name : "" });
    if (out.length >= MAX_COMPARE_PICKS) break;
  }
  return out;
}

/** R-703 storage text: `[{"id":…,"name":…}]` in pick order ("[]" after Clear). */
export function serializePicks(picks: readonly ComparePick[]): string {
  return JSON.stringify(picks.map((p) => ({ id: p.id, name: p.name })));
}

/**
 * R-703/R-702: toggling an unpicked item appends it, a picked item is removed, a 5th pick with 4 picked changes
 * nothing (the same array is returned).
 */
export function togglePick(picks: readonly ComparePick[], item: ComparePick): readonly ComparePick[] {
  if (picks.some((p) => p.id === item.id)) return picks.filter((p) => p.id !== item.id);
  if (picks.length >= MAX_COMPARE_PICKS) return picks;
  return [...picks, { id: item.id, name: item.name }];
}

export function isPicked(picks: readonly ComparePick[], id: string): boolean {
  return picks.some((p) => p.id === id);
}

/** R-702: with 4 picked, every other toggle is disabled. */
export function isToggleDisabled(picks: readonly ComparePick[], id: string): boolean {
  return picks.length >= MAX_COMPARE_PICKS && !isPicked(picks, id);
}

/** R-701 toggle accessible name. */
export function compareToggleLabel(name: string): string {
  return `Compare ${name}`;
}

/** R-706 action link text (shown in capitals): "Pick 1 more" under 2 picks, else "Compare (n)". */
export function compareBarLabel(count: number): string {
  return count < 2 ? "Pick 1 more" : `Compare (${count})`;
}

/** R-705 counter "n/4". */
export function compareCountText(count: number): string {
  return `${count}/${MAX_COMPARE_PICKS}`;
}

/** R-705 picked names joined by " · ". */
export function compareNamesText(picks: readonly ComparePick[]): string {
  return picks.map((p) => p.name).join(" · ");
}

/** R-705: the bar carries the `hidden` attribute with 0 picks. */
export function compareBarHidden(count: number): boolean {
  return count === 0;
}

/** Comparison page path of a list path ("/gta-6/vehicles/" → "/gta-6/vehicles/comparison/"). */
export function comparisonPath(listPath: string): string {
  return `${listPath.endsWith("/") ? listPath : `${listPath}/`}comparison/`;
}

/** Plain string (UTF-16 code unit) order, e.g. "38" < "heavy-pistol" (R-707). */
export function codeUnitSort(keys: readonly string[]): string[] {
  return keys.slice().sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** R-707: "<list path>comparison/?<type>1=<key>&…" with keys sorted by code-unit order and numbered from 1. */
export function comparisonHref(listPath: string, type: CompareType, keys: readonly string[]): string {
  const base = comparisonPath(listPath);
  if (keys.length === 0) return base;
  const query = codeUnitSort(keys)
    .map((k, i) => `${type}${i + 1}=${encodeURIComponent(k)}`)
    .join("&");
  return `${base}?${query}`;
}

/** R-706/R-707: the bar's action link href; "#" while fewer than 2 are picked. */
export function compareLink(listPath: string, type: CompareType, picks: readonly ComparePick[]): string {
  if (picks.length < 2) return "#";
  return comparisonHref(listPath, type, picks.map((p) => p.id));
}

/** R-619: detail-page "Compare To" link with exactly two parameters, sorted by plain string order. */
export function compareToHref(listPath: string, type: CompareType, currentKey: string, otherKey: string): string {
  return comparisonHref(listPath, type, [currentKey, otherKey]);
}

export interface CanonicalComparison {
  /** Valid keys in canonical (sorted) order, at most 4. */
  keys: string[];
  /** True when the requested comparison parameters differ from the canonical ones. */
  redirect: boolean;
  /** The canonical comparison URL (path + canonical query). */
  href: string;
}

function toParamList(params: string | URLSearchParams | ReadonlyArray<readonly [string, string]>): Array<[string, string]> {
  if (typeof params === "string") {
    return Array.from(new URLSearchParams(params.startsWith("?") ? params.slice(1) : params).entries());
  }
  if (params instanceof URLSearchParams) return Array.from(params.entries());
  return params.map(([k, v]) => [k, v]);
}

/**
 * R-713 (HYPOTHESIS, U-F3-02): collect `<type>1`, `<type>2`, … values in parameter order, drop unknown keys and
 * duplicates, keep the first 4, sort by plain string order and renumber. A redirect is needed when that differs
 * from the requested comparison parameters; the canonical URL drops every other parameter. Other parameters alone
 * (e.g. `utm_source` with already canonical keys) do not cause a redirect (R-003 keeps and ignores them).
 */
export function canonicalComparison(
  params: string | URLSearchParams | ReadonlyArray<readonly [string, string]>,
  type: CompareType,
  knownKeys: ReadonlySet<string> | readonly string[],
  listPath = type === "vehicle" ? "/gta-6/vehicles/" : "/gta-6/weapons/",
): CanonicalComparison {
  const known = knownKeys instanceof Set ? knownKeys : new Set(knownKeys as readonly string[]);
  const re = new RegExp(`^${type}([1-9]\\d*)$`);
  const requested = toParamList(params).filter(([k]) => re.test(k));
  const kept: string[] = [];
  for (const [, v] of requested) {
    if (!known.has(v) || kept.includes(v)) continue;
    kept.push(v);
    if (kept.length >= MAX_COMPARE_PICKS) break;
  }
  const keys = codeUnitSort(kept);
  const redirect =
    requested.length !== keys.length || requested.some(([k, v], i) => k !== `${type}${i + 1}` || v !== keys[i]);
  return { keys, redirect, href: comparisonHref(listPath, type, keys) };
}

/** R-714: the "×" remove link — the same comparison without that key, renumbered. */
export function removeFromComparisonHref(keys: readonly string[], key: string, listPath: string, type: CompareType): string {
  return comparisonHref(
    listPath,
    type,
    keys.filter((k) => k !== key),
  );
}

/** R-714 accessible name of the remove link. */
export function removeFromComparisonLabel(name: string): string {
  return `Remove ${name} from the comparison`;
}

/** R-708 slot title ("Add a vehicle" / "Add a weapon"). */
export function addSlotTitle(type: CompareType): string {
  return `Add a ${type}`;
}

/** R-708 note shown with fewer than 2 items. */
export function comparisonNote(type: CompareType): string {
  return `Add at least two GTA 6 ${type}s to see the comparison.`;
}

/** R-714: the note is shown only with fewer than 2 items. */
export function showComparisonNote(itemCount: number): boolean {
  return itemCount < 2;
}

/** R-714: for a numeric statistic row, flags the highest value(s) as "best" (all ties); missing values never. */
export function bestValueFlags(values: ReadonlyArray<number | null | undefined>): boolean[] {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (nums.length === 0) return values.map(() => false);
  const max = Math.max(...nums);
  return values.map((v) => typeof v === "number" && Number.isFinite(v) && v === max);
}
