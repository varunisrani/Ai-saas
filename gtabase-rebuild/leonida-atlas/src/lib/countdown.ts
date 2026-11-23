/**
 * countdown — the hub release countdown (R-1318, R-409).
 */
import { twoDigits } from "./format";

/** R-1318 target: 19 November 2026 00:00:00 in the viewer's own time zone. */
export const RELEASE_LOCAL = { year: 2026, monthIndex: 10, day: 19 } as const;
export const COUNTDOWN_OUT_TEXT = "GTA 6 is Out Now!";
export const COUNTDOWN_TICK_MS = 1000;

/**
 * Epoch ms of the target instant for a time-zone offset in minutes with the sign of
 * `Date.prototype.getTimezoneOffset()` (UTC − local; e.g. UTC+2 → −120). Pass the offset that applies on the
 * target date: `new Date(2026, 10, 19).getTimezoneOffset()`.
 */
export function releaseTargetMs(timezoneOffsetMinutes: number): number {
  return Date.UTC(RELEASE_LOCAL.year, RELEASE_LOCAL.monthIndex, RELEASE_LOCAL.day) + timezoneOffsetMinutes * 60_000;
}

export interface CountdownField {
  label: "Days" | "Hours" | "Minutes" | "Seconds";
  value: string;
}

export type CountdownState = { out: false; fields: CountdownField[] } | { out: true; text: string };

/**
 * R-1318: four two-digit fields (days may use more digits), each rounded down; during the last second all read 00;
 * once the remaining time is negative the single line "GTA 6 is Out Now!" replaces them for good.
 */
export function countdownState(nowMs: number, timezoneOffsetMinutes: number): CountdownState {
  const remaining = releaseTargetMs(timezoneOffsetMinutes) - nowMs;
  if (remaining < 0) return { out: true, text: COUNTDOWN_OUT_TEXT };
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    out: false,
    fields: [
      { label: "Days", value: twoDigits(days) },
      { label: "Hours", value: twoDigits(hours) },
      { label: "Minutes", value: twoDigits(minutes) },
      { label: "Seconds", value: twoDigits(seconds) },
    ],
  };
}
