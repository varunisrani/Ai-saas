/**
 * Strangers & Freaks list (R-919): stranger mission cards by chapter, then the optional missions grouped by chapter;
 * every card has its tick box of list `gta6-missions` (the same ids as on the missions page).
 */
import type { Metadata } from "next";
import { missions } from "@/data";
import { siteTitle } from "@/lib";
import { Breadcrumbs, GTA6_CRUMB, PageHeading } from "@/components/ui";
import { MissionCard } from "@/components/missions/MissionCard";
import { ListHeading, MissionsChecklist } from "@/components/missions/lists";

export const metadata: Metadata = {
  title: siteTitle("GTA 6 Strangers & Freaks Missions: Every Side Story"),
  description: "Every stranger mission of the sample game by chapter, plus the optional story missions, with tick boxes.",
  alternates: { canonical: "/gta-6/strangers-missions/" },
};

export default function StrangersPage() {
  const strangers = missions.filter((m) => m.kind === "stranger");
  const optional = missions.filter((m) => m.kind === "optional" && m.listedOnStrangersPage);
  const chapters = [...new Set(strangers.map((m) => m.strangersChapter ?? 1))].sort((a, b) => a - b);
  const optionalChapters = [...new Set(optional.map((m) => m.chapter))];
  const firstId = strangers[0]?.checklistId ?? optional[0]?.checklistId;
  return (
    <div className="la-strangers">
      <Breadcrumbs items={[GTA6_CRUMB, { label: "Strangers & Freaks" }]} />
      <PageHeading>GTA 6 Strangers & Freaks</PageHeading>
      <div className="mt-4 space-y-3 text-[15px] leading-relaxed">
        <p>
          The odd folks of the island have their own little stories. They pop up as the main story moves on, so the list
          below follows the chapter where each one first appears.
        </p>
        <p>Tick the checkbox next to a mission to track your progress.</p>
      </div>
      <MissionsChecklist>
        {chapters.map((n) => (
          <section key={n}>
            <ListHeading>{`Chapter ${n}`}</ListHeading>
            <ul className="mt-4 space-y-3">
              {strangers
                .filter((m) => (m.strangersChapter ?? 1) === n)
                .map((m) => (
                  <MissionCard key={m.slug} mission={m} first={m.checklistId === firstId} showGiver />
                ))}
            </ul>
          </section>
        ))}
        <ListHeading>Other Optional Missions</ListHeading>
        <p className="mt-3 text-[15px]">These optional story missions share their ticks with the story missions list.</p>
        {optionalChapters.map((ch) => (
          <section key={ch}>
            <h3 className="mt-6! font-display text-base font-bold uppercase tracking-wide text-teal">{ch}</h3>
            <ul className="mt-3 space-y-3">
              {optional
                .filter((m) => m.chapter === ch)
                .map((m) => (
                  <MissionCard key={m.slug} mission={m} first={m.checklistId === firstId} />
                ))}
            </ul>
          </section>
        ))}
      </MissionsChecklist>
    </div>
  );
}
