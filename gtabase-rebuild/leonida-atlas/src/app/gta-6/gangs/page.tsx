import type { Metadata } from "next";
import { gangGuide, gangs, guideCopy } from "@/data";
import { GuideGrid, GuideHeader, SectionHeading } from "@/components/content/GuideParts";

const copy = guideCopy.gangs;

export const metadata: Metadata = { title: copy.title, description: copy.intro };

/**
 * Gangs guide (R-1002, R-1003): the gangs grid (whole card = link to `/gangs/gta-6/<slug>`), then an empty
 * law-enforcement grid followed by a bullet list; exactly four level-2 headings.
 */
export default function Page() {
  const crews = gangs.filter((g) => g.grid === "gangs");
  const law = gangs.filter((g) => g.grid === "law");
  return (
    <article className="atlas-guide">
      <GuideHeader heading={copy.heading} intro={copy.intro} />
      <section className="atlas-guide-section">
        <SectionHeading>{copy.sections[0]}</SectionHeading>
        <GuideGrid
          grid={1}
          wholeCard
          cards={crews.map((g) => ({
            key: g.slug,
            name: g.name,
            href: g.canonicalPath,
            image: g.image,
            facts: g.territory ? [{ label: "Territory:", value: g.territory }] : undefined,
          }))}
        />
      </section>
      <section className="atlas-guide-section atlas-prose">
        <SectionHeading>{copy.sections[1]}</SectionHeading>
        <GuideGrid grid={2} wholeCard cards={law.map((g) => ({ key: g.slug, name: g.name, href: g.canonicalPath, image: g.image }))} />
        <p>No police force has a page of its own yet. These are the agencies you will run into:</p>
        <ul>
          {gangGuide.lawBullets.map((b) => (
            <li key={b} data-testid="bullet-list-1">
              {b}
            </li>
          ))}
        </ul>
      </section>
      <section className="atlas-guide-section atlas-prose">
        <SectionHeading>{copy.sections[2]}</SectionHeading>
        <p>
          Raise your wanted level near the coast and the port police respond first; inland it is the highway patrol, and
          deep in the swamp the wildlife officers know the airboat routes better than you do.
        </p>
      </section>
      <section className="atlas-guide-section atlas-prose">
        <SectionHeading>{copy.sections[3]}</SectionHeading>
        <p>
          Crews hold their turf loosely in the early chapters. As the story moves on, some territory changes hands, so
          check the map before you drive into a neighbourhood with a trunk full of trouble.
        </p>
      </section>
    </article>
  );
}
