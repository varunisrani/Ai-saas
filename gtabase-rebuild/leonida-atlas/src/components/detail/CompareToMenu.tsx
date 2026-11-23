"use client";

/**
 * "Compare To" menu button of vehicle and weapon detail pages (R-618, R-619): click or Enter opens the menu, Escape
 * or a click outside closes it (focus returns to the button), Tab moves through its links. Entries are the other
 * items of the same class, A→Z; each links to the two-item comparison (keys in plain string order).
 */
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useExclusivePopover } from "../lists/FilterDropdown";
import { tid } from "../lists/tid";

export interface CompareToEntryLink {
  slug: string;
  name: string;
  href: string;
}

export function CompareToMenu({ entries }: { entries: CompareToEntryLink[] }) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useExclusivePopover(uid, open, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menuId = `${uid}-menu`;
  const last = entries.length - 1;
  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        data-testid="compare-to compare-button"
        className="inline-flex items-center gap-2 rounded-pill border border-teal/35 bg-white px-4 py-2 font-display text-sm font-semibold text-teal hover:bg-lagoon/10"
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path d="M7 4v16M17 4v16M3 9h8M13 15h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>Compare To</span>
      </button>
      <div
        id={menuId}
        hidden={!open}
        data-testid="compare-to-menu"
        className="absolute left-0 top-full z-40 mt-1 max-h-80 w-72 overflow-y-auto rounded-xl border border-sand-dark bg-white p-1 shadow-soft"
      >
        {entries.length ? (
          <ul className="m-0 list-none p-0" aria-label="Compare To">
            {entries.map((e, i) => (
              <li key={e.slug}>
                <Link
                  href={e.href}
                  prefetch={false}
                  data-testid={tid(
                    "compare-to-items",
                    `compare-to-item-${i + 1}`,
                    i === last && "compare-to-item-last",
                    `compare-to-item-${e.slug}`,
                  )}
                  className="block rounded-lg px-2 py-1.5 text-sm text-ink no-underline hover:bg-lagoon/10"
                  onClick={() => setOpen(false)}
                >
                  {e.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 px-2 py-1.5 text-sm text-muted">Nothing else in this class yet.</p>
        )}
      </div>
    </div>
  );
}
