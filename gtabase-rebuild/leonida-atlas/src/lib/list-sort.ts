/**
 * list-sort — F1 ordering (R-519..R-522).
 */
import type { ListRules, SortDir } from "./list-hash";

const charCollator = new Intl.Collator("en");
const naturalCollator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const alphaCollator = new Intl.Collator("en", { sensitivity: "base" });

export type SortValue = { kind: "missing" } | { kind: "number"; n: number } | { kind: "text"; s: string };

const NUMERIC = /^-?\d+(\.\d+)?$/;

/**
 * Reads a sort value: arrays (multi-value fields such as classes) are sorted alphabetically and joined with a
 * space; empty strings, empty arrays, null and NaN are missing; numbers and numeric strings are numbers.
 */
export function sortValueOf(entry: object, field: string): SortValue {
  const raw = (entry as Record<string, unknown>)[field];
  if (raw === null || raw === undefined) return { kind: "missing" };
  if (typeof raw === "number") return Number.isFinite(raw) ? { kind: "number", n: raw } : { kind: "missing" };
  if (Array.isArray(raw)) {
    const parts = raw.filter((v) => v !== null && v !== undefined && v !== "").map((v) => String(v));
    if (parts.length === 0) return { kind: "missing" };
    const joined = parts.sort((a, b) => alphaCollator.compare(a, b)).join(" ");
    return NUMERIC.test(joined) ? { kind: "number", n: Number(joined) } : { kind: "text", s: joined };
  }
  const s = String(raw);
  if (s === "") return { kind: "missing" };
  return NUMERIC.test(s) ? { kind: "number", n: Number(s) } : { kind: "text", s };
}

/**
 * R-521 text comparison: character by character with a locale-aware single-character comparison; when one text
 * is a prefix of the other the longer is larger.
 */
export function compareTextCharwise(a: string, b: string): number {
  const ca = Array.from(a);
  const cb = Array.from(b);
  const n = Math.min(ca.length, cb.length);
  for (let i = 0; i < n; i++) {
    if (ca[i] === cb[i]) continue;
    const c = charCollator.compare(ca[i], cb[i]);
    if (c !== 0) return c < 0 ? -1 : 1;
  }
  return Math.sign(ca.length - cb.length);
}

/** R-521 name tie-break: natural order, case- and accent-insensitive. */
export function compareNamesNatural(a: string, b: string): number {
  return Math.sign(naturalCollator.compare(a, b));
}

function compareValues(a: SortValue, b: SortValue): number {
  if (a.kind === "number" && b.kind === "number") return Math.sign(a.n - b.n);
  const sa = a.kind === "number" ? String(a.n) : a.kind === "text" ? a.s : "";
  const sb = b.kind === "number" ? String(b.n) : b.kind === "text" ? b.s : "";
  return compareTextCharwise(sa, sb);
}

function nameOf(entry: object, rules: Pick<ListRules, "nameField">): string {
  const v = (entry as Record<string, unknown>)[rules.nameField ?? "name"];
  return v === null || v === undefined ? "" : String(v);
}

/**
 * R-521: compares two entries on a sort key. Empty/missing values go after every non-empty value in both
 * directions; equal values fall back to the names in the chosen direction; "desc" reverses every comparison
 * except the empty-last rule. An unknown sort key orders by the first sort field ascending (R-522).
 */
export function compareEntries(
  a: object,
  b: object,
  sortKey: string,
  direction: SortDir,
  rules: Pick<ListRules, "sorts" | "nameField">,
): number {
  let def = rules.sorts.find((s) => s.key === sortKey);
  let dir = direction;
  if (!def) {
    def = rules.sorts.find((s) => s.key === "name") ?? rules.sorts[0];
    dir = "asc";
    if (!def) return 0;
  }
  const sign = dir === "desc" ? -1 : 1;
  const va = sortValueOf(a, def.field);
  const vb = sortValueOf(b, def.field);
  if (va.kind === "missing" && vb.kind !== "missing") return 1;
  if (vb.kind === "missing" && va.kind !== "missing") return -1;
  if (va.kind !== "missing" && vb.kind !== "missing") {
    const c = compareValues(va, vb);
    if (c !== 0) return sign * c;
  }
  return sign * compareNamesNatural(nameOf(a, rules), nameOf(b, rules));
}

/** R-519..R-522: a sorted copy (stable: entries equal on value and name keep catalogue order). */
export function sortEntries<T extends object>(
  entries: readonly T[],
  sortKey: string,
  direction: SortDir,
  rules: Pick<ListRules, "sorts" | "nameField">,
): T[] {
  return entries.slice().sort((a, b) => compareEntries(a, b, sortKey, direction, rules));
}

/** R-520 direction button: flips the direction; its accessible name says what it will do. */
export function flipDirection(dir: SortDir): SortDir {
  return dir === "asc" ? "desc" : "asc";
}

export function directionButtonLabel(dir: SortDir): string {
  return dir === "asc" ? "Sort descending" : "Sort ascending";
}
