import type { Metadata } from "next";
import { guideCopy, properties, type Property, type PropertyGrid } from "@/data";
import { formatPrice } from "@/lib";
import { GuideGrid, GuideHeader, SectionHeading } from "@/components/content/GuideParts";

const copy = guideCopy.properties;

export const metadata: Metadata = { title: copy.title, description: copy.intro };

const GRIDS: PropertyGrid[] = ["purchasable", "story", "edition", "safehouse"];

function facts(p: Property): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  if (p.location) out.push({ label: "Location:", value: p.location });
  if (p.vehicleCapacity !== undefined) out.push({ label: "Parking spots:", value: String(p.vehicleCapacity) });
  else if (p.howToUnlock) out.push({ label: "Unlock:", value: p.howToUnlock });
  if (p.grid === "purchasable" && p.price !== undefined) out.push({ label: "Price:", value: formatPrice(p.price) });
  return out;
}

/** Properties guide (R-1002, R-1003): four grids; whole card = link; "Price:" only on purchasable cards. */
export default function Page() {
  return (
    <article className="atlas-guide">
      <GuideHeader heading={copy.heading} intro={copy.intro} />
      {GRIDS.map((grid, gi) => (
        <section key={grid} className="atlas-guide-section">
          <SectionHeading>{copy.sections[gi]}</SectionHeading>
          <GuideGrid
            grid={gi + 1}
            wholeCard
            cards={properties
              .filter((p) => p.grid === grid)
              .map((p) => ({ key: p.slug, name: p.name, href: p.canonicalPath, image: p.image, facts: facts(p) }))}
          />
        </section>
      ))}
    </article>
  );
}
