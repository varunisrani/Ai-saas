"use client";

/**
 * Dropdown widget of the list filters and the sort control (R-515, R-516, R-1503): a button showing the current
 * label (or "Select <title>"), `aria-haspopup="listbox"` + `aria-expanded`; it opens a listbox of options. With more
 * than 10 options a search box (accessible name = the filter title) filters by word start, without accent folding;
 * the first remaining option is highlighted; Enter picks it, ArrowDown/ArrowUp move, Escape closes without change,
 * a click outside closes; no match shows one non-selectable row "No results match <typed>". A hidden native select
 * mirrors the current value (not focusable, hidden from assistive technology).
 */
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { dropdownButtonText, dropdownHasSearch, moveHighlight, searchDropdownOptions } from "@/lib";
import { tid } from "./tid";

export interface DropdownItem {
  value: string;
  /** Label without count (searched, shown on the button). */
  label: string;
  /** Option count shown as "<label> (<n>)" (R-506); undefined = no count (sort). */
  count?: number;
  /** Extra data-testid tokens of the listbox row. */
  tokens?: string[];
  /** Extra data-testid tokens of the mirror option. */
  mirrorTokens?: string[];
}

export interface FilterDropdownProps {
  /** Token base, e.g. "manufacturer" → manufacturer-dropdown / -shown / -search / -results / -select / -options. */
  base: string;
  title: string;
  items: DropdownItem[];
  /** Current value; "" = none. */
  value: string;
  /** Placeholder entry ("Select <title>") listed first; null for the sort control. */
  placeholder: string | null;
  isSort?: boolean;
  onSelect: (value: string) => void;
  /** Tokens of the placeholder row (listbox) and placeholder mirror option. */
  placeholderTokens?: string[];
  /** Accessible label of the button (defaults to the title). */
  buttonLabelledBy?: string;
  className?: string;
}

const OPEN_EVENT = "atlas-popover-open";

/** Only one popover is open at a time (R-1503). */
export function announcePopover(id: string) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
}

export function useExclusivePopover(id: string, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    announcePopover(id);
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) close();
    };
    window.addEventListener(OPEN_EVENT, onOther);
    return () => window.removeEventListener(OPEN_EVENT, onOther);
  }, [id, open, close]);
}

interface Row {
  kind: "placeholder" | "option" | "empty";
  value: string;
  text: string;
  tokens: string[];
}

