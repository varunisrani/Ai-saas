/**
 * list-filter — F1 text and choice filters, option counts (R-507..R-514, R-518).
 */
import type { FilterDef, FilterState, ListRules } from "./list-hash";

/** R-508 field limit (enforced by the UI input). */
export const TEXT_FILTER_MAX_LENGTH = 128;

/**
 * R-509 one-way accent folding: an unaccented query letter also matches these accented forms in the data.
 * (Lower-case forms; matching is case-insensitive.)
 */
export const ACCENT_FOLDS: Readonly<Record<string, string>> = {
  a: "áàảãạăắằẵặâấầẩẫậäåæ",
  e: "éèẻẽẹêếềễệểë",
  i: "íìỉĩịîïı",
  o: "óòỏõọơớờởợỡôốồổỗộöø",
  u: "úùủũụưứừửựữûü",
  y: "ýỳỷỹỵÿ",
  c: "ç",
  d: "đ",
  n: "ñ",
  g: "ğ",
  s: "ş",
};

function lowerChars(text: string): string[] {
  return Array.from(text, (ch) => ch.toLowerCase());
}

function charMatches(q: string, v: string): boolean {
  if (q === v) return true;
  const folds = ACCENT_FOLDS[q];
  return folds !== undefined && folds.includes(v);
}

/**
 * R-508/R-509: the value contains the query, ignoring case, untrimmed, every non-letter literal, with one-way
 * accent folding. Empty query matches everything; a missing value never matches a non-empty query.
 */
export function textMatches(query: string, value: string | null | undefined): boolean {
  if (query.length === 0) return true;
  if (value === null || value === undefined || value.length === 0) return false;
  const q = lowerChars(query);
  const v = lowerChars(value);
  outer: for (let start = 0; start + q.length <= v.length; start++) {
    for (let j = 0; j < q.length; j++) {
      if (!charMatches(q[j], v[start + j])) continue outer;
    }
    return true;
  }
  return false;
}

/** Reads an entry field as a list of non-empty strings (arrays, strings and numbers supported). */
export function entryValues(entry: object, field: string): string[] {
  const raw = (entry as Record<string, unknown>)[field];
  if (raw === null || raw === undefined) return [];
  if (Array.isArray(raw)) return raw.filter((v) => v !== null && v !== undefined && v !== "").map((v) => String(v));
  if (raw === "") return [];
  return [String(raw)];
}

/** A filter value counts as active when it is a non-empty string or a non-empty list. */
export function isFilterActive(value: FilterState[string]): boolean {
  if (value === null || value === undefined) return false;
  return typeof value === "string" ? value.length > 0 : value.length > 0;
}

/** Number of active filters (drives the "Clear Filters" visibility, R-517). */
export function activeFilterCount(state: FilterState, rules?: Pick<ListRules, "filters">): number {
  const keys = rules ? rules.filters.map((f) => f.key) : Object.keys(state);
  return keys.filter((k) => isFilterActive(state[k])).length;
}

/** Does one entry pass one filter? (Inactive filters always pass.) */
export function entryPassesFilter(entry: object, filter: FilterDef, value: FilterState[string]): boolean {
  if (!isFilterActive(value)) return true;
  if (filter.kind === "text") {
    const raw = (entry as Record<string, unknown>)[filter.field];
    const text = raw === null || raw === undefined ? undefined : Array.isArray(raw) ? raw.join(" ") : String(raw);
    return textMatches(value as string, text);
  }
  const have = entryValues(entry, filter.field);
  const wanted = typeof value === "string" ? [value] : (value as readonly string[]);
  // R-511: several picked values combine with OR.
  return wanted.some((w) => have.includes(w));
}

/** R-511: OR inside a choice filter, AND across filters. `exceptKey` skips one filter (used by option counts). */
export function filterEntries<T extends object>(
  entries: readonly T[],
  state: FilterState,
  rules: Pick<ListRules, "filters">,
  exceptKey?: string,
): T[] {
  const active = rules.filters.filter((f) => f.key !== exceptKey && isFilterActive(state[f.key]));
  if (active.length === 0) return entries.slice();
  return entries.filter((e) => active.every((f) => entryPassesFilter(e, f, state[f.key])));
}

/** R-507: option values present in the data (empty skipped), in first-seen order. */
export function presentOptionValues(entries: readonly object[], field: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of entries) {
    for (const v of entryValues(e, field)) {
      if (!seen.has(v)) {
        seen.add(v);
        out.push(v);
      }
    }
  }
  return out;
}

/**
 * R-512 option counts of one choice filter: each option counts within the result of all *other* filters.
 * (This covers every case of the rule: no filter → all items; the only active filter → full counts; active with
 * others → within the others' result; inactive → within the current result.)
 * Returns a count for every option value (zero included, R-513/R-518).
 */
export function optionCounts(
  entries: readonly object[],
  state: FilterState,
  rules: Pick<ListRules, "filters">,
  filterKey: string,
  optionValues?: readonly string[],
): Record<string, number> {
  const filter = rules.filters.find((f) => f.key === filterKey);
  if (!filter) return {};
  const values = optionValues ?? presentOptionValues(entries, filter.field);
  const counts: Record<string, number> = {};
  for (const v of values) counts[v] = 0;
  for (const e of filterEntries(entries, state, rules, filterKey)) {
    for (const v of new Set(entryValues(e, filter.field))) {
      if (v in counts) counts[v] += 1;
    }
  }
  return counts;
}

/** R-506 option label "<label> (<count>)". */
export function optionLabel(label: string, count: number): string {
  return `${label} (${count})`;
}

/** R-517: the state after "Clear Filters" (every filter empty). */
export function clearedFilterState(rules: Pick<ListRules, "filters">): FilterState {
  const out: FilterState = {};
  for (const f of rules.filters) out[f.key] = f.kind === "tiles" ? [] : "";
  return out;
}
