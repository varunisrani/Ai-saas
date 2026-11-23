import type { Metadata } from "next";
import { animals, guideCopy, type AnimalGrid } from "@/data";
import { GuideGrid, GuideHeader, SectionHeading } from "@/components/content/GuideParts";

const copy = guideCopy.animals;

export const metadata: Metadata = { title: copy.title, description: copy.intro };

const GRIDS: AnimalGrid[] = ["land", "birds", "sea"];

/** Animals guide (R-1001..R-1003): three grids (land, birds, sea), A→Z, exactly three level-2 headings. */
export default function Page() {
  return (
    <article className="atlas-guide">
      <GuideHeader heading={copy.heading} intro={copy.intro} />
      {GRIDS.map((grid, gi) => {
        const items = animals.filter((a) => a.grid === grid).sort((a, b) => a.name.localeCompare(b.name, "en"));
        return (
          <section key={grid} className="atlas-guide-section">
            <SectionHeading>{copy.sections[gi]}</SectionHeading>
            <GuideGrid
              grid={gi + 1}
              cards={items.map((a) => ({
                key: a.slug,
                name: a.name,
                href: a.canonicalPath,
                image: a.image,
                facts: a.habitat ? [{ label: "Habitat:", value: a.habitat }] : undefined,
              }))}
            />
          </section>
        );
      })}
    </article>
  );
}
