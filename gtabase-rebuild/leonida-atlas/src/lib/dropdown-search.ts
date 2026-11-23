/**
 * dropdown-search — search box of the F1 filter dropdowns (R-515, R-516).
 */

/** R-515: a dropdown shows a search box when it has more than this many options. */
export const DROPDOWN_SEARCH_MIN_OPTIONS = 10;

/** R-515: whether a filter dropdown with `optionCount` options shows its search box (never for sort). */
export function dropdownHasSearch(optionCount: number, isSort = false): boolean {
  return !isSort && optionCount > DROPDOWN_SEARCH_MIN_OPTIONS;
}

function isWordChar(ch: string): boolean {
  return /[\p{L}\p{N}]/u.test(ch);
}

/**
 * R-515: true when the label has a word starting with the typed text, ignoring letter case but WITHOUT accent
 * folding ("Uber" does not match "Übermacht", "Über" does). A word starts at the beginning of the label or after
 * any character that is not a letter or digit. HYPOTHESIS: the typed text is trimmed; empty matches everything.
 */
export function wordStartMatches(label: string, typed: string): boolean {
  const q = typed.trim().toLowerCase();
  if (!q) return true;
  const chars = Array.from(label);
  for (let i = 0; i < chars.length; i++) {
    if (i > 0 && isWordChar(chars[i - 1])) continue;
    if (chars.slice(i).join("").toLowerCase().startsWith(q)) return true;
  }
  return false;
}

/** R-515 no-match row text. */
export function noResultsText(typed: string): string {
  return `No results match ${typed}`;
}

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownSearchResult<T extends DropdownOption> {
  options: T[];
  /** Index of the highlighted option (the first remaining one), -1 when none. */
  highlight: number;
  /** The non-selectable no-match row, or null. */
  noResults: string | null;
}

/** R-515: options kept by the typed text, first one highlighted, or the no-match row. */
export function searchDropdownOptions<T extends DropdownOption>(options: readonly T[], typed: string): DropdownSearchResult<T> {
  const kept = options.filter((o) => wordStartMatches(o.label, typed));
  return { options: kept, highlight: kept.length ? 0 : -1, noResults: kept.length ? null : noResultsText(typed) };
}

/** R-515 ArrowDown/ArrowUp move the highlight (HYPOTHESIS: stops at the ends, no wrap). */
export function moveHighlight(index: number, delta: number, length: number): number {
  if (length <= 0) return -1;
  if (index < 0) return delta > 0 ? 0 : length - 1;
  return Math.min(length - 1, Math.max(0, index + delta));
}

/** R-515 button text: the current label, or the placeholder "Select <title>". */
export function dropdownButtonText(title: string, currentLabel: string | null | undefined): string {
  return currentLabel ? currentLabel : `Select ${title}`;
}
