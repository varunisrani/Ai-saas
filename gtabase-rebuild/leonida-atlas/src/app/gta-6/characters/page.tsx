import type { Metadata } from "next";
import { characterGuide, characters, guideCopy, type CharacterGrid } from "@/data";
import { GuideGrid, GuideHeader, SectionHeading } from "@/components/content/GuideParts";

const copy = guideCopy.characters;

export const metadata: Metadata = { title: copy.title, description: copy.intro };

const GRIDS: Exclude<CharacterGrid, "other">[] = ["protagonists", "main", "supporting", "minor"];

/**
 * Characters guide (R-1002): four grids (protagonists first, Jason Duval first), non-link "other" rows, a bullet
 * list of mentioned names and a FAQ of five level-3 questions.
 */
export default function Page() {
  const others = characters.filter((c) => c.grid === "other");
  return (
    <article className="atlas-guide">
      <GuideHeader heading={copy.heading} intro={copy.intro} />
      {GRIDS.map((grid, gi) => {
        const items = characters.filter((c) => c.grid === grid && c.slug && c.canonicalPath);
        return (
          <section key={grid} className="atlas-guide-section">
            <SectionHeading>{copy.sections[gi]}</SectionHeading>
            <GuideGrid
              grid={gi + 1}
              cards={items.map((c) => ({
                key: c.slug as string,
                name: c.name,
                href: c.canonicalPath as string,
                image: c.image,
                facts: c.role ? [{ label: "Role:", value: c.role }] : undefined,
              }))}
            />
          </section>
        );
      })}
      <section className="atlas-guide-section">
        <SectionHeading>{copy.sections[4]}</SectionHeading>
        <p>These people turn up in the story but do not have a page of their own yet.</p>
        <ul className="atlas-plain-rows">
          {others.map((c) => (
            <li key={c.name} data-testid="plain-person-row">
              <strong>{c.name}</strong>
              {c.occupation ? <span className="atlas-guide-fact"> — {c.occupation}</span> : null}
            </li>
          ))}
        </ul>
      </section>
      <section className="atlas-guide-section atlas-prose">
        <SectionHeading>{copy.sections[5]}</SectionHeading>
        <ul>
          {characterGuide.mentionedNames.map((n) => (
            <li key={n} data-testid="bullet-list-1">
              {n}
            </li>
          ))}
        </ul>
      </section>
      <section className="atlas-guide-section atlas-faq">
        <SectionHeading>{copy.sections[6]}</SectionHeading>
        {characterGuide.faq.map((q) => (
          <div key={q.alias}>
            <h3 data-testid="faq-question">{q.question}</h3>
            <p>{q.answer}</p>
          </div>
        ))}
      </section>
    </article>
  );
}
