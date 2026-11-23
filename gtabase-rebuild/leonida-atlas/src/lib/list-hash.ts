/**
 * list-hash — the F1 list state as the URL hash (R-522, R-525..R-528; CD1).
 *
 * The hash is kept as an ordered list of [key, value] pairs (values decoded). Filters write their values,
 * sort/direction are updated in place and `page` is always serialised last.
 */

export type SortDir = "asc" | "desc";
export type HashPair = [key: string, value: string];
export type FilterKind = "text" | "tiles" | "dropdown";

/** Structural description of one list filter (the data module's listConfig maps onto it). */
export interface FilterDef {
  /** Hash key, e.g. `name`, `attr.ct1.value`. */
  key: string;
  kind: FilterKind;
  /** Entry field the filter reads (string, string[] or missing). */
  field: string;
}

/** Structural description of one sort field. */
export interface SortDef {
  /** Hash key, e.g. `attr.ct6.frontend_value`, `name`. */
  key: string;
  /** Entry field compared (number, string, string[] or missing). */
  field: string;
  label?: string;
}

export interface ListRules {
  filters: readonly FilterDef[];
  sorts: readonly SortDef[];
  defaultSort: string;
  defaultDir: SortDir;
  /** Entry field holding the display name (tie-break, R-521). Default "name". */
  nameField?: string;
}

/** Structural shape of the data module's `listConfig(list)` (only the members the rules need). */
export interface ListConfigLike {
  filters: ReadonlyArray<{ hashKey: string; kind: string; field: string; options?: ReadonlyArray<{ value: string }> }>;
  sortFields: ReadonlyArray<{ hashKey: string; field: string; label?: string }>;
  defaultSort: { hashKey: string; direction: SortDir };
}

/** Adapter: the data module's list config → ListRules ("dropdown-search" and "dropdown" are both dropdowns). */
export function listRulesFromConfig(config: ListConfigLike): ListRules {
  return {
    filters: config.filters.map((f) => ({
      key: f.hashKey,
      kind: f.kind === "text" ? "text" : f.kind === "tiles" ? "tiles" : "dropdown",
      field: f.field,
    })),
    sorts: config.sortFields.map((s) => ({ key: s.hashKey, field: s.field, label: s.label })),
    defaultSort: config.defaultSort.hashKey,
    defaultDir: config.defaultSort.direction,
    nameField: "name",
  };
}

/** Adapter: valid option values per choice filter from the data module's list config (R-522, R-526). */
export function validOptionsFromConfig(config: ListConfigLike): ValidOptions {
  const out: Record<string, string[]> = {};
  for (const f of config.filters) if (f.kind !== "text") out[f.hashKey] = (f.options ?? []).map((o) => o.value);
  return out;
}

/** Filter values: text → string; tiles → string[] in pick order; dropdown → string. */
export type FilterState = Record<string, string | readonly string[] | null | undefined>;

/** Valid option values per choice filter key (text filters accept any non-empty value). */
export type ValidOptions = Record<string, readonly string[]>;

function safeDecode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

/**
 * R-526: reads "#k=v&…" into ordered pairs. Only pieces with exactly one "=" count; values are URI-decoded;
 * a repeated key keeps its first occurrence; pieces with an empty key are dropped.
 */
export function parseListHash(hash: string): HashPair[] {
  const body = hash.startsWith("#") ? hash.slice(1) : hash;
  const pairs: HashPair[] = [];
  if (!body) return pairs;
  const seen = new Set<string>();
  for (const piece of body.split("&")) {
    const eq = piece.indexOf("=");
    if (eq < 0 || piece.indexOf("=", eq + 1) >= 0) continue;
    const key = safeDecode(piece.slice(0, eq));
    if (!key || seen.has(key)) continue;
    seen.add(key);
    pairs.push([key, safeDecode(piece.slice(eq + 1))]);
  }
  return pairs;
}

/**
 * R-525: "#k=v&…" with URI-component encoding, multi values joined by "," before encoding, `page` last.
 * An empty pair list gives "" (no hash).
 */
export function serializeListHash(pairs: ReadonlyArray<readonly [string, string | readonly string[]]>): string {
  const normal: string[] = [];
  let page: string | null = null;
  for (const [key, raw] of pairs) {
    const value = typeof raw === "string" ? raw : raw.join(",");
    const piece = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    if (key === "page") page = piece;
    else normal.push(piece);
  }
  if (page !== null) normal.push(page);
  return normal.length ? `#${normal.join("&")}` : "";
}

/** Default hash of a list, e.g. "#sort=attr.ct6.frontend_value&sortdir=desc" (R-505). */
export function defaultListHash(rules: Pick<ListRules, "defaultSort" | "defaultDir">): string {
  return serializeListHash([
    ["sort", rules.defaultSort],
    ["sortdir", rules.defaultDir],
  ]);
}

function getPair(pairs: readonly HashPair[], key: string): string | undefined {
  const p = pairs.find(([k]) => k === key);
  return p ? p[1] : undefined;
}

export interface EffectiveSort {
  /** Sort key actually used for ordering. */
  key: string;
  dir: SortDir;
  /** False when the hash names an unknown sort field (R-522: shows the first option, name ascending). */
  known: boolean;
}

