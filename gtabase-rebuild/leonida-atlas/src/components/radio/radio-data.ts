// Serializable player input built from the sample data (server side).
import { audioClips, type RadioStation } from "@/data";
import type { RadioStationData } from "./RadioPlayer";

export function radioStationData(s: RadioStation): RadioStationData {
  return {
    slug: s.slug,
    name: s.name,
    path: s.canonicalPath,
    genre: s.genre,
    tracks: s.tracks.map((t) => ({ number: t.number, title: t.title, artist: t.artist, year: t.year, audioClip: t.audioClip })),
  };
}

export function radioClipUrls(): Record<string, string> {
  return Object.fromEntries(audioClips.map((c) => [c.id, c.file]));
}