export function FilterDropdown({
  base,
  title,
  items,
  value,
  placeholder,
  isSort = false,
  onSelect,
  placeholderTokens = [],
  className,
}: FilterDropdownProps) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const hasSearch = dropdownHasSearch(items.length, isSort);

  const current = items.find((i) => i.value === value) ?? null;
  const shown = isSort ? (current?.label ?? items[0]?.label ?? "") : dropdownButtonText(title, current?.label ?? null);

  const rows: Row[] = useMemo(() => {
    const fmt = (i: DropdownItem) => (i.count === undefined ? i.label : `${i.label} (${i.count})`);
    if (hasSearch && typed.length > 0) {
      const res = searchDropdownOptions(items, typed);
      if (res.noResults) return [{ kind: "empty", value: "", text: res.noResults, tokens: [] }];
      return res.options.map((o) => ({ kind: "option", value: o.value, text: fmt(o), tokens: o.tokens ?? [] }));
    }
    const out: Row[] = [];
    if (placeholder !== null) out.push({ kind: "placeholder", value: "", text: placeholder, tokens: placeholderTokens });
    for (const o of items) out.push({ kind: "option", value: o.value, text: fmt(o), tokens: o.tokens ?? [] });
    return out;
  }, [hasSearch, typed, items, placeholder, placeholderTokens]);

  const selectable = rows.filter((r) => r.kind !== "empty");

  const close = (refocus: boolean) => {
    setOpen(false);
    setTyped("");
    if (refocus) buttonRef.current?.focus();
  };

  useExclusivePopover(uid, open, () => close(false));

  // a click outside closes the popover (R-1503)
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setTyped("");
      }
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open]);

  // focus the search box (or the listbox) when opening
  useEffect(() => {
    if (!open) return;
    if (hasSearch) searchRef.current?.focus();
    else listRef.current?.focus();
  }, [open, hasSearch]);

  const openList = () => {
    const idx = rows.findIndex((r) => r.kind !== "empty" && r.value === value);
    setHighlight(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  const choose = (row: Row | undefined) => {
    if (!row || row.kind === "empty") return;
    close(true);
    if (row.value !== value) onSelect(row.value);
  };

  const onListKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => moveHighlight(h, e.key === "ArrowDown" ? 1 : -1, selectable.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(selectable[highlight]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "Tab") {
      setOpen(false);
      setTyped("");
    }
  };

  const listId = `${uid}-list`;
  const activeId = highlight >= 0 && selectable[highlight] ? `${uid}-opt-${highlight}` : undefined;
  let selIndex = -1;

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={isSort ? `Sort By: ${shown}` : `${title}: ${shown}`}
        data-testid={tid(`${base}-dropdown`)}
        className="flex w-full min-w-[11rem] items-center justify-between gap-2 rounded-xl border border-sand-dark bg-white px-3 py-2 text-left text-sm hover:border-lagoon"
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            openList();
          }
        }}
      >
        <span data-testid={`${base}-shown`} className="truncate">
          {shown}
        </span>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" className={open ? "rotate-180" : ""}>
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-40 mt-1 w-full min-w-[14rem] rounded-xl border border-sand-dark bg-white p-1 shadow-soft">
          {hasSearch ? (
            <input
              ref={searchRef}
              type="text"
              aria-label={title}
              aria-controls={listId}
              aria-activedescendant={activeId}
              autoComplete="off"
              data-testid={`${base}-search`}
              className="mb-1 w-full rounded-lg border border-sand-dark px-2 py-1.5 text-sm"
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                setHighlight(0);
              }}
              onKeyDown={onListKey}
            />
          ) : null}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={title}
            tabIndex={-1}
            aria-activedescendant={hasSearch ? undefined : activeId}
            onKeyDown={hasSearch ? undefined : onListKey}
            className="max-h-72 overflow-y-auto outline-none"
          >
            {rows.map((r, i) => {
              if (r.kind === "empty") {
                return (
                  <li key="empty" role="presentation" data-testid={`${base}-results`} className="px-2 py-1.5 text-sm text-muted">
                    {r.text}
                  </li>
                );
              }
              selIndex += 1;
              const si = selIndex;
              const active = si === highlight;
              return (
                <li
                  key={`${r.kind}-${r.value}-${i}`}
                  id={`${uid}-opt-${si}`}
                  role="option"
                  aria-selected={r.value === value}
                  data-testid={tid(`${base}-results`, ...r.tokens)}
                  data-state={active ? "highlighted" : undefined}
                  className={`cursor-pointer rounded-lg px-2 py-1.5 text-sm ${active ? "bg-lagoon/15" : ""} ${
                    r.value === value ? "font-semibold text-teal" : ""
                  }`}
                  onMouseEnter={() => setHighlight(si)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(r)}
                >
                  {r.text}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <select
        tabIndex={-1}
        aria-hidden="true"
        hidden
        data-testid={`${base}-select`}
        value={value}
        onChange={(e) => onSelect(e.target.value)}
      >
        {placeholder !== null ? (
          <option value="" data-testid={tid(`${base}-options`, ...placeholderTokens.map((t) => `${t}-text`))}>
            {placeholder}
          </option>
        ) : null}
        {items.map((o) => (
          <option key={o.value} value={o.value} data-testid={tid(`${base}-options`, ...(o.mirrorTokens ?? []))}>
            {o.count === undefined ? o.label : `${o.label} (${o.count})`}
          </option>
        ))}
      </select>
    </div>
  );
}
