/**
 * map-search — the map search box: normalisation, typo tolerance, marker hits, category rows, messages
 * (R-834..R-839).
 */
import { collectingOrder, markerNumbers, type MarkerNumbers } from "./map-order";
import type { MapMarkerInput } from "./map-store";
import { stripAccents } from "./text";

/** R-836 maximum listed options. */
export const MAP_SEARCH_MAX_HITS = 30;

/**
 * R-835: lower case, accents removed, "&" read as " and ", apostrophes dropped, every other run of
 * non-letters/digits → one space, trimmed.
 */
export function normalizeMapText(text: string): string {
  return stripAccents(text.toLowerCase())
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’‘ʼ`´]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Optimal-string-alignment distance: insert, delete, substitute, and a swap of two adjacent letters = 1 edit. */
export function editDistance(a: string, b: string): number {
  const s = Array.from(a);
  const t = Array.from(b);
  const m = s.length;
  const n = t.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) v = Math.min(v, d[i - 2][j - 2] + 1);
      d[i][j] = v;
    }
  }
  return d[m][n];
}

/** R-836 marker typo allowance by query-word length: 4–7 letters → 1 edit, 8 or more → 2, shorter → 0. */
export function markerTypoAllowance(length: number): number {
  return length >= 8 ? 2 : length >= 4 ? 1 : 0;
}

/** R-838 category-row typo allowance: 1 edit from 5 letters, 2 from 8. */
export function categoryTypoAllowance(length: number): number {
  return length >= 8 ? 2 : length >= 5 ? 1 : 0;
}

/**
 * A query word matches a text word within `allowed` edits; a longer text word may also match by its prefix
 * (HYPOTHESIS: the allowance is decided by the query word's length).
 */
export function typoWordMatch(word: string, textWords: readonly string[], allowed: number): boolean {
  if (allowed <= 0) return false;
  const len = Array.from(word).length;
  for (const tw of textWords) {
    if (editDistance(word, tw) <= allowed) return true;
    const twChars = Array.from(tw);
    if (twChars.length > len && editDistance(word, twChars.slice(0, len).join("")) <= allowed) return true;
  }
  return false;
}

function wordsOf(text: string): string[] {
  return text.split(" ").filter(Boolean);
}

/** Every query word occurs in the text or is within the typo allowance of one of its words. */
function tolerantAllWords(queryWords: readonly string[], text: string, allowance: (len: number) => number): boolean {
  const tw = wordsOf(text);
  return queryWords.every((w) => text.includes(w) || typoWordMatch(w, tw, allowance(Array.from(w).length)));
}

export interface MapCategoryInput {
  id: string;
  name: string;
  group?: string;
  multiSpawn?: boolean;
  trackable?: boolean;
}

export interface MapGroupInput {
  id: string;
  name: string;
}

export interface MarkerHit<M extends MapMarkerInput = MapMarkerInput> {
  marker: M;
  score: 1 | 2 | 3 | 4;
  number: number;
  categoryName: string;
  /** Option second line "<Category> #<n>". */
  line: string;
}

export interface MarkerSearchResult<M extends MapMarkerInput = MapMarkerInput> {
  /** At most 30 hits, best first. */
  hits: MarkerHit<M>[];
  /** Number of all hits. */
  total: number;
}

const numbersCache = new WeakMap<readonly MapMarkerInput[], Map<string, MarkerNumbers>>();

/** Collecting-order numbers of every category (cached per markers array). */
export function categoryNumbers(
  markers: readonly MapMarkerInput[],
  categories: readonly MapCategoryInput[],
): Map<string, MarkerNumbers> {
  let cached = numbersCache.get(markers);
  if (!cached) {
    cached = new Map();
    numbersCache.set(markers, cached);
  }
  for (const c of categories) {
    if (cached.has(c.id)) continue;
    const own = markers.filter((m) => m.category === c.id);
    cached.set(c.id, markerNumbers(collectingOrder(own), Boolean(c.multiSpawn)));
  }
  return cached;
}

/**
 * R-836 marker hits, best first: 4 — the name contains the query (or the query without spaces is in the name
 * without spaces); 3 — "<category name> <number>" contains it; 2 — every query word is in the name/category text or
 * within the typo allowance of one of its words; 1 — every query word is in the description. Order: score, category
 * order, number. An empty normalised query gives no hits (R-835).
 */
export function searchMarkers<M extends MapMarkerInput>(
  query: string,
  markers: readonly M[],
  categories: readonly MapCategoryInput[],
): MarkerSearchResult<M> {
  const q = normalizeMapText(query);
  if (!q) return { hits: [], total: 0 };
  const qWords = wordsOf(q);
  const qNoSpace = q.replace(/ /g, "");
  const catIndex = new Map(categories.map((c, i) => [c.id, i]));
  const catById = new Map(categories.map((c) => [c.id, c]));
  const numbers = categoryNumbers(markers, categories);
  const hits: MarkerHit<M>[] = [];
  for (const m of markers) {
    const cat = catById.get(m.category);
    if (!cat) continue;
    const number = numbers.get(cat.id)?.numbers.get(m.id) ?? 0;
    const name = normalizeMapText(m.name);
    const catName = normalizeMapText(cat.name);
    let score: 0 | 1 | 2 | 3 | 4 = 0;
    if (name.includes(q) || name.replace(/ /g, "").includes(qNoSpace)) score = 4;
    else if (`${catName} ${number}`.includes(q)) score = 3;
    else if (tolerantAllWords(qWords, `${name} ${catName}`, markerTypoAllowance)) score = 2;
    else {
      const desc = normalizeMapText(m.description ?? "");
      if (desc && qWords.every((w) => desc.includes(w))) score = 1;
    }
    if (score > 0) {
      hits.push({ marker: m, score: score as 1 | 2 | 3 | 4, number, categoryName: cat.name, line: `${cat.name} #${number}` });
    }
  }
  hits.sort(
    (a, b) =>
      b.score - a.score ||
      (catIndex.get(a.marker.category) ?? 0) - (catIndex.get(b.marker.category) ?? 0) ||
      a.number - b.number ||
      (a.marker.id < b.marker.id ? -1 : a.marker.id > b.marker.id ? 1 : 0),
  );
  return { hits: hits.slice(0, MAP_SEARCH_MAX_HITS), total: hits.length };
}

