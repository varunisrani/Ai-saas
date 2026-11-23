/**
 * Random events (R-921): a placeholder table, no tick boxes.
 */
import type { Metadata } from "next";
import { randomEvents } from "@/data";
import { siteTitle } from "@/lib";
import { Breadcrumbs, GTA6_CRUMB, PageHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: siteTitle("GTA 6 Random Events: Locations & Rewards"),
  description: "Random encounters of the sample island. The list is still being put together.",
  alternates: { canonical: "/gta-6/random-events/" },
};

export default function RandomEventsPage() {
  return (
    <div className="la-random-events">
      <Breadcrumbs items={[GTA6_CRUMB, { label: "Random Events" }]} />
      <PageHeading>GTA 6 Random Events</PageHeading>
      <p className="mt-4 text-[15px] leading-relaxed">
        Strangers in trouble, getaway drivers in a hurry, a wallet on the sidewalk: random events happen anywhere on the
        island. We are still mapping them, so the table below fills up later.
      </p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-sand-dark bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-teal text-white">
              {["Random Event", "Location", "Reward", "Status"].map((h) => (
                <th key={h} scope="col" data-testid="events-table-header" className="px-4 py-3 font-display text-xs font-bold uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {randomEvents.map((r, i) => (
              <tr key={i} className={i % 2 ? "bg-sand/60" : ""}>
                {[r.event, r.location, r.reward, r.status].map((c, j) => (
                  <td key={j} data-testid="events-table-cell" className="px-4 py-3">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
