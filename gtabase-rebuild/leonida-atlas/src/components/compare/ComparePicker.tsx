"use client";

/**
 * Comparison board (R-708..R-714) client parts: the board frame (token `cmp-board`, "Loading…" while leaving after a
 * pick) and the slot pickers — comboboxes (placeholder "Search...", aria-autocomplete="list", aria-expanded) whose
 * listbox offers every item A→Z (accent-free, every query word must occur in the name, items already compared are
 * left out, at most 150 rows, then "<k> more: keep typing", or "No match"). ArrowDown/ArrowUp move with wrap-around,
 * Enter picks, Escape closes and restores the text from before opening, leaving the box closes the list after
 * ~150 ms so a pointer press on an option still picks it. Picking navigates to "<slot url>?<param>=<key>".
 */
import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import {
  PICKER_BLUR_CLOSE_MS,
  PICKER_LOADING,
  PICKER_NO_MATCH,
  pickHref,
  pickerResults,
  wrapIndex,
  type PickerItem,
} from "@/lib";
import { tid } from "../lists/tid";

interface BoardCtx {
  items: PickerItem[];
  excluded: string[];
  loading: boolean;
  go: (href: string) => void;
}

const Ctx = createContext<BoardCtx>({ items: [], excluded: [], loading: false, go: () => {} });

export function BoardFrame({
  items,
  excluded,
  className,
  children,
}: {
  items: PickerItem[];
  excluded: string[];
  className?: string;
  children: ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const value = useMemo(
    () => ({
      items,
      excluded,
      loading,
      go: (href: string) => {
        setLoading(true);
        window.location.assign(href);
      },
    }),
    [items, excluded, loading],
  );
  useEffect(() => {
    // coming back from the bfcache: the board is usable again
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setLoading(false);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
  return (
    <Ctx.Provider value={value}>
      <div data-testid="cmp-board" aria-busy={loading} className={`relative ${className ?? ""}`}>
        {children}
        {loading ? (
          <div
            role="status"
            className="absolute inset-0 z-20 flex items-center justify-center rounded-card bg-sand/80 font-display text-lg font-bold text-teal"
          >
            {PICKER_LOADING}
          </div>
        ) : null}
      </div>
    </Ctx.Provider>
  );
}

export interface ComparePickerProps {
  title: string;
  /** Shown in capitals (item columns) or normal case (header column). */
  caps: boolean;
  slotUrl: string;
  param: string;
  className?: string;
}

export function ComparePicker({ title, caps, slotUrl, param, className }: ComparePickerProps) {
  const { items, excluded, go } = useContext(Ctx);
  const uid = useId();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const beforeOpen = useRef("");
  const blurTimer = useRef<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => pickerResults(text, items, excluded), [text, items, excluded]);
  const rows = results.rows;

  useEffect(
    () => () => {
      if (blurTimer.current) window.clearTimeout(blurTimer.current);
    },
    [],
  );

  // keep the highlighted option in view
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${highlight}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  const openList = () => {
    if (open) return;
    beforeOpen.current = text;
    setHighlight(0);
    setOpen(true);
  };

  const pick = (key: string) => {
    setOpen(false);
    go(pickHref(slotUrl, param, key));
  };

  const listId = `${uid}-list`;
  const activeId = open && rows.length ? `${uid}-opt-${highlight}` : undefined;

  return (
    <div data-testid="cmp-add" className={`relative flex flex-col gap-1.5 ${className ?? ""}`}>
      <span
        data-testid="cmp-add-title"
        className={`font-display text-sm font-bold ${caps ? "uppercase tracking-wide" : ""} text-ink`}
      >
        {title}
      </span>
      <input
        type="text"
        role="combobox"
        aria-label={title}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeId}
        placeholder="Search..."
        autoComplete="off"
        spellCheck={false}
        data-testid="cmp-picker-all cmp-picker"
        className="w-full rounded-xl border border-sand-dark bg-white px-3 py-2 text-sm placeholder:text-muted/80 hover:border-lagoon"
        value={text}
        onFocus={() => {
          if (blurTimer.current) window.clearTimeout(blurTimer.current);
          openList();
        }}
        onClick={openList}
        onBlur={() => {
          blurTimer.current = window.setTimeout(() => setOpen(false), PICKER_BLUR_CLOSE_MS);
        }}
        onChange={(e) => {
          if (!open) beforeOpen.current = text;
          setText(e.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) {
              openList();
              return;
            }
            setHighlight((h) => wrapIndex(h, e.key === "ArrowDown" ? 1 : -1, rows.length));
          } else if (e.key === "Enter") {
            if (open && rows[highlight]) {
              e.preventDefault();
              pick(rows[highlight].key);
            }
          } else if (e.key === "Escape") {
            if (open) {
              e.preventDefault();
              setOpen(false);
              setText(beforeOpen.current);
            }
          }
        }}
      />
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={title}
          data-testid="cmp-list"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 min-w-[14rem] overflow-y-auto rounded-xl border border-sand-dark bg-white p-1 text-left shadow-soft"
        >
          {rows.map((r, i) => (
            <li
              key={r.key}
              id={`${uid}-opt-${i}`}
              data-index={i}
              role="option"
              aria-selected={i === highlight}
              data-testid={tid("cmp-options", i === 0 && "cmp-option-1", i === highlight && "cmp-option-active")}
              className={`cursor-pointer rounded-lg px-2 py-1.5 text-sm ${i === highlight ? "bg-lagoon/15 font-semibold" : ""}`}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(r.key)}
            >
              {r.name}
            </li>
          ))}
          {results.moreText || results.noMatch ? (
            <li role="presentation" data-testid="cmp-more" className="px-2 py-1.5 text-sm italic text-muted">
              {results.moreText ?? PICKER_NO_MATCH}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
