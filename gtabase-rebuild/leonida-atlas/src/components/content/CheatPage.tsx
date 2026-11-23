/**
 * Cheat pages (R-1009..R-1012): quick index, two-card platform switcher (consoles), "How to enter" steps with
 * three icon images, five categories (headings shown in capitals) of rows with D-pad images whose alts are
 * exactly UP/DOWN/LEFT/RIGHT; the PC page has a 3-cell platform table instead and no rows.
 */
import Link from "next/link";
import { cheatCategories, cheatPages, cheats, type CheatPage as CheatPageData, type CheatPageSection } from "@/data";
import { Breadcrumbs, GTA6_CRUMB, PageHeading, ShareActions } from "@/components/ui";
import { QuickIndex, type IndexEntry } from "./GuideParts";

const ICON_SRC: Record<string, string> = {
  UP: "/icons/dpad-up.svg",
  DOWN: "/icons/dpad-down.svg",
  LEFT: "/icons/dpad-left.svg",
  RIGHT: "/icons/dpad-right.svg",
  L1: "/icons/key-l1.svg",
  R1: "/icons/key-r1.svg",
  LB: "/icons/key-lb.svg",
  RB: "/icons/key-rb.svg",
};

function KeyIcon({ name, testId, className }: { name: string; testId?: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={ICON_SRC[name]} alt={name} width={34} height={34} className={className} data-testid={testId} />;
}

function pageOf(platform: "ps5" | "xbox" | "pc"): CheatPageData {
  return cheatPages.find((p) => p.platform === platform) as CheatPageData;
}

function OwnSection({ s, children }: { s: CheatPageSection; children?: React.ReactNode }) {
  return (
    <section className="atlas-guide-section">
      <h2 id={s.anchor} className="atlas-section-h2" data-testid="indexed-heading">
        {s.heading}
      </h2>
      {s.body.map((p) => (
        <p key={p}>{p}</p>
      ))}
      {children}
    </section>
  );
}

export function CheatPage({ platform }: { platform: "ps5" | "xbox" | "pc" }) {
  const page = pageOf(platform);
  const ps5 = pageOf("ps5");
  const xbox = pageOf("xbox");
  const pc = pageOf("pc");
  const isConsole = platform !== "pc";
  const categories = [...cheatCategories].sort((a, b) => a.order - b.order);

  const index: IndexEntry[] = [{ heading: page.firstSection.heading, anchor: page.firstSection.anchor }];
  if (isConsole) for (const c of categories) index.push({ heading: c.label, anchor: c.id });
  for (const s of page.ownSections) index.push({ heading: s.heading, anchor: s.anchor });

  let firstCheatDone = false;

  return (
    <article className="atlas-guide atlas-cheats">
      <Breadcrumbs items={[GTA6_CRUMB, { label: "Guides", href: "/gta-6/guides/" }, { label: page.platformLabel }]} />
      <PageHeading>{page.title}</PageHeading>
      <ShareActions title={page.title} />
      <p className="atlas-lead">{page.intro}</p>

      {isConsole ? (
        <nav className="atlas-platforms" aria-label="Platforms">
          {[ps5, xbox].map((p) => {
            const current = p.platform === platform;
            const t = ["platform-link", `platform-${p.platform}`];
            if (current) t.push("platform-current");
            return (
              <Link key={p.platform} href={p.path} className="atlas-platform" aria-current={current ? "page" : undefined} data-testid={t.join(" ")}>
                <span>{p.platformLabel}</span>
                {current ? <span className="atlas-badge atlas-platform-badge">You are here</span> : null}
              </Link>
            );
          })}
        </nav>
      ) : null}

      <QuickIndex title={`${page.shortTitle} Index`} path={page.path} entries={index} keyed={{ "combat-cheats": "toc-link-combat" }} />

      <div className="atlas-cheat-body atlas-prose">
        {!isConsole ? (
          <table className="atlas-table" aria-label="Cheat pages by platform">
            <tbody>
              <tr>
                <td>
                  <Link href={ps5.path} data-testid="pc-platform-table-link body-link-ps5">
                    {ps5.platformLabel}
                  </Link>
                </td>
                <td>
                  <Link href={xbox.path} data-testid="pc-platform-table-link body-link-xbox">
                    {xbox.platformLabel}
                  </Link>
                </td>
                <td>
                  <Link href={pc.path} data-testid="pc-platform-table-link body-link-pc">
                    {pc.platformLabel}
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        ) : null}

        <OwnSection s={page.firstSection}>
          {isConsole ? (
            <ol className="atlas-steps">
              {page.howToSteps.map((step, i) => {
                const name = page.howToIcons[i];
                const t = ["howto-step-icons"];
                if (i > 0) t.push(`howto-icon-${i + 1}`);
                return (
                  <li key={step}>
                    {name ? <KeyIcon name={name} testId={t.join(" ")} className="atlas-key-inline" /> : null} {step}
                  </li>
                );
              })}
            </ol>
          ) : null}
        </OwnSection>

        {isConsole
          ? categories.map((cat, ci) => {
              const rows = cheats.filter((c) => c.category === cat.id);
              return (
                <section key={cat.id} className="atlas-guide-section">
                  <h2 id={cat.id} className="atlas-cheat-category caps" data-testid="cheat-category indexed-heading">
                    {cat.label}
                  </h2>
                  <ul className="atlas-cheat-list">
                    {rows.map((c) => {
                      const first = !firstCheatDone;
                      firstCheatDone = true;
                      return (
                        <li key={c.id} className="atlas-cheat" data-testid={`cheat-row cheat-category-${ci + 1}-rows`}>
                          <h3 data-testid={first ? "first-cheat-name" : undefined}>{c.name}</h3>
                          <p data-testid={first ? "first-cheat-desc" : undefined}>{c.effect}</p>
                          <p data-testid={first ? "first-cheat-unlock" : undefined}>How to unlock: {c.unlock}</p>
                          <div className="atlas-keys" aria-label="Button sequence" role="group">
                            {c.sequence.map((dir, k) => {
                              const t = ["cheat-key-icons"];
                              if (dir === "UP") t.push("cheat-key-up");
                              if (first) {
                                t.push("first-cheat-keys");
                                if (k < 2) t.push(`first-cheat-key-${k + 1}`);
                              }
                              return <KeyIcon key={k} name={dir} testId={t.join(" ")} />;
                            })}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })
          : null}

        {page.ownSections.map((s) =>
          !isConsole && s.anchor === "where-to-find-the-console-codes" ? (
            <OwnSection key={s.anchor} s={s}>
              <p>
                Jump straight to the{" "}
                <Link href={ps5.path} data-testid="body-link-ps5">
                  {ps5.platformLabel}
                </Link>{" "}
                or the{" "}
                <Link href={xbox.path} data-testid="body-link-xbox">
                  {xbox.platformLabel}
                </Link>
                .
              </p>
            </OwnSection>
          ) : (
            <OwnSection key={s.anchor} s={s} />
          ),
        )}
      </div>
    </article>
  );
}

export function cheatMetadata(platform: "ps5" | "xbox" | "pc") {
  const p = pageOf(platform);
  return { title: `${p.title} | Leonida Atlas`, description: p.intro };
}