/** R-522: the effective sort for a pair list (unknown field → first option, ascending). */
export function effectiveSort(pairs: readonly HashPair[], rules: ListRules): EffectiveSort {
  const key = getPair(pairs, "sort") ?? rules.defaultSort;
  const dir: SortDir = (getPair(pairs, "sortdir") ?? rules.defaultDir) === "desc" ? "desc" : "asc";
  if (rules.sorts.some((s) => s.key === key)) return { key, dir, known: true };
  const first = rules.sorts[0]?.key ?? "name";
  return { key: first, dir: "asc", known: false };
}

export interface NormalizedListHash {
  /** Pairs after the load rules (defaults appended, direction fixed); unknown keys/values kept. */
  pairs: HashPair[];
  /** Filter state made only of valid values. */
  state: FilterState;
  /** Per filter key present in the hash: whether at least one of its values was valid. */
  valid: Record<string, boolean>;
  /** True when at least one filter value from the link was applied (the caller then writes page=1, R-526). */
  applied: boolean;
  sort: EffectiveSort;
}

function splitValues(value: string): string[] {
  return value.split(",").filter((v) => v.length > 0);
}

/**
 * R-526 / R-522 load normalisation: append `sort` / `sortdir` defaults when missing (in that order), force a
 * direction other than "desc" to "asc" (in place), collect the valid filter values. Unknown keys, unknown
 * values and `page` are kept as they are.
 */
export function normalizeListHashOnLoad(
  pairs: readonly HashPair[],
  rules: ListRules,
  validOptions: ValidOptions = {},
): NormalizedListHash {
  const out: HashPair[] = pairs.map(([k, v]) => [k, v]);
  if (!out.some(([k]) => k === "sort")) out.push(["sort", rules.defaultSort]);
  const dirPair = out.find(([k]) => k === "sortdir");
  if (!dirPair) out.push(["sortdir", rules.defaultDir]);
  else if (dirPair[1] !== "desc") dirPair[1] = "asc";

  const state: FilterState = {};
  const valid: Record<string, boolean> = {};
  let applied = false;
  for (const f of rules.filters) {
    const raw = getPair(out, f.key);
    if (raw === undefined) continue;
    if (f.kind === "text") {
      valid[f.key] = raw.length > 0;
      if (raw.length > 0) {
        state[f.key] = raw;
        applied = true;
      }
      continue;
    }
    const allowed = new Set(validOptions[f.key] ?? []);
    if (f.kind === "tiles") {
      const picked: string[] = [];
      for (const v of splitValues(raw)) if (allowed.has(v) && !picked.includes(v)) picked.push(v);
      valid[f.key] = picked.length > 0;
      if (picked.length) {
        state[f.key] = picked;
        applied = true;
      }
    } else {
      const ok = raw.length > 0 && allowed.has(raw);
      valid[f.key] = ok;
      if (ok) {
        state[f.key] = raw;
        applied = true;
      }
    }
  }
  return { pairs: out, state, valid, applied, sort: effectiveSort(out, rules) };
}

function filterValueText(value: string | readonly string[] | null | undefined): string {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : value.join(",");
}

/**
 * R-527 filter change: every filter of `rules` (or every key of `filterValues` when no rules are given) is
 * written — a value is updated in place when its key exists, otherwise appended; an empty value removes the key;
 * `page` is set to 1 and kept last.
 */
export function applyFilterChange(
  pairs: readonly HashPair[],
  filterValues: FilterState,
  rules?: Pick<ListRules, "filters">,
): HashPair[] {
  const keys = rules ? rules.filters.map((f) => f.key) : Object.keys(filterValues);
  let out: HashPair[] = pairs.filter(([k]) => k !== "page").map(([k, v]) => [k, v]);
  for (const key of keys) {
    const text = filterValueText(filterValues[key]);
    const idx = out.findIndex(([k]) => k === key);
    if (!text) {
      if (idx >= 0) out = out.filter((_, i) => i !== idx);
    } else if (idx >= 0) {
      out[idx] = [key, text];
    } else {
      out.push([key, text]);
    }
  }
  out.push(["page", "1"]);
  return out;
}

/** R-528 sort change: `sort`/`sortdir` updated in place (appended before `page` when missing); no `page` added. */
export function applySortChange(pairs: readonly HashPair[], field: string, dir: SortDir): HashPair[] {
  const out: HashPair[] = pairs.map(([k, v]) => [k, v]);
  const set = (key: string, value: string) => {
    const idx = out.findIndex(([k]) => k === key);
    if (idx >= 0) out[idx] = [key, value];
    else {
      const pageIdx = out.findIndex(([k]) => k === "page");
      if (pageIdx >= 0) out.splice(pageIdx, 0, [key, value]);
      else out.push([key, value]);
    }
  };
  set("sort", field);
  set("sortdir", dir);
  return out;
}

export interface InitialListHash {
  /** The hash to write with history replace (R-526). */
  hash: string;
  pairs: HashPair[];
  state: FilterState;
  sort: EffectiveSort;
  applied: boolean;
}

/** Convenience: parse + load normalisation + (when a filter applied) the R-527 rewrite + serialise. */
export function initialListHash(rawHash: string, rules: ListRules, validOptions: ValidOptions = {}): InitialListHash {
  const norm = normalizeListHashOnLoad(parseListHash(rawHash), rules, validOptions);
  const pairs = norm.applied ? applyFilterChange(norm.pairs, norm.state, rules) : norm.pairs;
  return { hash: serializeListHash(pairs), pairs, state: norm.state, sort: norm.sort, applied: norm.applied };
}
