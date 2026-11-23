/**
 * Test attribute helper (Conventions TA1–TA5): joins every token that applies to an element into one
 * space-separated `data-testid` value; falsy entries are skipped. Returns undefined when no token applies.
 */
export function tid(...tokens: Array<string | false | null | undefined>): string | undefined {
  const list = tokens.filter((t): t is string => typeof t === "string" && t.length > 0);
  return list.length ? list.join(" ") : undefined;
}

/** Positional tokens (TA3) for the element at 0-based `index` of `count` siblings: `<base>-<n>` and `<base>-last`. */
export function positional(base: string, index: number, count: number, suffix = ""): string[] {
  const out = [`${base}-${index + 1}${suffix}`];
  if (index === count - 1) out.push(`${base}-last${suffix}`);
  return out;
}
