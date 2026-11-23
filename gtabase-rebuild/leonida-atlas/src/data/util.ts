// Deterministic helpers for the sample-data generator (R-1601).
// Every generator stream is derived from the seed text "leonida-atlas" plus a stream name, so
// changing one catalogue never shifts the numbers of another.

export const SEED_TEXT = "leonida-atlas";

/** FNV-1a 32-bit hash of a string. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Small seeded pseudo-random generator (mulberry32). */
export class Rng {
  private state: number;

  constructor(stream: string) {
    this.state = hashString(`${SEED_TEXT}:${stream}`);
  }

  /** Float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Whole number in [min, max] (both inclusive). */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Number in [min, max] rounded to one decimal. */
  dec1(min: number, max: number): number {
    return round1(min + this.next() * (max - min));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("pick from empty list");
    return items[Math.floor(this.next() * items.length)];
  }

  /** New array, Fisher–Yates shuffled. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  /** `count` distinct items (order randomised). */
  sample<T>(items: readonly T[], count: number): T[] {
    return this.shuffle(items).slice(0, Math.min(count, items.length));
  }
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Removes diacritics ("Übermacht" → "Ubermacht", "Huracán" → "Huracan"). */
export function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** URL slug: lower case, accents removed, apostrophes dropped, other runs of non-alphanumerics → "-". */
export function slugify(text: string): string {
  return stripAccents(text)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Heading slug of R-413: lower case, "&" and every other punctuation removed, runs of spaces/dashes → one
 * "-", no leading/trailing "-". (Accents are removed as well so anchors stay ASCII.)
 */
export function headingAnchor(text: string): string {
  return stripAccents(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Natural, case- and accent-insensitive comparison used for catalogue order (R-1606). Digit runs compare
 * numerically; everything else by character code after folding, so the order is identical on every runtime.
 */
export function naturalCompare(a: string, b: string): number {
  const fa = stripAccents(a).toLowerCase();
  const fb = stripAccents(b).toLowerCase();
  const ta = fa.match(/\d+|\D+/g) ?? [];
  const tb = fb.match(/\d+|\D+/g) ?? [];
  const n = Math.min(ta.length, tb.length);
  for (let i = 0; i < n; i++) {
    const x = ta[i];
    const y = tb[i];
    const xd = /^\d/.test(x);
    const yd = /^\d/.test(y);
    if (xd && yd) {
      const diff = Number(x) - Number(y);
      if (diff !== 0) return diff;
      continue;
    }
    if (x !== y) return x < y ? -1 : 1;
  }
  if (ta.length !== tb.length) return ta.length - tb.length;
  return a < b ? -1 : a > b ? 1 : 0;
}

export function capitalize(word: string): string {
  return word.length === 0 ? word : word[0].toUpperCase() + word.slice(1);
}

/** "12500" → "12,500" (R-404 style grouping, used inside own text values). */
export function groupThousands(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Article-style "a"/"an". */
export function withArticle(word: string): string {
  return /^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`;
}

/** Lazily evaluated, memoised value. */
export function lazy<T>(build: () => T): () => T {
  let done = false;
  let value: T;
  return () => {
    if (!done) {
      value = build();
      done = true;
    }
    return value;
  };
}

/** ISO date-time without milliseconds ("2026-11-22T21:46:04Z"). */
export function isoSeconds(ms: number): string {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
}
