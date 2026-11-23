import { describe, expect, it } from "vitest";
import {
  initialCurrent,
  isActionLocked,
  nextTrack,
  playableTracks,
  playerTimes,
  prevTrack,
  rowButtonText,
  seekFraction,
  trackSubtitle,
  RADIO_ACTION_LOCK_MS,
} from "./radio";

const track = (n: number, playable: boolean) => ({ title: `Track ${n}`, artist: "Artist", audioClip: playable ? `clip-${n % 8}` : null });
/** R-1622: station 1 has 14 playable tracks; station 3: row 1 not playable, rows 2 and 3 playable; station 8 none. */
const STATIONS = [
  { tracks: Array.from({ length: 14 }, (_, i) => track(i + 1, true)) },
  { tracks: [track(1, true), track(2, false)] },
  { tracks: [track(1, false), track(2, true), track(3, true), track(4, false)] },
  { tracks: [track(1, false), track(2, false)] },
];

describe("R-1014 / R-1015 playable rows and the initial track", () => {
  it("playable = rows with a clip; a station without one is skipped", () => {
    expect(playableTracks(STATIONS[2])).toEqual([1, 2]);
    expect(playableTracks(STATIONS[3])).toEqual([]);
    expect(initialCurrent(STATIONS)).toEqual({ station: 0, track: 0 });
    expect(initialCurrent([STATIONS[3], STATIONS[2]])).toEqual({ station: 1, track: 1 });
    expect(initialCurrent([])).toBeNull();
  });
});

describe("R-1017 / R-1018 next and previous wrap inside the station", () => {
  it("F6-10..F6-14 station 1", () => {
    let cur = { station: 0, track: 1 }; // F6-10 s1-track2
    cur = nextTrack(cur, STATIONS)!;
    expect(cur.track).toBe(2); // F6-11 track 3
    cur = prevTrack(prevTrack(cur, STATIONS)!, STATIONS)!;
    expect(cur.track).toBe(0); // F6-12 track 1
    cur = prevTrack(cur, STATIONS)!;
    expect(cur.track).toBe(13); // F6-13 last
    cur = nextTrack(cur, STATIONS)!;
    expect(cur.track).toBe(0); // F6-14 track 1
  });
  it("F6-15 / F6-16 station 3: first playable → second playable, never another station", () => {
    const first = { station: 2, track: playableTracks(STATIONS[2])[0] };
    const second = nextTrack(first, STATIONS)!;
    expect(second).toEqual({ station: 2, track: 2 });
    expect(nextTrack(second, STATIONS)).toEqual(first);
    expect(nextTrack({ station: 3, track: 0 }, STATIONS)).toBeNull();
  });
});

describe("R-1015 / R-1017 / R-1020 player texts", () => {
  it("row button reads Pause only on the playing current row", () => {
    expect(rowButtonText(true, true).toUpperCase()).toBe("PAUSE");
    expect(rowButtonText(true, false)).toBe("Play");
    expect(rowButtonText(false, true)).toBe("Play");
  });
  it("F6-09 times start at 0:00 / 0:00; progress fraction; seek", () => {
    expect(playerTimes(0, Number.NaN)).toEqual({ time: "0:00", duration: "0:00", fraction: 0 });
    expect(playerTimes(4.5, 9)).toEqual({ time: "0:04", duration: "0:09", fraction: 0.5 });
    expect(seekFraction(50, 200)).toBe(0.25);
    expect(seekFraction(-5, 200)).toBe(0);
    expect(seekFraction(500, 200)).toBe(1);
    expect(trackSubtitle("Neon Static", 1986)).toBe("Neon Static (1986)");
  });
  it("R-1019 action lock up to 3 s or until settled", () => {
    expect(RADIO_ACTION_LOCK_MS).toBe(3000);
    expect(isActionLocked(1000, 2000, false)).toBe(true);
    expect(isActionLocked(1000, 4000, false)).toBe(false);
    expect(isActionLocked(1000, 2000, true)).toBe(false);
    expect(isActionLocked(null, 2000, false)).toBe(false);
  });
});
