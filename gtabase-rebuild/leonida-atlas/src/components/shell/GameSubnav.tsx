"use client";

/**
 * GTA 6 sub-navigation bar (R-1306): 18 links on every page except the 404 page; the entry of the current
 * section carries aria-current="page" (news list and articles mark none). Wraps on phones.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useShell } from "@/components/ui/ShellContext";
import { SUBNAV_LINKS, currentSubnavKey } from "./nav";

function GameMark() {
  // own mark: a sun over a palm frond in a rounded tile (no text, so the link reads "Game Logo")
  return (
    <svg viewBox="0 0 40 24" width="40" height="24" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="38" height="22" rx="6" fill="#FF6A4D" />
      <circle cx="26" cy="9" r="4.5" fill="#F6EEDF" />
      <path d="M8 20 C 12 12, 18 9, 24 12 C 18 11, 14 14, 12 20 Z" fill="#14161B" />
      <path d="M12 20 C 13 15, 16 12, 21 11" fill="none" stroke="#14161B" strokeWidth="1.2" />
    </svg>
  );
}

export function GameSubnav() {
  const pathname = usePathname() ?? "/";
  const { notFound } = useShell();
  if (notFound) return null;
  const current = currentSubnavKey(pathname);
  return (
    <nav className="atlas-subnav" aria-label="GTA 6 sections" data-subnav="">
      <ul>
        {SUBNAV_LINKS.map((l) => {
          const isCurrent = current !== null && l.key === current;
          return (
            <li key={l.key} className={l.logo ? "is-logo" : undefined}>
              <Link
                href={l.href}
                aria-label={l.logo ? undefined : l.ariaLabel}
                aria-current={isCurrent ? "page" : undefined}
                data-testid={isCurrent ? "game-subnav-links subnav-current" : "game-subnav-links"}
              >
                {l.logo ? (
                  <>
                    <GameMark />
                    <span className="sr-only">{l.label}</span>
                  </>
                ) : (
                  l.label
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
