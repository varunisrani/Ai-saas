/**
 * Small shared text helpers used by several rule modules (not a rule module of its own).
 */

/** Letters that NFD decomposition does not split into base letter + mark. */
const EXTRA_FOLDS: Record<string, string> = {
  ø: "o",
  Ø: "O",
  đ: "d",
  Đ: "D",
  ł: "l",
  Ł: "L",
  ı: "i",
  ß: "ss",
  æ: "ae",
  Æ: "AE",
  œ: "oe",
  Œ: "OE",
  þ: "th",
  Þ: "TH",
  ð: "d",
  Ð: "D",
};

/** Removes accents (combining marks after NFD) and folds a few special letters ("ø" → "o"). */
export function stripAccents(text: string): string {
  const decomposed = text.normalize("NFD").replace(/\p{M}+/gu, "");
  let out = "";
  for (const ch of decomposed) out += EXTRA_FOLDS[ch] ?? ch;
  return out;
}

/** Collapses every run of whitespace to one space and trims. */
export function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Lower-case + accent-free form used by the picker and the local search. */
export function foldForSearch(text: string): string {
  return stripAccents(text.toLowerCase()).toLowerCase();
}

/** Splits a folded query into non-empty words (space separated). */
export function queryWords(text: string): string[] {
  return text.split(/\s+/).filter((w) => w.length > 0);
}

/** Safe JSON.parse: returns `undefined` instead of throwing. */
export function parseJson(raw: string | null | undefined): unknown {
  if (raw === null || raw === undefined) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

/** True for a plain (non-array, non-null) object. */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Keeps only the string members of an array value; anything else gives []. */
export function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}
