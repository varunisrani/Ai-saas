// Small shared builders for art references and gallery images.

import type { ArtKind, ArtRef, GalleryImage } from "./types";
import { Rng } from "./util";

export function art(kind: ArtKind, id: string): ArtRef {
  return { kind, id };
}

/** Public URL of a placeholder image (route `/art/<kind>/<id>.svg`, section 0.1 row 36). */
export function artUrl(ref: ArtRef): string {
  return `/art/${ref.kind}/${ref.id}.svg`;
}

const SHOT_WORDS: readonly string[] = [
  "at golden hour", "under a thunderhead", "in the rain", "from a rooftop", "at the docks", "near the boardwalk",
  "on the causeway", "in the swamp", "under neon lights", "at sunrise", "by the lighthouse", "in traffic",
  "on a back road", "at the marina", "from the air", "in the cane fields",
];

export interface GalleryImageOptions {
  /** Image id prefix; ids become `<prefix>-01`, `<prefix>-02` … */
  prefix: string;
  count: number;
  /** Subject used in alt texts ("Maibatsu Sanchez"). */
  subject: string;
  /** Word used in the alt text ("screenshot", "artwork"). */
  noun: string;
  width?: number;
  height?: number;
  rng: Rng;
  /** Digits of the running number (2 → "01"). */
  pad?: number;
}

/** Own alt texts and captions for a run of gallery images. */
export function galleryImages(opts: GalleryImageOptions): GalleryImage[] {
  const pad = opts.pad ?? 2;
  const out: GalleryImage[] = [];
  for (let i = 1; i <= opts.count; i++) {
    const n = String(i).padStart(pad, "0");
    const where = opts.rng.pick(SHOT_WORDS);
    const portrait = opts.width === undefined && opts.rng.chance(0.08);
    out.push({
      id: `${opts.prefix}-${n}`,
      alt: `${opts.subject} ${opts.noun} ${i}`,
      caption: `${opts.subject} ${where}.`,
      width: opts.width ?? (portrait ? 1080 : 1920),
      height: opts.height ?? (portrait ? 1350 : 1080),
      art: art("shot", `${opts.prefix}-${n}`),
    });
  }
  return out;
}

/** Rating line data: average 0–5 with one decimal, votes (0 votes → average 0). */
export function makeRating(rng: Rng, zeroChance = 0.15): { average: number; votes: number } {
  if (rng.chance(zeroChance)) return { average: 0, votes: 0 };
  const votes = rng.int(1, 90);
  const average = Math.round((2.4 + rng.next() * 2.6) * 10) / 10;
  return { average: Math.min(5, average), votes };
}
