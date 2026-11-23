import type { Metadata } from "next";
import { GalleryPage } from "@/components/gallery/GalleryPage";

export const metadata: Metadata = {
  title: "GTA 6 Trailer Screens | Leonida Atlas",
  description: "Frame grabs from the GTA 6 trailers, as placeholder images.",
};

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Trailer Screens gallery (R-1201..R-1212). */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return (
    <GalleryPage
      galleryId="trailers"
      path="/gta-6/screenshots/trailers/"
      heading="GTA 6 Trailer Screens"
      intro="Stills from every trailer so far, frame by frame. Open one to browse them full screen."
      tab="trailers"
      crumb="Trailer Screens"
      thumbLimitstart={first(sp.thumb_limitstart)}
    />
  );
}
