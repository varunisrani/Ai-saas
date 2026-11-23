/**
 * Mission walkthrough page (F2 + F5: R-603..R-607, R-611, R-614, R-620, R-621, R-917) and the activity page of the
 * same family. The "Mission Completed" heading carries the tick box of list `gta6-missions` (same id as the card).
 */
import type { Metadata } from "next";
import type { Activity, DetailList, Mission } from "@/data";
import { getNeighbours } from "@/data";
import { INFO_LABELS, breadcrumbHref, breadcrumbLabel, detailSectionTitles, detailTitle } from "@/lib";
import { ArtImage, Breadcrumbs, GTA6_CRUMB } from "@/components/ui";
import { ChecklistBox } from "@/components/checklist/Checklist";
import { ActionRow, CommentsPlaceholder, DetailHeader, InfoRows, NeighbourPager, SectionTitle } from "./DetailParts";
import { MissionsChecklist } from "./lists";

export function missionMetadata(m: Mission, canonicalPath: string): Metadata {
  return {
    title: detailTitle("mission", m.title),
    description: m.summary,
    alternates: { canonical: canonicalPath },
  };
}

export function activityMetadata(a: Activity, canonicalPath: string): Metadata {
  return {
    title: detailTitle("activity", a.name),
    description: a.summary,
    alternates: { canonical: canonicalPath },
  };
}

export function MissionDetail({ mission: m, list }: { mission: Mission; list: DetailList }) {
  const titles = detailSectionTitles("mission", m.title);
  const { prev, next } = getNeighbours(list, m.slug);
  const values = [
    m.kind === "main" && m.number !== undefined ? String(m.number) : undefined,
    m.missionType,
    m.chapter,
    m.giver,
    m.protagonist,
    m.requiredFor100,
    m.featuring,
    m.rewards,
  ];
  const rows = INFO_LABELS.mission.map((label, i) => [label, values[i]] as [string, string | undefined]);
  const stranger = m.kind === "stranger";
  return (
    <article className="la-mission">
      <Breadcrumbs
        items={[
          GTA6_CRUMB,
          stranger ? { label: "Strangers & Freaks", href: "/gta-6/strangers-missions/" } : { label: "Story Missions", href: "/gta-6/missions/" },
          { label: m.title },
        ]}
      />
      <DetailHeader title={m.title} crumbLabel={breadcrumbLabel("mission")} crumbHref={breadcrumbHref("mission", m.kind)} />
      <ActionRow list="missions" slug={m.slug} average={m.rating.average} votes={m.rating.votes} />
      <MissionsChecklist>
        <SectionTitle>{titles[0].text}</SectionTitle>
        <InfoRows rows={rows} />
        <nav aria-labelledby="la-otp" className="mt-6 rounded-2xl border border-sand-dark bg-white px-4 py-3">
          <p id="la-otp" className="font-display text-sm font-bold uppercase tracking-wide text-ink">
            On this page
          </p>
          <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <li>
              <a href="#trophies">Trophies</a>
            </li>
            <li>
              <a href="#walkthrough">Walkthrough</a>
            </li>
            <li>
              <a href="#rewards">Rewards</a>
            </li>
          </ul>
        </nav>
        <SectionTitle id="walkthrough">{titles[1].text}</SectionTitle>
        <ArtImage art={m.image} alt={`${m.title} mission artwork`} className="mt-4 h-auto w-full max-w-[640px] rounded-2xl border border-sand-dark" />
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed">
          {m.walkthrough.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <SectionTitle id="objectives">{titles[2].text}</SectionTitle>
        <ol className="mt-4 space-y-4">
          {m.objectives.map((o, i) => (
            <li key={i} className="rounded-2xl border border-sand-dark bg-white p-4">
              <h3 className="font-display text-base font-bold text-ink">{o.heading}</h3>
              <p className="mt-1 text-sm text-muted">{o.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <section id="trophies" className="scroll-mt-24 rounded-2xl border border-sand-dark bg-white p-4">
            <h3 className="font-display text-base font-bold text-ink">Trophies & Achievements</h3>
            <p className="mt-1 text-sm text-muted">{m.trophies}</p>
          </section>
          <section id="rewards" className="scroll-mt-24 rounded-2xl border border-sand-dark bg-white p-4">
            <h3 className="font-display text-base font-bold text-ink">Rewards</h3>
            <p className="mt-1 text-sm text-muted">{m.rewards ?? "No reward listed yet."}</p>
          </section>
        </div>
        <h2
          id="completed"
          data-testid="section-titles"
          className="checklist-item mt-10! flex items-center gap-3 rounded-2xl border border-teal/30 bg-white px-4 py-3 font-display text-xl font-bold text-ink"
        >
          <ChecklistBox id={m.checklistId} rowText={titles[3].text} testId="walkthrough-box" />
          <span>{titles[3].text}</span>
        </h2>
        <p className="mt-2 text-sm text-muted">
          Ticking this box also ticks the mission on the {stranger ? "Strangers & Freaks" : "story missions"} list, and the
          other way round.
        </p>
      </MissionsChecklist>
      <NeighbourPager prev={prev} next={next} />
      <CommentsPlaceholder />
    </article>
  );
}

export function ActivityDetail({ activity: a }: { activity: Activity }) {
  const titles = detailSectionTitles("activity", a.name);
  const { prev, next } = getNeighbours("side-missions", a.slug);
  return (
    <article className="la-activity">
      <Breadcrumbs items={[GTA6_CRUMB, { label: "Activities", href: "/gta-6/side-missions/" }, { label: a.name }]} />
      <DetailHeader title={a.name} crumbLabel={breadcrumbLabel("activity")} crumbHref={breadcrumbHref("activity")} />
      <ActionRow list="side-missions" slug={a.slug} average={a.rating.average} votes={a.rating.votes} />
      <SectionTitle>{titles[0].text}</SectionTitle>
      <InfoRows
        rows={INFO_LABELS.activity.map((label, i) => [label, i === 0 ? a.activityType : a.location] as [string, string])}
      />
      <SectionTitle>{titles[1].text}</SectionTitle>
      <ArtImage art={a.image} alt={`${a.name} activity artwork`} className="mt-4 h-auto w-full max-w-[640px] rounded-2xl border border-sand-dark" />
      <p className="mt-4 text-[15px] leading-relaxed">{a.description}</p>
      <NeighbourPager prev={prev} next={next} />
      <CommentsPlaceholder />
    </article>
  );
}
