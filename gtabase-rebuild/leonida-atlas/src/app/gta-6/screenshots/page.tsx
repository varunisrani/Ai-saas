import type { Metadata } from "next";
import { GalleryPage } from "@/components/gallery/GalleryPage";

export const metadata: Metadata = {
  title: "GTA 6 Screenshots Gallery | Leonida Atlas",
  description: "Browse every GTA 6 screenshot placeholder in our sample gallery.",
};

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Screenshots gallery (R-1201..R-1212). */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return (
    <GalleryPage
      galleryId="screenshots"
      path="/gta-6/screenshots/"
      heading="GTA 6 Screenshots"
      intro="Snapshots from all over the island. Pick a picture to open it full screen and use the arrow keys to browse."
      tab="screenshots"
      crumb="Screenshots"
      thumbLimitstart={first(sp.thumb_limitstart)}
    />
  );
}
