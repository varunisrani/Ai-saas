// Placeholder artwork descriptors (section 20, D-UI-6): deterministic, own palette, motif per kind.

import type { ArtDescriptor, ArtKind, ArtMotif } from "./types";
import { manufacturers, vehicles } from "./vehicles";
import { weapons } from "./weapons";
import { animals, characters, gangs, properties, radioStations } from "./guides";
import { activities, missions } from "./missions";
import { markers } from "./map";
import { articles, guideSectionLinks } from "./articles";
import { galleries } from "./galleries";
import { hub } from "./hub";
import { displayName } from "./lookup";
import { hashString, lazy, slugify } from "./util";

/** Own palette tokens (D-UI-3): ink, deep teal, lagoon, sunset coral, sand, white. */
export const artPalette: readonly string[] = ["#14161B", "#0E4D4F", "#1F8A8A", "#FF6A4D", "#F6EEDF", "#FFFFFF"];

/** Gradient pairs with enough contrast for a caption label. */
const PAIRS: [number, number][] = [
  [1, 2], [1, 3], [0, 1], [0, 2], [2, 4], [3, 4], [1, 4], [0, 3], [2, 3], [3, 5],
];

const DEFAULT_SIZE: Record<ArtKind, [number, number]> = {
  vehicle: [640, 360],
  weapon: [640, 360],
  animal: [640, 480],
  character: [480, 600],
  gang: [640, 360],
  property: [640, 360],
  station: [400, 400],
  mission: [640, 360],
  activity: [640, 360],
  article: [1200, 675],
  shot: [1920, 1080],
  logo: [128, 128],
  card: [640, 360],
  banner: [1200, 320],
  map: [640, 480],
  marker: [640, 360],
  video: [1280, 720],
};

const MOTIF: Record<ArtKind, ArtMotif> = {
  vehicle: "silhouette",
  weapon: "bars",
  animal: "leaf",
  character: "bust",
  gang: "bust",
  property: "horizon",
  station: "wave",
  mission: "horizon",
  activity: "horizon",
  article: "dunes",
  shot: "dunes",
  logo: "monogram",
  card: "horizon",
  banner: "dunes",
  map: "island",
  marker: "horizon",
  video: "play",
};

interface Known {
  label: string;
  width?: number;
  height?: number;
  motif?: ArtMotif;
}

const known = lazy(() => {
  const m = new Map<string, Known>();
  const put = (kind: ArtKind, id: string, k: Known) => {
    const key = `${kind}/${id}`;
    if (!m.has(key)) m.set(key, k);
  };
  for (const v of vehicles) put("vehicle", v.slug, { label: displayName(v) });
  for (const w of weapons) put("weapon", w.slug, { label: displayName(w) });
  for (const a of animals) put("animal", a.slug, { label: a.name, motif: a.grid === "sea" ? "wave" : "leaf" });
  for (const c of characters) put("character", c.slug ?? slugify(c.name), { label: c.name });
  for (const g of gangs) put("gang", g.slug, { label: g.name });
  for (const p of properties) {
    put("property", p.slug, { label: p.name });
    put("map", `property-${p.slug}`, { label: p.name });
  }
  for (const r of radioStations) put("station", r.slug, { label: r.name });
  for (const ms of missions) put("mission", ms.slug, { label: ms.title });
  for (const a of activities) put("activity", a.slug, { label: a.name });
  for (const mk of markers) put("marker", mk.id, { label: mk.name });
  for (const a of articles) {
    put("article", a.slug, { label: a.shortTitle });
    if (a.videoPlaceholder) put("video", a.videoPlaceholder.id, { label: a.shortTitle });
  }
  for (const c of characters) if (c.video) put("video", c.video.id, { label: c.name });
  for (const mf of manufacturers) put("logo", mf.id, { label: mf.monogram });
  for (const s of guideSectionLinks) put("card", s.image.id, { label: s.title });
  for (const g of hub.cardGrids) for (const c of g.cards) put("card", c.image.id, { label: c.label });
  put("banner", hub.banner.id, { label: "GTA 6" });
  const shots = [
    ...galleries.flatMap((g) => g.images),
    ...vehicles.flatMap((v) => v.gallery ?? []),
    ...weapons.flatMap((w) => w.gallery),
    ...animals.flatMap((a) => a.gallery),
    ...characters.flatMap((c) => [...c.screenshots, ...c.artworks]),
  ];
  for (const s of shots) put("shot", s.art.id, { label: s.caption.replace(/\.$/, ""), width: s.width, height: s.height });
  return m;
});

const ART_KINDS = new Set<ArtKind>(Object.keys(DEFAULT_SIZE) as ArtKind[]);

/**
 * Descriptor of a placeholder image (`/art/<kind>/<id>.svg`), or undefined when the kind or id is not part
 * of the sample data (the route then answers 404).
 */
export function artFor(kind: string, id: string): ArtDescriptor | undefined {
  if (!ART_KINDS.has(kind as ArtKind)) return undefined;
  const k = kind as ArtKind;
  const entry = known().get(`${k}/${id}`);
  if (!entry) return undefined;
  const h = hashString(`${k}/${id}`);
  const [w, hgt] = DEFAULT_SIZE[k];
  return {
    kind: k,
    id,
    width: entry.width ?? w,
    height: entry.height ?? hgt,
    palette: PAIRS[h % PAIRS.length],
    motif: entry.motif ?? MOTIF[k],
    label: entry.label,
    variant: (h >>> 8) % 8,
  };
}
