/**
 * format — output formatting rules of section 4 (R-401..R-413).
 */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** R-401: "<Month> <day>, <year>" from the UTC calendar date of an ISO date-time. "" when unparsable. */
export function formatLongDate(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export type DateLineKind = "published" | "modified" | "hub";

/**
 * R-402: list/article date line "on <date>", article modified "Last Updated: <date>",
 * hub latest-news line "Published on <date>".
 */
export function dateLine(kind: DateLineKind, iso: string): string {
  const date = formatLongDate(iso);
  switch (kind) {
    case "modified":
      return `Last Updated: ${date}`;
    case "hub":
      return `Published on ${date}`;
    default:
      return `on ${date}`;
  }
}

/** R-404: thousands separator "," without decimals. */
export function formatThousands(n: number): string {
  const rounded = Math.round(Math.abs(n));
  const digits = String(rounded);
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    const fromEnd = digits.length - i;
    out += digits[i];
    if (fromEnd > 1 && fromEnd % 3 === 1) out += ",";
  }
  return (n < 0 && rounded !== 0 ? "-" : "") + out;
}

/** R-404: price pill "$12,500". */
export function formatPrice(n: number): string {
  return n < 0 ? `-$${formatThousands(-n)}` : `$${formatThousands(n)}`;
}

function isKnown(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export type StatScale = 10 | 1000;

/**
 * R-405/R-406/R-533 list-card stat text: 0–10 scale "<value>/10" with the value as stored ("7/10", "8.5/10");
 * 0–1000 scale the whole number; missing → "?".
 */
export function cardStatText(value: number | null | undefined, scale: StatScale): string {
  if (!isKnown(value)) return "?";
  return scale === 10 ? `${value}/10` : String(Math.round(value));
}

export interface CardStatBar {
  text: string;
  /** Bar fill in percent (0 when unknown). */
  widthPercent: number;
  /** `data-state` of the bar (R-533). */
  state: "known" | "unknown";
}

/** R-405/R-533: text + bar width (0–10: value × 10 %, 0–1000: value ÷ 10 %) + known/unknown state. */
export function cardStatBar(value: number | null | undefined, scale: StatScale): CardStatBar {
  if (!isKnown(value)) return { text: "?", widthPercent: 0, state: "unknown" };
  const width = scale === 10 ? value * 10 : value / 10;
  return { text: cardStatText(value, scale), widthPercent: clamp(roundTo(width, 4), 0, 100), state: "known" };
}

/** R-405/R-608: detail-page stat value with exactly one decimal ("4.0", "8.1"); missing → "-" (HYPOTHESIS R-608). */
export function detailStatText(value: number | null | undefined): string {
  return isKnown(value) ? value.toFixed(1) : "-";
}

/** R-608: detail bar width = value × 10 % (0 for a missing value). */
export function detailStatWidth(value: number | null | undefined): number {
  return isKnown(value) ? clamp(roundTo(value * 10, 4), 0, 100) : 0;
}

/**
 * R-410 rating line "<avg one decimal> of 5 (<votes> Votes)", "Vote" when votes = 1.
 * HYPOTHESIS (U-F2-01): always one decimal ("4.0 of 5 (12 Votes)") and the singular "Vote".
 */
export function ratingText(avg: number, votes: number): string {
  const a = isKnown(avg) ? avg : 0;
  const v = isKnown(votes) ? Math.max(0, Math.round(votes)) : 0;
  return `${a.toFixed(1)} of 5 (${v} ${v === 1 ? "Vote" : "Votes"})`;
}

/** R-403: counters use the plural noun for every number ("1 Vehicles"). */
export function countNoun(n: number, plural: string): string {
  return `${n} ${plural}`;
}

/** R-408: "m:ss", minutes unpadded; non-finite or negative → "0:00". */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** R-409: two-digit countdown field (days may use more digits). */
export function twoDigits(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

/**
 * R-413 heading slug: lower case, "&" and every other punctuation removed, runs of spaces/dashes → one "-",
 * no leading/trailing "-". Letters with accents are kept as letters (HYPOTHESIS: no accent folding).
 */
export function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** R-412: "1 marker", "<n> markers". */
export function markerCount(n: number): string {
  return n === 1 ? "1 marker" : `${n} markers`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
