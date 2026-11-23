import type { Metadata } from "next";
import Link from "next/link";
import { getPageGalleries, guideCopy } from "@/data";
import { headingSlug } from "@/lib";
import { GuideHeader, QuickIndex, SectionHeading } from "@/components/content/GuideParts";
import { EmbeddedGallery } from "@/components/gallery/EmbeddedGallery";

const copy = guideCopy["map-locations"];
const PATH = "/gta-6/map-locations/";

export const metadata: Metadata = { title: copy.title, description: copy.intro };

const BLURBS = [
  "The busy south coast: marinas, the neon mile and more parking garages than anyone needs.",
  "Salt flats and cane fields, with long straight roads that are perfect for a test drive.",
  "Old money, older palm trees and the best sunsets on the island.",
  "Mangroves, airboat trails and a lot of things that bite. Bring a boat.",
  "A chain of small keys linked by bridges, each with its own bar and its own rules.",
  "Islands you can only reach by sea or air. Few roads, lots of secrets.",
];

/** Map & locations guide (R-1004, R-1005): one index, own sections, six embedded galleries, the map banner. */
export default function Page() {
  const blocks = getPageGalleries(PATH);
  const sections = copy.sections.map((heading) => ({ heading, anchor: headingSlug(heading) }));
  let start = 0;
  return (
    <article className="atlas-guide">
      <GuideHeader heading={copy.heading} intro={copy.intro} />
      <QuickIndex title="GTA 6 Map & Locations Index" path={PATH} entries={sections} />
      {blocks.map((g, i) => {
        const s = sections[i];
        const thumbStart = start;
        start += g.images.length;
        return (
          <section key={g.id} className="atlas-guide-section">
            <SectionHeading id={s.anchor} indexed>
              {s.heading}
            </SectionHeading>
            <p>{BLURBS[i] ?? ""}</p>
            <div className="atlas-gallery" data-testid="inline-gallery gallery">
              <EmbeddedGallery images={g.images} block={i + 1} thumbStart={thumbStart} label={g.heading ?? s.heading} />
            </div>
          </section>
        );
      })}
      {sections.slice(blocks.length).map((s) => (
        <section key={s.anchor} className="atlas-guide-section atlas-prose">
          <SectionHeading id={s.anchor} indexed>
            {s.heading}
          </SectionHeading>
          <p>
            Roads ring the coast and two highways cross the middle of the island. Ferries link the keys, and the
            airfields cover the offshore islands. Bridges close during storms, so plan a second route.
          </p>
        </section>
      ))}
      <aside className="atlas-tool-banner">
        <p>Looking for the interactive tool?</p>
        <Link href="/gta-6/map/" data-testid="map-banner-link">
          Interactive GTA 6 Map &amp; Collectibles Tracker
        </Link>
      </aside>
    </article>
  );
}
