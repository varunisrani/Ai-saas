"use client";

/**
 * Radio player (R-1013..R-1021; DIVERGENCE D-009: own local audio clips instead of a video service).
 *
 *   <RadioProvider stations={…} clips={{ "clip-1": "/audio/clip-1.wav", … }}>
 *     <TrackTable station={0} /> …            (one table per station)
 *     <FloatingPlayer />                       (the fixed bottom bar; one per page)
 *   </RadioProvider>
 *
 * Station detail pages use the same provider with a single station (R-616, R-1021).
 * Readiness: the player is ready once the audio engine loaded the metadata of the first playable track; a
 * hidden engine marker (token `youtube-iframe`) is added at that moment. Until ready Play/Next/Previous/toggle
 * change nothing on screen; a Play click is remembered and started when ready. If the clips cannot be fetched
 * the player never becomes ready.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  RADIO_PROGRESS_TICK_MS,
  initialCurrent,
  isActionLocked,
  nextTrack,
  playableTracks,
  playerTimes,
  prevTrack,
  rowButtonText,
  seekFraction,
  trackSubtitle,
  type TrackRef,
} from "@/lib";

export interface RadioTrackData {
  number: number;
  title: string;
  artist: string;
  year?: number;
  audioClip?: string;
}

export interface RadioStationData {
  slug: string;
  name: string;
  path: string;
  genre: string;
  tracks: RadioTrackData[];
}

interface RadioState {
  stations: RadioStationData[];
  current: TrackRef | null;
  playing: boolean;
  ready: boolean;
  elapsed: number;
  duration: number;
  playRow: (ref: TrackRef) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (fraction: number) => void;
}

const Ctx = createContext<RadioState | null>(null);

function useRadio(): RadioState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("RadioProvider missing");
  return ctx;
}

function same(a: TrackRef | null, b: TrackRef | null): boolean {
  return !!a && !!b && a.station === b.station && a.track === b.track;
}

export function RadioProvider({
  stations,
  clips,
  children,
}: {
  stations: RadioStationData[];
  clips: Record<string, string>;
  children: ReactNode;
}) {
  const first = useMemo(() => initialCurrent(stations), [stations]);
  const [current, setCurrent] = useState<TrackRef | null>(first);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const readyRef = useRef(false);
  const currentRef = useRef<TrackRef | null>(first);
  const playingRef = useRef(false);
  const pendingRef = useRef<TrackRef | null>(null);
  const lastActionRef = useRef<number | null>(null);
  const settledRef = useRef(true);
  const startingRef = useRef(false);
  const failuresRef = useRef(0);
  const startedRef = useRef(false);

  const urlOf = useCallback(
    (ref: TrackRef | null): string | null => {
      if (!ref) return null;
      const clip = stations[ref.station]?.tracks[ref.track]?.audioClip;
      return clip ? clips[clip] ?? null : null;
    },
    [stations, clips],
  );

  const startTrack = useCallback(
    (ref: TrackRef) => {
      const audio = audioRef.current;
      const url = urlOf(ref);
      if (!audio || !url) return;
      currentRef.current = ref;
      playingRef.current = true;
      startingRef.current = true;
      startedRef.current = false;
      settledRef.current = false;
      lastActionRef.current = Date.now();
      setCurrent(ref);
      setPlaying(true);
      setElapsed(0);
      setDuration(0);
      const abs = new URL(url, window.location.href).href;
      if (audio.src !== abs) audio.src = url;
      try {
        audio.currentTime = 0;
      } catch {
        /* not seekable yet */
      }
      const p = audio.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    },
    [urlOf],
  );

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    playingRef.current = false;
    startingRef.current = false;
    settledRef.current = false;
    lastActionRef.current = Date.now();
    setPlaying(false);
    audio?.pause();
  }, []);

  // audio engine + readiness
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;
    const onMeta = () => {
      if (!readyRef.current) {
        readyRef.current = true;
        setReady(true);
        const pending = pendingRef.current;
        pendingRef.current = null;
        if (pending) startTrack(pending);
      }
    };
    const onPlaying = () => {
      settledRef.current = true;
      startingRef.current = false;
      startedRef.current = true;
      failuresRef.current = 0;
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onPause = () => {
      settledRef.current = true;
      startingRef.current = false;
    };
    const advance = (failed: boolean) => {
      const cur = currentRef.current;
      if (!cur) return;
      if (failed) {
        failuresRef.current += 1;
        const lap = playableTracks(stations[cur.station]).length;
        if (failuresRef.current >= lap) {
          failuresRef.current = 0;
          stopPlayback();
          return;
        }
      }
      const n = nextTrack(cur, stations);
      if (n) startTrack(n);
    };
    const onEnded = () => advance(false);
    const onError = () => {
      if (!readyRef.current) return; // never ready when the clips cannot be fetched
      if (playingRef.current) advance(true);
    };
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    const firstUrl = urlOf(first);
    if (firstUrl) {
      audio.src = firstUrl;
      try {
        audio.load();
      } catch {
        /* ignore */
      }
    }
    return () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.removeAttribute("src");
      audioRef.current = null;
      readyRef.current = false;
    };
  }, [first, stations, urlOf, startTrack, stopPlayback]);

  // progress ten times per second while playing
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const audio = audioRef.current;
      if (!audio || !startedRef.current) return;
      setElapsed(audio.currentTime);
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    }, RADIO_PROGRESS_TICK_MS);
    return () => window.clearInterval(id);
  }, [playing]);

  const playRow = useCallback(
    (ref: TrackRef) => {
      if (!urlOf(ref)) return;
      if (!readyRef.current) {
        pendingRef.current = ref;
        return;
      }
      if (same(ref, currentRef.current) && (playingRef.current || startedRef.current)) {
        // the current row's button toggles
        toggleRef.current();
        return;
      }
      startTrack(ref);
    },
    [startTrack, urlOf],
  );

  const toggle = useCallback(() => {
    if (!readyRef.current) {
      if (currentRef.current) pendingRef.current = currentRef.current;
      return;
    }
    const cur = currentRef.current;
    if (!cur) return;
    const now = Date.now();
    if (playingRef.current) {
      // while a track is still starting, a toggle pauses it (R-1019)
      if (!startingRef.current && isActionLocked(lastActionRef.current, now, settledRef.current)) return;
      stopPlayback();
      return;
    }
    if (isActionLocked(lastActionRef.current, now, settledRef.current)) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (!startedRef.current) {
      startTrack(cur);
      return;
    }
    playingRef.current = true;
    startingRef.current = true;
    settledRef.current = false;
    lastActionRef.current = now;
    setPlaying(true);
    const p = audio.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [startTrack, stopPlayback]);

  const toggleRef = useRef(toggle);
  useEffect(() => {
    toggleRef.current = toggle;
  }, [toggle]);

  const move = useCallback(
    (dir: 1 | -1) => {
      if (!readyRef.current) return;
      const cur = currentRef.current;
      if (!cur) return;
      const n = dir === 1 ? nextTrack(cur, stations) : prevTrack(cur, stations);
      if (n) startTrack(n);
    },
    [stations, startTrack],
  );

  const seek = useCallback((fraction: number) => {
    const audio = audioRef.current;
    if (!audio || !readyRef.current || !startedRef.current || !Number.isFinite(audio.duration)) return;
    audio.currentTime = fraction * audio.duration;
    setElapsed(audio.currentTime);
  }, []);

  const value = useMemo<RadioState>(
    () => ({
      stations,
      current,
      playing,
      ready,
      elapsed,
      duration,
      playRow,
      toggle,
      next: () => move(1),
      prev: () => move(-1),
      seek,
    }),
    [stations, current, playing, ready, elapsed, duration, playRow, toggle, move, seek],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Tracklist table of one station ("#", "Track", "Play"); rows without a clip keep a hidden Play button. */
export function TrackTable({ station, tokens = true }: { station: number; tokens?: boolean }) {
  const { stations, current, playing, playRow } = useRadio();
  const st = stations[station];
  if (!st) return null;
  const playable = playableTracks(st);
  const sNo = station + 1;
  const last = st.tracks.length - 1;
  return (
    <table className="atlas-table atlas-tracks">
      <thead>
        <tr>
          {["#", "Track", "Play"].map((h) => (
            <th key={h} scope="col" data-testid={tokens && station === 0 ? "tracklist-header" : undefined}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {st.tracks.map((t, i) => {
          const ref = { station, track: i };
          const isCurrent = same(ref, current);
          const text = rowButtonText(isCurrent, playing);
          const canPlay = !!t.audioClip;
          const pos: string[] = [];
          const titlePos: string[] = [];
          if (tokens && sNo === 1) {
            if (i < 3) {
              pos.push(`s1-track${i + 1}-play`);
              titlePos.push(`s1-track${i + 1}-title`);
            }
            if (i === last) {
              pos.push("s1-last-play");
              titlePos.push("s1-last-title");
            }
          }
          if (tokens && sNo === 3) {
            const k = playable.indexOf(i);
            if (k === 0) {
              pos.push("s3-first-play");
              titlePos.push("s3-first-title");
            }
            if (k === 1) {
              pos.push("s3-second-play");
              titlePos.push("s3-second-title");
            }
          }
          const btn = ["track-play", canPlay ? "track-play-visible" : "track-play-hidden", ...pos];
          if (canPlay && text === "Pause") btn.push("track-play-pause-state");
          return (
            <tr key={t.number} className={isCurrent ? "is-current" : undefined}>
              <td>{t.number}</td>
              <td>
                <strong data-testid={titlePos.length ? titlePos.join(" ") : undefined}>{t.title}</strong>
                <span className="atlas-track-artist" data-testid={tokens && sNo === 1 && i === 0 ? "s1-track1-artist" : undefined}>
                  {trackSubtitle(t.artist, t.year)}
                </span>
              </td>
              <td>
                <button
                  type="button"
                  className="atlas-track-play"
                  hidden={!canPlay}
                  data-state={text === "Pause" ? "pause" : "play"}
                  aria-label={`${text} ${t.title}`}
                  data-testid={btn.join(" ")}
                  onClick={() => playRow(ref)}
                >
                  {text}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** The fixed bottom bar: title, artist, "m:ss / m:ss" over a clickable progress bar, previous / toggle / next. */
export function FloatingPlayer() {
  const { stations, current, playing, ready, elapsed, duration, toggle, next, prev, seek } = useRadio();
  const track = current ? stations[current.station]?.tracks[current.track] : undefined;
  const times = playerTimes(elapsed, duration);
  return (
    <div className="atlas-player" data-testid="floating-player" role="region" aria-label="Radio player">
      <div className="atlas-player-inner">
        <div className="atlas-player-meta" aria-live="polite">
          <div className="atlas-player-title" data-testid="player-title">
            {track?.title ?? ""}
          </div>
          <div className="atlas-player-artist" data-testid="player-artist">
            {track ? trackSubtitle(track.artist, track.year) : ""}
          </div>
        </div>
        <div className="atlas-player-controls">
          <button type="button" className="atlas-player-btn" aria-label="Previous track" title="Previous track" data-testid="player-prev" onClick={prev}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
              <path d="M7 5v14M19 5l-10 7 10 7z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="atlas-player-btn is-main" aria-label="Play/Pause" title="Play/Pause" data-testid="player-toggle" onClick={toggle}>
            <span data-testid="player-toggle-icon" data-state={playing ? "playing" : "paused"} aria-hidden="true">
              {playing ? (
                <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
                  <path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
                  <path d="M8 5l11 7-11 7z" fill="currentColor" />
                </svg>
              )}
            </span>
          </button>
          <button type="button" className="atlas-player-btn" aria-label="Next track" title="Next track" data-testid="player-next" onClick={next}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
              <path d="M17 5v14M5 5l10 7-10 7z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="atlas-player-progress">
          <span data-testid="player-time">{times.time}</span>
          <div
            className="atlas-player-bar"
            role="progressbar"
            aria-label="Track progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(times.fraction * 100)}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              seek(seekFraction(e.clientX - r.left, r.width));
            }}
          >
            <span className="atlas-player-fill" style={{ width: `${times.fraction * 100}%` }} />
          </div>
          <span data-testid="player-duration">{times.duration}</span>
        </div>
      </div>
      {ready ? <div className="atlas-player-engine" aria-hidden="true" data-testid="youtube-iframe" /> : null}
    </div>
  );
}
