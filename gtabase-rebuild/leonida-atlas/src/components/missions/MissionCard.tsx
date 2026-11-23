/**
 * Mission card of the mission list pages (R-918, R-919): tick box (list `gta6-missions`, never follows the link),
 * then one link holding the image, protagonist badge, number + title, badges and the one-line description.
 */
import type { Mission } from "@/data";
import { ArtImage } from "@/components/ui";
import { ChecklistBox } from "@/components/checklist/Checklist";

/** Keyed tokens (TA4, section 18.5) of the missions the vectors name. */
const MISSION_TOKEN: Record<string, string> = {
  "get-shirleys-rum": "shirleys-rum",
  "search-for-the-skunk-ape": "skunk-ape",
};

export function missionBoxTokens(m: Mission, first: boolean): string {
  const alias = MISSION_TOKEN[m.slug];
  return [`mission-${m.slug}`, alias ? `mission-${alias}` : null, first ? "mission-box-first" : null].filter(Boolean).join(" ");
}

/** R-910 row text of a card: number + title, then the badge texts as they run together. */
export function missionRowText(m: Mission): string {
  const head = m.number !== undefined && m.kind === "main" ? `${m.number}. ${m.title}` : m.title;
  return m.badges.length ? `${head} ${m.badges.join("")}` : head;
}

export function MissionCard({ mission: m, first, showGiver }: { mission: Mission; first: boolean; showGiver?: boolean }) {
  const href = m.canonicalPath;
  const optional = m.kind === "optional";
  const linkTokens = [
    "mission-row",
    first ? "mission-first-row" : null,
    optional ? "mission-row-optional" : null,
    !optional && href.startsWith("/gta-6/missions/") ? "mission-row-main-link" : null,
    href.startsWith("/gta-6/strangers/") ? "mission-row-strangers-link" : null,
  ]
    .filter(Boolean)
    .join(" ");
  const who = m.protagonist ?? "";
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border bg-white p-3 transition-shadow hover:shadow-[0_6px_24px_rgb(20_22_27/0.12)] ${
        optional ? "border-dashed border-coral/70 bg-[#fffaf3]" : "border-sand-dark"
      }`}
    >
      <ChecklistBox id={m.checklistId} rowText={missionRowText(m)} testId={missionBoxTokens(m, first)} />
      <a href={href} data-testid={linkTokens} className="items-row group flex min-w-0 flex-1 items-center gap-3 text-ink! no-underline">
        <span className="relative shrink-0">
          <ArtImage art={m.image} alt="" width={112} height={63} className="block h-[63px] w-[112px] rounded-xl object-cover" />
          {who ? (
            <span
              aria-hidden="true"
              title={who}
              className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-teal font-display text-[10px] font-bold text-white"
            >
              {who.charAt(0)}
            </span>
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-display text-base font-bold group-hover:underline">
              {m.kind === "main" && m.number !== undefined ? <span className="text-teal">{m.number}. </span> : null}
              {m.title}
            </span>
            {m.badges.length ? (
              <span className="inline-flex flex-wrap gap-1">
                {m.badges.map((b) => (
                  <span key={b} className="rounded-full bg-coral px-2 py-0.5 font-display text-[10px] font-bold tracking-wide text-ink">
                    {b}
                  </span>
                ))}
              </span>
            ) : null}
          </span>
          {showGiver && m.giver ? <span className="mt-0.5 block text-xs font-semibold text-teal">Given by {m.giver}</span> : null}
          <span data-testid="mission-row-text" className="mission-description mt-0.5 block text-sm text-muted">
            {m.summary}
          </span>
        </span>
      </a>
    </li>
  );
}
