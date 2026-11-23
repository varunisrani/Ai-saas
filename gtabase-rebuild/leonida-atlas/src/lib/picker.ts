/**
 * picker — the comparison slot combobox (R-709..R-712).
 */
import type { CompareType } from "./compare";
import { foldForSearch, queryWords } from "./text";

/** R-710 maximum option rows. */
export const PICKER_MAX_ROWS = 150;
/** R-711 the list closes this long after the box loses focus. */
export const PICKER_BLUR_CLOSE_MS = 150;
/** R-710 no-match row. */
export const PICKER_NO_MATCH = "No match";
/** R-712 loading text on the board while leaving after a pick. */
export const PICKER_LOADING = "Loading…";

/** R-710: lower case, accents stripped. */
export function normalizeForPicker(text: string): string {
  return foldForSearch(text);
}

export interface PickerItem {
  key: string;
  name: string;
}

export interface PickerResults<T extends PickerItem> {
  rows: T[];
  /** Number of matching items. */
  total: number;
  /** Matching items not shown (total − 150), 0 when none. */
  remaining: number;
  /** "<rest> more: keep typing" when more than 150 match, else null. */
  moreText: string | null;
  /** True when nothing matches ("No match" row). */
  noMatch: boolean;
}

const nameCollator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

/**
 * R-709/R-710: every item A→Z by name; the query is split on spaces and every word must occur somewhere in the
 * name (both lower-cased and accent-free); items already in the comparison are not offered; at most 150 rows.
 */
export function pickerResults<T extends PickerItem>(
  query: string,
  items: readonly T[],
  excludedKeys: Iterable<string> = [],
): PickerResults<T> {
  const excluded = new Set(excludedKeys);
  const words = queryWords(normalizeForPicker(query));
  const matching = items
    .filter((it) => !excluded.has(it.key))
    .filter((it) => {
      const name = normalizeForPicker(it.name);
      return words.every((w) => name.includes(w));
    })
    .sort((a, b) => nameCollator.compare(a.name, b.name));
  const total = matching.length;
  const remaining = Math.max(0, total - PICKER_MAX_ROWS);
  return {
    rows: matching.slice(0, PICKER_MAX_ROWS),
    total,
    remaining,
    moreText: remaining > 0 ? `${remaining} more: keep typing` : null,
    noMatch: total === 0,
  };
}

/**
 * R-711: highlight movement with wrap-around. `index` −1 = nothing highlighted yet (down → first, up → last).
 * Returns −1 for an empty list.
 */
export function wrapIndex(index: number, delta: number, length: number): number {
  if (length <= 0) return -1;
  if (index < 0) return delta >= 0 ? 0 : length - 1;
  return (((index + delta) % length) + length) % length;
}

/** R-712: "<slot url>?<param>=<key>" ("&" when the slot url already has a query). */
export function pickHref(slotUrl: string, param: string, key: string): string {
  const sep = slotUrl.includes("?") ? "&" : "?";
  return `${slotUrl}${sep}${param}=${encodeURIComponent(key)}`;
}

/**
 * R-712: target of an empty slot — on the empty page the comparison path with `<type>1`; on a filled page the
 * current canonical comparison URL with `<type><count+1>`.
 */
export function slotTarget(
  type: CompareType,
  currentKeys: readonly string[],
  canonicalUrl: string,
  emptyComparisonPath: string,
): { url: string; param: string } {
  if (currentKeys.length === 0) return { url: emptyComparisonPath, param: `${type}1` };
  return { url: canonicalUrl, param: `${type}${currentKeys.length + 1}` };
}
