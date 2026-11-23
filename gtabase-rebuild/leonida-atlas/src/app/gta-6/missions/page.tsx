/**
 * Story missions list (R-918): chapter sections of mission cards with tick boxes of list `gta6-missions`; no
 * progress box. Main missions are numbered; optional missions are listed in their chapter, unnumbered.
 */
import type { Metadata } from "next";
import { missions } from "@/data";
import { siteTitle } from "@/lib";
import { Breadcrumbs, GTA6_CRUMB, PageHeading } from "@/components/ui";
import { MissionCard } from "@/components/missions/MissionCard";
import { Faq, ListHeading, MissionsChecklist } from "@/components/missions/lists";

export const metadata: Metadata = {
  title: siteTitle("GTA 6 Story Missions: Full List & Progress Tracker"),
  description: "Every story mission of the sample game, chapter by chapter, with a tick box to track what you finished.",
  alternates: { canonical: "/gta-6/missions/" },
};

export default function MissionsPage() {
  const story = missions.filter((m) => m.kind !== "stranger");
  const chapters = [...new Set(story.map((m) => m.chapter))];
  const firstId = story[0]?.checklistId;
  return (
    <div className="la-missions">
      <Breadcrumbs items={[GTA6_CRUMB, { label: "Story Missions" }]} />
      <PageHeading>GTA 6 Story Missions</PageHeading>
      <div className="mt-4 space-y-3 text-[15px] leading-relaxed">
        <p>
          Here is the whole story of the sample game in order, without spoilers: only titles, badges and a one-line
          teaser per mission. Optional side stories sit in the chapter where they unlock.
        </p>
        <p>
          Tick a mission once you have finished it. Your ticks stay in this browser and show up on every mission page,
          so you always know where you left off.
        </p>
      </div>
      <MissionsChecklist>
        <ListHeading>GTA 6 Story Missions List:</ListHeading>
        {chapters.map((chapter) => (
          <section key={chapter} aria-labelledby={`la-ch-${chapter.replace(/\s+/g, "-").toLowerCase()}`}>
            <ListHeading id={`la-ch-${chapter.replace(/\s+/g, "-").toLowerCase()}`}>{chapter}</ListHeading>
            <ul className="mt-4 space-y-3">
              {story
                .filter((m) => m.chapter === chapter)
                .map((m) => (
                  <MissionCard key={m.slug} mission={m} first={m.checklistId === firstId} />
                ))}
            </ul>
          </section>
        ))}
      </MissionsChecklist>
      <ListHeading>How the mission tracker works</ListHeading>
      <p className="mt-3 text-[15px] leading-relaxed">
        Each tick is stored on this device only. A mission ticked here is also ticked on its walkthrough page and on the
        Strangers & Freaks page, and the other way round. Untick a box at any time to undo it.
      </p>
      <ListHeading>Missions FAQ</ListHeading>
      <Faq
        items={[
          ["How many story missions are there?", `This sample story has ${story.filter((m) => m.kind === "main").length} main missions and ${story.filter((m) => m.kind === "optional").length} optional ones.`],
          ["What does Missable mean?", "A missable mission disappears once the story moves past a certain point, so finish it before the chapter ends."],
          ["Do optional missions count toward 100%?", "Most of them do. Check the Required for 100% line on each walkthrough page."],
        ]}
      />
    </div>
  );
}
