// Media galleries (R-1623, fixture row "gallery" of 16.2): page galleries of section 12 plus lookups of the
// item galleries that live on the detail entities.

import type { Gallery, GalleryImage } from "./types";
import { art } from "./media";
import { Rng } from "./util";

const SCENES: readonly string[] = [
  "Sunset over the causeway", "Rain on the neon mile", "Airboat in the glades", "Beach volleyball at noon",
  "Traffic on the coastal highway", "Fishing pier at dawn", "Storm clouds over the keys", "A quiet motel parking lot",
  "Flamingos on a golf course", "Night market crowd", "Cargo ships at the docks", "Speedboat wake",
  "Police roadblock", "Rooftop pool party", "Swamp shack with a porch light", "Drive-in cinema",
  "Gas station at 3 a.m.", "Helicopter over downtown", "Street race start line", "Palm trees in a hurricane",
];

function images(prefix: string, count: number, subject: string, rng: Rng, size?: [number, number]): GalleryImage[] {
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(3, "0");
    const scene = rng.pick(SCENES);
    return {
      id: `${prefix}-${n}`,
      alt: `${subject} ${i + 1}: ${scene.toLowerCase()}`,
      caption: `${scene}.`,
      width: size ? size[0] : 1920,
      height: size ? size[1] : 1080,
      art: art("shot", `${prefix}-${n}`),
    };
  });
}

const ARTWORK_BLOCKS: [heading: string, count: number][] = [
  ["Key Art", 8],
  ["Characters", 12],
  ["Vehicles", 6],
  ["Places", 5],
  ["Wildlife", 4],
  ["Wallpapers", 7],
];

const MAP_LOCATION_BLOCKS: [heading: string, count: number][] = [
  ["Coralwood County", 8],
  ["Saltgrass County", 6],
  ["Palmhaven County", 5],
  ["Mangrove Reach", 5],
  ["Sunbreak Keys", 4],
  ["Offshore Islands", 4],
];

export const galleries: Gallery[] = (() => {
  const rng = new Rng("galleries");
  const out: Gallery[] = [
    { id: "screenshots", pagePath: "/gta-6/screenshots/", mode: "grid", images: images("screenshot", 260, "GTA 6 screenshot", rng) },
    { id: "trailers", pagePath: "/gta-6/screenshots/trailers/", mode: "grid", images: images("trailer-screen", 150, "GTA 6 trailer screen", rng) },
  ];
  ARTWORK_BLOCKS.forEach(([heading, count], i) => {
    out.push({
      id: `artworks-${i + 1}`,
      pagePath: "/gta-6/artworks/",
      heading: `GTA 6 Artworks: ${heading}`,
      mode: "grid",
      images: images(`artwork-${i + 1}`, count, `GTA 6 artwork, ${heading.toLowerCase()}`, rng, [1600, 2000]),
    });
  });
  out.push({
    id: "covers",
    pagePath: "/gta-6/covers/",
    mode: "cover",
    images: [
      {
        id: "cover-001",
        alt: "GTA 6 cover art",
        caption: "Leonida Atlas placeholder cover: a sunset collage of the island's counties.",
        width: 1200,
        height: 1500,
        art: art("shot", "cover-001"),
      },
    ],
  });
  MAP_LOCATION_BLOCKS.forEach(([heading, count], i) => {
    out.push({
      id: `map-locations-${i + 1}`,
      pagePath: "/gta-6/map-locations/",
      heading,
      mode: "embedded",
      images: images(`location-${i + 1}`, count, heading, rng),
    });
  });
  return out;
})();
