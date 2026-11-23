/**
 * radio — the floating player's track rules (R-1014..R-1020).
 */
import { formatTime } from "./format";

/** R-1019 action lock after each play/pause action. */
export const RADIO_ACTION_LOCK_MS = 3000;
/** R-1020 progress refresh interval (ten times per second). */
export const RADIO_PROGRESS_TICK_MS = 100;

export interface RadioTrackInput {
  title: string;
  artist: string;
  /** Audio clip id; none = not playable (R-1014). */
  audioClip?: string | null;
}

export interface RadioStationInput {
  tracks: readonly RadioTrackInput[];
}

export interface TrackRef {
  station: number;
  track: number;
}

/** R-1014: indices of the playable rows of a station (rows with an audio clip). */
export function playableTracks(station: RadioStationInput): number[] {
  const out: number[] = [];
  station.tracks.forEach((t, i) => {
    if (t.audioClip) out.push(i);
  });
  return out;
}

/** R-1015: the first playable track of the first station that has one, or null. */
export function initialCurrent(stations: readonly RadioStationInput[]): TrackRef | null {
  for (let s = 0; s < stations.length; s++) {
    const p = playableTracks(stations[s]);
    if (p.length) return { station: s, track: p[0] };
  }
  return null;
}

function step(current: TrackRef, stations: readonly RadioStationInput[], delta: 1 | -1): TrackRef | null {
  const station = stations[current.station];
  if (!station) return null;
  const p = playableTracks(station);
  if (!p.length) return null;
  const i = p.indexOf(current.track);
  if (i < 0) return { station: current.station, track: p[0] };
  return { station: current.station, track: p[(((i + delta) % p.length) + p.length) % p.length] };
}

/** R-1018: next playable track of the current station, wrapping (never changes station). */
export function nextTrack(current: TrackRef, stations: readonly RadioStationInput[]): TrackRef | null {
  return step(current, stations, 1);
}

/** R-1018: previous playable track of the current station, wrapping. */
export function prevTrack(current: TrackRef, stations: readonly RadioStationInput[]): TrackRef | null {
  return step(current, stations, -1);
}

/** R-1015/R-1017 row button text (shown in capitals): "Pause" only on the current, playing row. */
export function rowButtonText(isCurrent: boolean, playing: boolean): "Play" | "Pause" {
  return isCurrent && playing ? "Pause" : "Play";
}

/** R-1013 artist line "<artist> (<year>)". */
export function trackSubtitle(artist: string, year?: number | string | null): string {
  return year === null || year === undefined || year === "" ? artist : `${artist} (${year})`;
}

/** R-1020 player times and progress fill. */
export function playerTimes(elapsed: number, duration: number): { time: string; duration: string; fraction: number } {
  const d = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const e = Number.isFinite(elapsed) && elapsed > 0 ? elapsed : 0;
  return { time: formatTime(e), duration: formatTime(d), fraction: d > 0 ? Math.min(1, e / d) : 0 };
}

/** R-1020 clicking the progress bar seeks to that fraction (clamped 0–1). */
export function seekFraction(offsetX: number, barWidth: number): number {
  if (!Number.isFinite(offsetX) || !Number.isFinite(barWidth) || barWidth <= 0) return 0;
  return Math.min(1, Math.max(0, offsetX / barWidth));
}

/** R-1019: is a toggle of the same track still locked? */
export function isActionLocked(lastActionAtMs: number | null, nowMs: number, settled: boolean): boolean {
  if (settled || lastActionAtMs === null) return false;
  return nowMs - lastActionAtMs < RADIO_ACTION_LOCK_MS;
}
