"use client";

/**
 * "Filter by Game" menu button (R-1104): click or Enter opens it, Escape or a click outside closes it (focus back
 * on the button). 8 entries: "All News", "GTA 6", then six other games shown as disabled entries
 * (aria-disabled, no href, tooltip "Not covered by Leonida Atlas"; DIVERGENCE D-012). No client-side filtering.
 */
import { useEffect, useRef, useState } from "react";

const DISABLED = ["RDR2 & Online", "GTA 5 & GTA Online", "GTA 4", "GTA San Andreas", "GTA Vice City", "GTA 3"];

export function GameFilter() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="atlas-filter" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className="atlas-pill atlas-pill-ghost"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="atlas-game-filter"
        data-testid="game-filter-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        Filter by Game
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <ul id="atlas-game-filter" className="atlas-filter-menu" data-testid="game-filter-menu" hidden={!open}>
        <li>
          <a href="/news/" data-testid="game-filter-links">
            All News
          </a>
        </li>
        <li>
          <a href="/gta-6/news/" data-testid="game-filter-links game-filter-gta6">
            GTA 6
          </a>
        </li>
        {DISABLED.map((label) => (
          <li key={label}>
            <span aria-disabled="true" title="Not covered by Leonida Atlas" data-testid="game-filter-links">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
