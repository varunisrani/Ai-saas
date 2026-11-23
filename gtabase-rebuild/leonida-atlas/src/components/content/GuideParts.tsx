/**
 * Building blocks of the guide pages (R-1001..R-1005): header (h1, header image, share actions, own intro), card
 * grids under level-2 headings, cards whose title link reads "Read more: <name>" (image link hidden from AT) or
 * whose whole card is the link, and the quick index of indexed headings.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { art, type ArtRef } from "@/data";
import { ArtImage, Breadcrumbs, GTA6_CRUMB, PageHeading, ShareActions, type Crumb } from "@/components/ui";

export function GuideHeader({ heading, intro, crumbs, image }: { heading: string; intro: string; crumbs?: Crumb[]; image?: ArtRef }) {
  return (
    <header className="atlas-guide-head">
      <Breadcrumbs items={crumbs ?? [GTA6_CRUMB, { label: "Guides", href: "/gta-6/guides/" }, { label: heading }]} />
      <PageHeading>{heading}</PageHeading>
      <ArtImage art={image ?? art("banner", "hub")} alt="" className="atlas-banner atlas-guide-banner" loading="eager" />
      <ShareActions title={heading} />
      <p className="atlas-lead atlas-guide-intro">{intro}</p>
    </header>
  );
}

export function SectionHeading({ children, id, indexed }: { children: ReactNode; id?: string; indexed?: boolean }) {
  return (
    <h2 id={id} className="atlas-section-h2" data-testid={indexed ? "section-heading indexed-heading" : "section-heading"}>
      {children}
    </h2>
  );
}

export interface GuideCardData {
  key: string;
  name: string;
  href: string;
  image: ArtRef;
  /** Fact lines ("Location: …"). */
  facts?: { label: string; value: string }[];
}

function cardTokens(grid: number, index: number, extra: string[]): { card: string[]; link: string[] } {
  const card = ["guide-card", `grid-${grid}-cards`];
  const link = ["guide-card-link"];
  if (grid === 1 && index === 0) {
    card.push("grid-1-first-card");
    link.push("grid-1-first-link", "grid-1-first-title-link");
  }
  // position kept from the recorded selector: the link of the second card of grid 3 (18.6)
  if (grid === 3 && index === 1) link.push("grid-3-first-link");
  return { card: [...card, ...extra], link };
}

function Facts({ facts }: { facts?: { label: string; value: string }[] }) {
  if (!facts?.length) return null;
  return (
    <>
      {facts.map((f) => (
        <p key={f.label} className="atlas-guide-fact">
          <b>{f.label}</b> {f.value}
        </p>
      ))}
    </>
  );
}

function factTokens(facts?: { label: string }[]): string[] {
  const t: string[] = [];
  if (facts?.some((f) => f.label === "Price:")) t.push("card-with-price");
  if (facts?.some((f) => f.label === "Location:")) t.push("card-with-location");
  return t;
}

/**
 * A card grid. `wholeCard` = the whole card is the link (gangs, properties); otherwise the title link carries the
 * accessible name "Read more: <name>" and the image link is hidden from assistive technology.
 */
export function GuideGrid({ grid, cards, wholeCard }: { grid: number; cards: GuideCardData[]; wholeCard?: boolean }) {
  return (
    <ul className="atlas-guide-grid" data-testid="card-grid">
      {cards.map((c, i) => {
        const t = cardTokens(grid, i, factTokens(c.facts));
        if (wholeCard) {
          return (
            <li key={c.key}>
              <Link
                href={c.href}
                className="atlas-guide-card atlas-card"
                aria-label={`Read more: ${c.name}`}
                data-testid={[...t.card, ...t.link].join(" ")}
              >
                <ArtImage art={c.image} alt="" width={320} height={240} className="atlas-guide-card-img" />
                <span className="atlas-guide-card-body">
                  <span className="atlas-guide-card-title">{c.name}</span>
                  <Facts facts={c.facts} />
                </span>
              </Link>
            </li>
          );
        }
        return (
          <li key={c.key} className="atlas-guide-card atlas-card" data-testid={t.card.join(" ")}>
            <Link href={c.href} aria-hidden="true" tabIndex={-1}>
              <ArtImage art={c.image} alt="" width={320} height={240} className="atlas-guide-card-img" />
            </Link>
            <div className="atlas-guide-card-body">
              <h3 className="atlas-guide-card-title">
                <Link href={c.href} aria-label={`Read more: ${c.name}`} data-testid={t.link.join(" ")}>
                  {c.name}
                </Link>
              </h3>
              <Facts facts={c.facts} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export interface IndexEntry {
  heading: string;
  anchor: string;
}

/** Quick index (R-1004): one link per indexed heading, "<page path>#<slug>"; a hash link adds a history entry. */
export function QuickIndex({ title, path, entries, keyed }: { title: string; path: string; entries: IndexEntry[]; keyed?: Record<string, string> }) {
  return (
    <nav className="atlas-toc" aria-labelledby="atlas-quick-index" data-testid="toc">
      <p id="atlas-quick-index" className="atlas-toc-title">
        <strong>{title}</strong>
      </p>
      <ol>
        {entries.map((e, i) => {
          const t = ["toc-link", `toc-link-${i + 1}`];
          if (i === 0) t.push("toc-first-link");
          if (keyed?.[e.anchor]) t.push(keyed[e.anchor]);
          return (
            <li key={e.anchor}>
              <a href={`${path}#${e.anchor}`} data-testid={t.join(" ")}>
                {e.heading}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
