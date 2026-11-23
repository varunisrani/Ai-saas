/**
 * Paged grid gallery page (Screenshots, Trailer Screens; R-1201..R-1204): tab bar, two identical "Pagination"
 * navigations (above and below) when there is more than one page, one block of up to 100 thumbnails.
 */
import { getGallery } from "@/data";
import { galleryPagerModel, galleryPaging } from "@/lib";
import { Breadcrumbs, GTA6_CRUMB, PageHeading, Pagination } from "@/components/ui";
import { GridGallery } from "./GridGallery";
import { MediaTabs } from "./MediaTabs";

export interface GalleryPageProps {
  galleryId: string;
  path: string;
  heading: string;
  intro: string;
  tab: "screenshots" | "trailers";
  crumb: string;
  thumbLimitstart?: string;
}

export function GalleryPage({ galleryId, path, heading, intro, tab, crumb, thumbLimitstart }: GalleryPageProps) {
  const g = getGallery(galleryId);
  const images = g?.images ?? [];
  const paging = galleryPaging(images.length, thumbLimitstart ?? null);
  const slice = images.slice(paging.start, paging.end);
  const entries = galleryPagerModel(paging.page, paging.pages, path);
  return (
    <div className="atlas-gallery-page">
      <Breadcrumbs items={[GTA6_CRUMB, { label: "Media", href: "/gta-6/screenshots/" }, { label: crumb }]} />
      <PageHeading>{heading}</PageHeading>
      <MediaTabs current={tab} />
      <p className="atlas-lead">{intro}</p>
      <section className="atlas-gallery" data-testid="gallery" aria-label={heading}>
        {paging.pages > 1 ? <Pagination entries={entries} variant="gallery" /> : null}
        <GridGallery images={slice} block={1} thumbStart={0} label={heading} />
        {paging.pages > 1 ? <Pagination entries={entries} variant="gallery-secondary" /> : null}
      </section>
    </div>
  );
}
