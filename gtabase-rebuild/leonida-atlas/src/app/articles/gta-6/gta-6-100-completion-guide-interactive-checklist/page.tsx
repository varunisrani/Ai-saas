/**
 * The 100% checklist article (F5, R-913..R-916): contents box with the 38 requirements (each with its tick box),
 * one section per requirement whose heading carries a tick box, and the progress module (sticky in the right
 * part of the article on desktop, pinned to the top of the screen on phones). List `gta6-100`.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { checklist100, getArticleByPath, type ChecklistItem } from "@/data";
import { CHECKLIST_LISTS, dateLine } from "@/lib";
import { ArtImage, Breadcrumbs, GTA6_CRUMB, PageHeading, ShareActions } from "@/components/ui";
import { ChecklistBox, ChecklistProvider, PercentModule } from "@/components/checklist/Checklist";
import { CommentsPlaceholder } from "@/components/missions/DetailParts";

const SLUG = "gta-6-100-completion-guide-interactive-checklist";

function article() {
  return getArticleByPath("legacy", SLUG)?.article;
}

export function generateMetadata(): Metadata {
  const a = article();
  if (!a) return {};
  return { title: a.title, description: a.summary, alternates: { canonical: a.canonicalPath } };
}

function childrenOf(id: string): ChecklistItem[] {
  return checklist100.filter((i) => i.parent === id);
}

function sectionTokens(item: ChecklistItem): { testId: string; checkedTestId?: string } {
  const base = `sec-box sec-${item.id}`;
  if (!item.parent) return { testId: base };
  return { testId: `${base} sec-${item.parent}-children`, checkedTestId: `sec-${item.parent}-children-checked` };
}

function TocItem({ item }: { item: ChecklistItem }) {
  const kids = childrenOf(item.id);
  return (
    <li>
      <span className="flex items-center gap-2 py-0.5">
        <ChecklistBox id={item.id} rowText={item.label} testId={`toc-box toc-${item.id}`} className="h-4 w-4" />
        <a href={`#${item.id}`} className="text-sm text-teal underline-offset-2 hover:underline">
          {item.label}
        </a>
      </span>
      {kids.length ? (
        <ul className="ml-6 border-l border-sand-dark pl-3">
          {kids.map((k) => (
            <TocItem key={k.id} item={k} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function Requirement({ item, depth }: { item: ChecklistItem; depth: number }) {
  const kids = childrenOf(item.id);
  const tokens = sectionTokens(item);
  const Heading = depth === 0 ? "h2" : "h3";
  return (
    <section className={depth === 0 ? "mt-8 rounded-2xl border border-sand-dark bg-white p-5" : "mt-4 border-t border-sand-dark pt-4"}>
      <Heading
        id={item.id}
        className={`checklist-item flex scroll-mt-[220px] items-center gap-3 font-display font-bold text-ink lg:scroll-mt-24 ${
          depth === 0 ? "text-xl" : "text-base"
        }`}
      >
        <ChecklistBox id={item.id} rowText={item.label} testId={tokens.testId} checkedTestId={tokens.checkedTestId} />
        <span>{item.label}</span>
      </Heading>
      <p className="mt-2 text-sm text-muted">{item.description}</p>
      {kids.map((k) => (
        <Requirement key={k.id} item={k} depth={depth + 1} />
      ))}
    </section>
  );
}

export default function ChecklistArticlePage() {
  const a = article();
  if (!a) notFound();
  const top = checklist100.filter((i) => !i.parent);
  const items = checklist100.map((i) => ({
    id: i.id,
    parent: i.parent ?? null,
    weight: i.weight ?? null,
    limit: i.limit ?? null,
    multiplier: i.multiplier,
    group: i.group ?? null,
  }));
  const date = a.showModified && a.modifiedAt ? { iso: a.modifiedAt, text: dateLine("modified", a.modifiedAt) } : { iso: a.publishedAt, text: dateLine("published", a.publishedAt) };

  return (
    <article className="la-checklist-page">
      <Breadcrumbs items={[GTA6_CRUMB, { label: "Guides", href: "/gta-6/guides/" }, { label: a.shortTitle }]} />
      <PageHeading>{a.title}</PageHeading>
      <p className="mt-2 text-sm text-muted">
        {a.showAuthor ? <span>by {a.author} · </span> : null}
        <time dateTime={date.iso}>{date.text}</time>
      </p>
      <ShareActions title={a.title} className="mt-3" />
      <ChecklistProvider listId={CHECKLIST_LISTS.hundred} items={items}>
        <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="sticky top-16 z-20 -mx-1 lg:order-2 lg:mx-0 lg:top-20">
            <PercentModule className="py-3 lg:py-4" />
          </div>
          <div className="min-w-0 lg:order-1">
            <ArtImage art={a.hero} alt={a.heroAlt} loading="eager" className="h-auto w-full rounded-2xl border border-sand-dark" />
            <div className="mt-5 space-y-3 text-[15px] leading-relaxed">
              <p>
                This page lists every requirement for a full 100% run of the sample game and adds up your progress as
                you go. Tick a requirement once it is done; ticking a whole section ticks everything inside it, and a
                section ticks itself once all of its parts are done.
              </p>
              <p>
                The total is weighted the same way the game weighs it: the story is worth half, the side tasks are
                capped at 27%, and every exploration or discovery item adds its share. Your ticks stay in this
                browser, so you can close the tab and pick up where you left off.
              </p>
            </div>
            <nav aria-labelledby="la-cl-contents" className="mt-6 rounded-2xl border border-sand-dark bg-white p-5">
              <h2 id="la-cl-contents" className="font-display text-base font-bold uppercase tracking-wide text-ink">
                Quick index
              </h2>
              <ul className="mt-3">
                {top.map((item) => (
                  <TocItem key={item.id} item={item} />
                ))}
              </ul>
            </nav>
            {top.map((item) => (
              <Requirement key={item.id} item={item} depth={0} />
            ))}
          </div>
        </div>
      </ChecklistProvider>
      <CommentsPlaceholder />
    </article>
  );
}