export interface VisibleRows {
  categoryIds: Set<string>;
  groupIds: Set<string>;
  rowsLeft: number;
}

function rowTextMatches(q: string, text: string): boolean {
  const t = normalizeMapText(text);
  if (!t) return false;
  if (t.includes(q)) return true;
  return tolerantAllWords(wordsOf(q), t, categoryTypoAllowance);
}

/**
 * R-838: a category row stays when its category name or its group name matches (contains, or typo tolerance
 * 1 edit from 5 letters, 2 from 8); groups without remaining rows are hidden. Empty query → every row.
 */
export function visibleCategoryRows(
  query: string,
  categories: readonly MapCategoryInput[],
  groups: readonly MapGroupInput[],
): VisibleRows {
  const q = normalizeMapText(query);
  const groupName = new Map(groups.map((g) => [g.id, g.name]));
  const categoryIds = new Set<string>();
  const groupIds = new Set<string>();
  for (const c of categories) {
    const gName = c.group ? groupName.get(c.group) ?? "" : "";
    if (!q || rowTextMatches(q, c.name) || (gName && rowTextMatches(q, gName))) {
      categoryIds.add(c.id);
      if (c.group) groupIds.add(c.group);
    }
  }
  return { categoryIds, groupIds, rowsLeft: categoryIds.size };
}

export interface MapSearchMessages {
  /** Line under the box about markers, or null. */
  marker: string | null;
  /** Line in the sidebar about category rows, or null. */
  category: string | null;
}

/**
 * R-837/R-838 messages (plain text, never markup): no hit → 'No marker matches "<query trimmed>".'; more than 30 →
 * '<rest> more, type a bit more of the name.'; no row left → 'No category matches "<query trimmed>".'. An empty
 * normalised query shows nothing (R-835).
 */
export function mapSearchMessages(rawQuery: string, totalHits: number, rowsLeft: number): MapSearchMessages {
  if (!normalizeMapText(rawQuery)) return { marker: null, category: null };
  const shown = rawQuery.trim();
  let marker: string | null = null;
  if (totalHits === 0) marker = `No marker matches "${shown}".`;
  else if (totalHits > MAP_SEARCH_MAX_HITS) marker = `${totalHits - MAP_SEARCH_MAX_HITS} more, type a bit more of the name.`;
  return { marker, category: rowsLeft === 0 ? `No category matches "${shown}".` : null };
}

/** R-839 Enter: the active hit, or the first hit when none is active. */
export function enterTargetIndex(activeIndex: number, hitCount: number): number {
  if (hitCount <= 0) return -1;
  return activeIndex >= 0 && activeIndex < hitCount ? activeIndex : 0;
}
