import type { Metadata } from "next";
import { membershipFaq, plans } from "@/data";
import { Breadcrumbs, PageHeading } from "@/components/ui";
import { Accordion } from "@/components/content/Accordion";
import { PlanCards } from "@/components/content/PlanCards";

export const metadata: Metadata = {
  title: "Leonida Atlas Membership for GTA 6 Players | Leonida Atlas",
  description: "Membership plans are coming later. Everything on Leonida Atlas is free today.",
};

/** Membership page, structure only (R-1408, DIVERGENCE D-016), with the FAQ accordion (R-1022..R-1026). */
export default function Page() {
  return (
    <div className="atlas-membership">
      <Breadcrumbs items={[{ label: "Membership" }]} />
      <PageHeading>Leonida Atlas Membership</PageHeading>
      <p className="atlas-lead">
        Plans for GTA 6 fans who want a few extra tools are on the drawing board. Nothing can be bought yet — every
        feature on the site is free, and your progress is kept in this browser.
      </p>
      <PlanCards plans={plans} />
      <section className="atlas-faq-section" data-testid="faq-section" aria-labelledby="atlas-faq-title">
        <h2 id="atlas-faq-title" className="atlas-section-h2">
          Membership FAQ
        </h2>
        <Accordion items={membershipFaq} />
      </section>
    </div>
  );
}
