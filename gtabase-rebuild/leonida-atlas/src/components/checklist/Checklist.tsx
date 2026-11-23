"use client";

/**
 * Guest checklists (F5, R-901..R-912, R-914..R-916): one provider per page and list, tick boxes that share its
 * state (every copy of an item shows the same state, R-904), and the percentage module of the 100% page.
 * Storage `guest_checklists` (CD2) is read after hydration; boxes stay disabled until then (R-902).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  GUEST_CHECKLISTS_KEY,
  applyGuestChecklistChange,
  cascadeToggle,
  checkboxLabel,
  checklistPercentage,
  displayPercentage,
  readChecklistIds,
  safeRead,
  safeWrite,
  stripProfileHash,
  type ChecklistItemInput,
} from "@/lib";

interface ChecklistCtx {
  listId: string;
  ready: boolean;
  ticked: ReadonlySet<string>;
  items: readonly ChecklistItemInput[];
  toggle: (id: string) => void;
}

const Ctx = createContext<ChecklistCtx | null>(null);

export function useChecklist(): ChecklistCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("ChecklistBox outside ChecklistProvider");
  return c;
}

export function ChecklistProvider({
  listId,
  items,
  children,
}: {
  listId: string;
  items: ChecklistItemInput[];
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [ticked, setTicked] = useState<ReadonlySet<string>>(() => new Set());
  const tickedRef = useRef<ReadonlySet<string>>(ticked);

  const load = useCallback(() => {
    const next = new Set(readChecklistIds(safeRead(GUEST_CHECKLISTS_KEY), listId));
    tickedRef.current = next;
    setTicked(next);
  }, [listId]);

  useEffect(() => {
    // R-911: a "#profile=<n>" suffix is removed from the address (history replace), on load and on a later change
    const stripProfile = () => {
      try {
        const h = window.location.hash;
        if (h && stripProfileHash(h) !== h) {
          window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
        }
      } catch {
        /* ignore */
      }
    };
    stripProfile();
    load();
    setReady(true);
    // R-908/R-916: saved progress returns after Back (bfcache), on focus and when the tab becomes visible
    const onShow = () => load();
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === GUEST_CHECKLISTS_KEY || e.key === null) load();
    };
    window.addEventListener("hashchange", stripProfile);
    window.addEventListener("pageshow", onShow);
    window.addEventListener("focus", onShow);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("hashchange", stripProfile);
      window.removeEventListener("pageshow", onShow);
      window.removeEventListener("focus", onShow);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, [load]);

  const toggle = useCallback(
    (id: string) => {
      const raw = safeRead(GUEST_CHECKLISTS_KEY);
      const res = cascadeToggle(items, tickedRef.current, id);
      if (!res.changes.length) return;
      safeWrite(GUEST_CHECKLISTS_KEY, applyGuestChecklistChange(raw, listId, res.changes));
      const next = new Set(res.ticked);
      tickedRef.current = next;
      setTicked(next);
    },
    [items, listId],
  );

  const value = useMemo(() => ({ listId, ready, ticked, items, toggle }), [listId, ready, ticked, items, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export interface ChecklistBoxProps {
  /** Item id inside the list (mission checklistId, 100% requirement id). */
  id: string;
  /** Visible text of the row the box sits in (R-910). */
  rowText: string;
  /** Extra test tokens (always). */
  testId?: string;
  /** Extra test tokens while ticked. */
  checkedTestId?: string;
  className?: string;
}

/** R-901..R-904, R-910: a native checkbox (Space toggles, Enter does nothing); it never follows a link. */
export function ChecklistBox({ id, rowText, testId, checkedTestId, className }: ChecklistBoxProps) {
  const { listId, ready, ticked, toggle } = useChecklist();
  const checked = ticked.has(id);
  const label = checkboxLabel(rowText);
  const tokens = [
    "cl-box",
    testId,
    checked ? "cl-box-checked" : null,
    checked ? checkedTestId : null,
    ready ? null : "cl-box-disabled",
    label.startsWith("Mark as completed") ? "cl-box-labelled" : null,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <input
      type="checkbox"
      aria-label={label}
      data-testid={tokens}
      data-checklist-id={listId}
      data-item-id={id}
      checked={checked}
      disabled={!ready}
      className={`la-cl-box h-5 w-5 shrink-0 cursor-pointer accent-[#0e4d4f] disabled:cursor-wait ${className ?? ""}`}
      onChange={() => toggle(id)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
    />
  );
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * R-914..R-916: "<n>% Completed!" with the two-decimal number and a progressbar; changes animate over ~300 ms
 * (instant when the tab is hidden or reduced motion is preferred). Below it the guest note.
 */
export function PercentModule({ className }: { className?: string }) {
  const { ticked, items } = useChecklist();
  const target = useMemo(() => checklistPercentage(items, ticked), [items, ticked]);
  const [shown, setShown] = useState(target);
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    const from = shownRef.current;
    if (from === target) return;
    if (document.visibilityState === "hidden" || prefersReducedMotion()) {
      setShown(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 300);
      const e = 1 - Math.pow(1 - t, 3);
      setShown(t >= 1 ? target : from + (target - from) * e);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const finalDisplay = displayPercentage(target);
  const display = displayPercentage(shown);
  return (
    <section
      data-testid="pct-module"
      aria-labelledby="la-pct-heading"
      className={`rounded-2xl border border-sand-dark bg-white p-4 shadow-[0_6px_24px_rgb(20_22_27/0.12)] ${className ?? ""}`}
    >
      <h3 id="la-pct-heading" className="font-display text-lg font-bold text-ink">
        <span data-testid="pct-text" className="tabular-nums text-teal">
          {display.text}
        </span>
        % Completed!
      </h3>
      <div
        role="progressbar"
        aria-label="Completion"
        aria-valuemin={0}
        aria-valuemax={100}
        {...({ "aria-valuenow": finalDisplay.valueNow } as unknown as { "aria-valuenow": number })}
        aria-valuetext={`${finalDisplay.valueNow}%`}
        data-testid="pct-bar"
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sand"
      >
        <div className="h-full rounded-full bg-lagoon" style={{ width: display.width }} />
      </div>
      <p data-testid="guest-note" className="mt-3 text-sm text-muted">
        Your ticks are saved in this browser.{" "}
        <a data-testid="guest-note-login" href="/login/" className="font-semibold text-teal underline underline-offset-2">
          Login
        </a>{" "}
        to see when accounts arrive.
      </p>
    </section>
  );
}
