"use client";

/**
 * "Select Class" menu button of the ranking pages (R-720, R-1503): click or Enter opens a menu of the 21 class
 * rankings A→Z (plain links with the tooltip "The Best & Fastest <Class plural> in GTA 6"). Enter on the button opens
 * it without moving focus; Tab then moves into the links; arrow keys do not move inside the menu; Escape or a click
 * outside closes it and returns focus to the button.
 */
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useExclusivePopover } from "../lists/FilterDropdown";
import { tid } from "../lists/tid";

export interface ClassMenuItem {
  id: string;
  label: string;
  href: string;
  tooltip: string;
}

export function ClassMenu({ items, currentId }: { items: ClassMenuItem[]; currentId?: string }) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(-1);
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
  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        // the expanded state is announced once the menu opened (the closed button carries no aria-expanded, F3-30)
        aria-expanded={open ? true : undefined}
        aria-controls={menuId}
        data-testid="rank-class-select"
        className="inline-flex items-center gap-2 rounded-pill border border-teal bg-teal px-4 py-2 font-display text-sm font-semibold text-white hover:border-lagoon hover:bg-lagoon"
        onClick={() => setOpen((o) => !o)}
      >
        <span>Select Class</span>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" className={open ? "rotate-180" : ""}>
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <ul
        id={menuId}
        hidden={!open}
        aria-label="Vehicle classes"
        data-testid="rank-class-menu"
        className="absolute left-0 top-full z-40 mt-1 grid w-[min(34rem,calc(100vw-32px))] list-none grid-cols-2 gap-1 rounded-xl border border-sand-dark bg-white p-2 shadow-soft sm:grid-cols-3"
      >
        {items.map((it, i) => (
          <li key={it.id}>
            <Link
              href={it.href}
              prefetch={false}
              title={it.tooltip}
              aria-current={it.id === currentId ? "page" : undefined}
              data-testid={tid(
                "rank-class-items",
                `rank-class-item-${i + 1}`,
                i === 0 && "rank-class-first",
                `rank-class-${it.id}`,
                focused === i && "rank-class-focused",
              )}
              className={`block rounded-lg px-2 py-1.5 text-sm no-underline hover:bg-lagoon/10 ${
                it.id === currentId ? "bg-coral/20 font-bold text-ink!" : "text-ink!"
              }`}
              onFocus={() => setFocused(i)}
              onBlur={() => setFocused((f) => (f === i ? -1 : f))}
              onClick={() => setOpen(false)}
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
