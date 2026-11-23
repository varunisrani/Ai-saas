import type { Metadata } from "next";
import { getPageGalleries } from "@/data";
import { Breadcrumbs, GTA6_CRUMB, PageHeading } from "@/components/ui";
import { GridGallery } from "@/components/gallery/GridGallery";
import { MediaTabs } from "@/components/gallery/MediaTabs";

export const metadata: Metadata = {
  title: "GTA 6 Artworks & Wallpapers | Leonida Atlas",
  description: "Key art, characters, vehicles and wallpapers — six placeholder artwork collections.",
};

/** Artworks: six blocks, each under its own level-2 heading with its own lightbox (R-1202, R-1207). */
export default function Page() {
  const blocks = getPageGalleries("/gta-6/artworks/");
  let start = 0;
  return (
    <div className="atlas-gallery-page">
      <Breadcrumbs items={[GTA6_CRUMB, { label: "Media", href: "/gta-6/screenshots/" }, { label: "Artworks" }]} />
      <PageHeading>GTA 6 Artworks & Wallpapers</PageHeading>
      <MediaTabs current="artworks" />
      <p className="atlas-lead">Six collections of placeholder art. Each collection opens in its own viewer.</p>
      {blocks.map((g, i) => {
        const thumbStart = start;
        start += g.images.length;
        const heading = g.heading ?? "GTA 6 Artworks";
        return (
          <section key={g.id} className="atlas-gallery" data-testid="gallery" aria-labelledby={`atlas-${g.id}`}>
            <h2 id={`atlas-${g.id}`} className="atlas-gallery-heading" data-testid="gallery-heading">
              {heading}
            </h2>
            <GridGallery images={g.images} block={i + 1} thumbStart={thumbStart} label={heading} />
          </section>
        );
      })}
    </div>
  );
}
