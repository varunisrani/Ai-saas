/**
 * search — the local results page `/search?q=` (DIVERGENCE D-003; R-1307, R-1308).
 */
import { foldForSearch, queryWords } from "./text";

/** R-1308 group order (document `type` values; the data module's SearchDocument types map onto these). */
export const SEARCH_GROUPS = [
  { type: "hub", label: "GTA 6 sections" },
  { type: "vehicle", label: "Vehicles" },
  { type: "weapon", label: "Weapons" },
  { type: "animal", label: "Animals" },
  { type: "character", label: "Characters" },
  { type: "gang", label: "Gangs & Factions" },
  { type: "property", label: "Properties" },
  { type: "radio", label: "Radio Stations" },
  { type: "mission", label: "Missions" },
  { type: "activity", label: "Activities" },
  { type: "article", label: "Articles" },
  { type: "map-category", label: "Map Categories" },
] as const;

/** R-1308 maximum links per group. */
export const SEARCH_GROUP_LIMIT = 20;
export const SEARCH_EMPTY_MESSAGE = "Type a word to search Leonida Atlas.";

export interface SearchDocumentInput {
  type: string;
  /** Optional group heading (the data module's `typeLabel`); defaults to the SEARCH_GROUPS label. */
  typeLabel?: string;
  title: string;
  /** Articles: the short title (also searched). Ignored for other types. */
  extra?: string | null;
  path: string;
  /** Articles: publishedAt (newest first inside the group). */
  date?: string | null;
}

export interface SearchGroup<T extends SearchDocumentInput> {
  type: string;
  label: string;
  items: T[];
  /** Matches in this group before the 20-link cap. */
  total: number;
}

export interface SearchResult<T extends SearchDocumentInput> {
  groups: SearchGroup<T>[];
  /** Number of matching documents (before the per-group cap). */
  total: number;
  message: string;
}

const titleCollator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

/**
 * R-1308: query and texts lower-cased and accent-stripped, query split on spaces, every word must occur in the
 * title (articles: in the title or short title — HYPOTHESIS: the words may be spread over both); results grouped
 * by type in the fixed order, at most 20 per group, A→Z inside a group (articles newest first). Unknown types come
 * after the known groups in first-seen order.
 * Messages (HYPOTHESIS, own wording): empty q → "Type a word to search Leonida Atlas."; none → "No results for
 * “<q>”."; otherwise "<n> results for “<q>”" ("1 result for …" when n = 1; n counts every match).
 */
export function localSearch<T extends SearchDocumentInput>(query: string, documents: readonly T[]): SearchResult<T> {
  const shown = query.trim();
  const words = queryWords(foldForSearch(query));
  if (!words.length) return { groups: [], total: 0, message: SEARCH_EMPTY_MESSAGE };
  const matches = documents.filter((d) => {
    const text = foldForSearch(d.type === "article" ? `${d.title} ${d.extra ?? ""}` : d.title);
    return words.every((w) => text.includes(w));
  });
  const order: { type: string; label: string }[] = SEARCH_GROUPS.map((g) => ({ type: g.type, label: g.label }));
  for (const d of matches) if (!order.some((g) => g.type === d.type)) order.push({ type: d.type, label: d.typeLabel ?? d.type });
  const groups: SearchGroup<T>[] = [];
  for (const g of order) {
    const items = matches.filter((d) => d.type === g.type);
    if (!items.length) continue;
    items.sort((a, b) =>
      g.type === "article"
        ? (Date.parse(b.date ?? "") || 0) - (Date.parse(a.date ?? "") || 0) || titleCollator.compare(a.title, b.title)
        : titleCollator.compare(a.title, b.title),
    );
    const label = items.find((d) => d.typeLabel)?.typeLabel ?? g.label;
    groups.push({ type: g.type, label, items: items.slice(0, SEARCH_GROUP_LIMIT), total: items.length });
  }
  const total = matches.length;
  const message =
    total === 0 ? `No results for “${shown}”.` : `${total} ${total === 1 ? "result" : "results"} for “${shown}”`;
  return { groups, total, message };
}

/** R-1307: GET /search?q=<text> with form encoding (spaces as "+", nothing trimmed, empty allowed). */
export function searchHref(q: string): string {
  return `/search?${new URLSearchParams({ q }).toString()}`;
}
