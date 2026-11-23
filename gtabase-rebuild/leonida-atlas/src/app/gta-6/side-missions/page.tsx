/**
 * Activities list (R-920): a grid of activity cards linking to `/side-missions/gta-6/<slug>`; no tick boxes and
 * no progress box.
 */
import type { Metadata } from "next";
import { activities } from "@/data";
import { siteTitle } from "@/lib";
import { ArtImage, Breadcrumbs, GTA6_CRUMB, PageHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: siteTitle("GTA 6 Activities & Side Missions"),
  description: "Pastimes and side activities of the sample island, from parachuting to pool.",
  alternates: { canonical: "/gta-6/side-missions/" },
};

export default function ActivitiesPage() {
  return (
    <div className="la-activities">
      <Breadcrumbs items={[GTA6_CRUMB, { label: "Activities" }]} />
      <PageHeading>GTA 6 Activities</PageHeading>
      <p className="mt-4 text-[15px] leading-relaxed">
        Need a break from the story? These pastimes are open across the island. Each page explains where to find the
        activity and what it is worth.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {activities.map((a) => (
          <li key={a.slug} data-testid="activity-card" className="overflow-hidden rounded-2xl border border-sand-dark bg-white transition-shadow hover:shadow-[0_6px_24px_rgb(20_22_27/0.12)]">
            <a href={a.canonicalPath} className="block text-ink! no-underline">
              <ArtImage art={a.image} alt="" width={640} height={360} className="block h-auto w-full" />
              <span className="block p-4">
                <span className="block font-display text-lg font-bold">{a.name}</span>
                <span className="mt-1 block text-sm text-muted">{a.summary}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
