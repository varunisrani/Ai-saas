import type { Metadata } from "next";
import { getPageGalleries } from "@/data";
import { Breadcrumbs, GTA6_CRUMB, PageHeading } from "@/components/ui";
import { CoverGallery } from "@/components/gallery/CoverGallery";

export const metadata: Metadata = {
  title: "GTA 6 Cover Art | Leonida Atlas",
  description: "The GTA 6 cover art placeholder, full size.",
};

/** Covers: one main image with its caption, no tab bar, no thumbnails (R-1201, R-1202). */
export default function Page() {
  const [g] = getPageGalleries("/gta-6/covers/");
  const heading = "GTA 6 Cover Art";
  return (
    <div className="atlas-gallery-page">
      <Breadcrumbs items={[GTA6_CRUMB, { label: "Media", href: "/gta-6/screenshots/" }, { label: "Cover Art" }]} />
      <PageHeading>{heading}</PageHeading>
      <p className="atlas-lead">Our own stand-in for the box art. Open it to see it full screen.</p>
      <section className="atlas-gallery" data-testid="gallery" aria-label={heading}>
        <CoverGallery images={g?.images ?? []} label={heading} />
      </section>
    </div>
  );
}
