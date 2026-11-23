import { describe, expect, it } from "vitest";
import { COUNTDOWN_OUT_TEXT, countdownState, releaseTargetMs } from "./countdown";

const UTC_TARGET = Date.UTC(2026, 10, 19);

describe("R-1318 countdown", () => {
  it("target is local midnight of 19 Nov 2026 (offset in getTimezoneOffset sign)", () => {
    expect(releaseTargetMs(0)).toBe(UTC_TARGET);
    expect(releaseTargetMs(-120)).toBe(UTC_TARGET - 2 * 3600_000); // UTC+2 reaches midnight earlier
    expect(releaseTargetMs(300)).toBe(UTC_TARGET + 5 * 3600_000); // UTC−5
  });
  it("four two-digit fields, rounded down", () => {
    const now = UTC_TARGET - (3 * 86400 + 4 * 3600 + 5 * 60 + 6) * 1000 - 500;
    const s = countdownState(now, 0);
    expect(s).toEqual({
      out: false,
      fields: [
        { label: "Days", value: "03" },
        { label: "Hours", value: "04" },
        { label: "Minutes", value: "05" },
        { label: "Seconds", value: "06" },
      ],
    });
    const far = countdownState(UTC_TARGET - 150 * 86400_000, 0);
    expect(far.out === false && far.fields[0].value).toBe("150");
  });
  it("during the last second all fields read 00; negative → out for good", () => {
    const last = countdownState(UTC_TARGET - 999, 0);
    expect(last.out === false && last.fields.map((f) => f.value)).toEqual(["00", "00", "00", "00"]);
    expect(countdownState(UTC_TARGET, 0).out).toBe(false);
    expect(countdownState(UTC_TARGET + 1, 0)).toEqual({ out: true, text: COUNTDOWN_OUT_TEXT });
  });
  it("F9-01 / F9-39 on 2026-11-23 the release is past: 'GTA 6 IS OUT NOW!' and no digit field", () => {
    const s = countdownState(Date.parse("2026-11-23T10:44:40Z"), -60);
    expect(s.out).toBe(true);
    expect(s.out && s.text.toUpperCase()).toBe("GTA 6 IS OUT NOW!");
  });
});
