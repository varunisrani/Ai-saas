"use client";

/**
 * Lazy footer (R-1312): inserted only when the end of the content comes within 200 px of the viewport. Holds the
 * breadcrumb navigation "Breadcrumbs" (trail declared by the page with <Breadcrumbs>), the GTA 6 link list (10),
 * the own copyright line and six bottom links to rebuild pages. No social links (D-006).
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LazyReveal } from "@/components/ui/LazyReveal";
import { useShell, type Crumb } from "@/components/ui/ShellContext";
import { CompassRose } from "./Logo";
import { COPYRIGHT_LINE, FOOTER_BOTTOM_LINKS, FOOTER_GAME_LINKS } from "./nav";

function fallbackTrail(notFound: boolean): Crumb[] {
  if (notFound) return [{ label: "Home", href: "/" }, { label: "Page not found" }];
  return [{ label: "Home", href: "/" }, { label: "GTA 6" }];
}

function FooterContent() {
  const { trail, notFound } = useShell();
  const crumbs = notFound ? fallbackTrail(true) : trail ?? fallbackTrail(false);
  return (
    <footer className="atlas-footer atlas-dark" data-testid="footer">
      <div className="atlas-footer-inner">
        <nav aria-label="Breadcrumbs" className="atlas-breadcrumbs" data-testid="breadcrumbs">
          <ol>
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <li key={`${i}-${c.label}`} data-testid="breadcrumb-items">
                  {c.href && !last ? <Link href={c.href}>{c.label}</Link> : <span aria-current={last ? "page" : undefined}>{c.label}</span>}
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="atlas-footer-cols">
          <div className="atlas-footer-brand">
            <CompassRose size={44} />
            <p>
              <strong>Leonida Atlas</strong> — a fan-made field guide to GTA 6.
            </p>
          </div>
          <div>
            <h2 className="atlas-footer-title">GTA 6</h2>
            <ul className="atlas-footer-game">
              {FOOTER_GAME_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} data-testid="footer-game-menu">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="atlas-footer-bottom">
          <p data-testid="footer-copyright">{COPYRIGHT_LINE}</p>
          <ul>
            {FOOTER_BOTTOM_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} data-testid="footer-links">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

export function LazyFooter() {
  const pathname = usePathname();
  return (
    <LazyReveal key={pathname} minHeight={320} className="atlas-footer-slot">
      <FooterContent />
    </LazyReveal>
  );
}
