"use client";

/**
 * Map dialogs and side panels: "Reset progress" (R-832, R-833), "About this map" (R-845), the member-action
 * panels (R-843; DIVERGENCE D-018) and "Feedback" (R-844). No request is ever sent.
 */
import { useEffect, useRef, type ReactNode } from "react";

function ModalDialog({
  testId,
  label,
  onClose,
  children,
  className,
}: {
  testId: string;
  label: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      if (!el.open) el.showModal();
    } catch {
      el.setAttribute("open", "");
    }
    const first = el.querySelector<HTMLElement>("[data-autofocus]") ?? el.querySelector<HTMLElement>("select, button");
    first?.focus();
    return () => {
      try {
        el.close();
      } catch {
        /* already closed */
      }
    };
  }, []);
  return (
    <dialog
      ref={ref}
      data-testid={testId}
      aria-label={label}
      aria-modal="true"
      className={`m-auto w-[min(440px,calc(100vw-32px))] rounded-2xl border border-sand-dark bg-white p-0 text-ink shadow-[0_20px_60px_rgb(20_22_27/0.35)] backdrop:bg-ink/50 ${className ?? ""}`}
      onCancel={(e) => {
        // Escape is routed through the map's priority order (R-842)
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="p-5">{children}</div>
    </dialog>
  );
}

export interface ResetDialogProps {
  total: number;
  options: { value: string; label: string }[];
  choice: string;
  text: string;
  done: boolean;
  onChoice: (value: string) => void;
  onReset: () => void;
  onClose: () => void;
}

export function ResetDialog(p: ResetDialogProps) {
  const showChoice = p.total > 0 && !p.done;
  const pill = "h-10 rounded-full px-5 font-display text-sm font-bold uppercase tracking-wide";
  return (
    <ModalDialog testId="reset-dialog" label="Reset progress" onClose={p.onClose}>
      <h2 data-testid="reset-title" className="font-display text-lg font-bold uppercase tracking-wide">
        Reset progress
      </h2>
      {showChoice ? (
        <label className="mt-3 block text-sm font-semibold">
          Untick the found markers of
          <select
            data-testid="reset-select"
            className="mt-1 block h-10 w-full rounded-xl border border-sand-dark bg-white px-3 text-sm font-normal"
            value={p.choice}
            onChange={(e) => p.onChoice(e.target.value)}
          >
            {p.options.map((o) => (
              <option key={o.value} value={o.value} data-testid="reset-options">
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <p data-testid="reset-say" className="mt-3 text-sm text-muted" role="status">
        {p.text}
      </p>
      <div className="mt-4 flex justify-end gap-2">
        {showChoice ? (
          <button type="button" data-testid="reset-go" className={`${pill} bg-coral text-ink hover:brightness-95`} onClick={p.onReset}>
            Reset
          </button>
        ) : null}
        <button
          type="button"
          data-testid="reset-cancel"
          className={`${pill} border border-teal bg-white text-teal hover:bg-sand`}
          data-autofocus={showChoice ? undefined : ""}
          onClick={p.onClose}
        >
          {showChoice ? "Cancel" : "Close"}
        </button>
      </div>
    </ModalDialog>
  );
}

export function AboutDialog({ onClose }: { onClose: () => void }) {
  return (
    <ModalDialog testId="about-dialog" label="About this map" onClose={onClose} className="w-[min(560px,calc(100vw-32px))]">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide">About this map</h2>
        <button
          type="button"
          aria-label="Close"
          title="Close"
          data-autofocus=""
          className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-muted hover:bg-sand hover:text-ink"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className="mt-3 space-y-3 text-sm text-muted">
        <p>
          Pick what you want to see with the switches in the sidebar: a whole group at once, a single category with
          &quot;Only&quot;, or everything with &quot;Hide all&quot; / &quot;Show all&quot;. Your choice is remembered in this browser.
        </p>
        <p>
          Type a name or a category into the search box to jump straight to a marker. In a marker&apos;s card, tick
          &quot;Found&quot; to track your collection, step through the category with Previous and Next, and use
          &quot;Copy link&quot; to share the exact spot.
        </p>
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink">Keyboard</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>Arrow keys move the map, plus and minus zoom (focus the map first).</li>
          <li>In the search box, arrow keys pick a result and Enter opens it.</li>
          <li>Escape closes the topmost card, panel or dialog.</li>
        </ul>
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink">Credits</h3>
        <p>
          The island, its roads and every marker are invented sample data drawn for Leonida Atlas. Related:{" "}
          <a
            data-testid="info-panel-links"
            href="/articles/gta-6/gta-6-100-completion-guide-interactive-checklist"
            className="font-semibold text-teal underline underline-offset-2"
          >
            the 100% checklist
          </a>
          .
        </p>
      </div>
    </ModalDialog>
  );
}

export type PanelKind = "suggest" | "personal" | "contest" | "feedback";

export function SidePanel({
  kind,
  title,
  onClose,
  onLogin,
}: {
  kind: PanelKind;
  title: string;
  onClose: () => void;
  onLogin: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("button")?.focus();
  }, [kind]);
  const member = kind !== "feedback";
  return (
    <section
      ref={ref}
      role="dialog"
      aria-label={title}
      data-testid="panel map-panel"
      className="absolute right-3 top-3 z-40 w-[320px] max-w-[calc(100%-24px)] rounded-2xl border border-sand-dark bg-white p-4 text-ink shadow-[0_10px_30px_rgb(20_22_27/0.25)]"
      data-map-scroll=""
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          data-testid="panel-close map-panel-close"
          aria-label="Close"
          title="Close"
          className="order-2 ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl text-muted hover:bg-sand hover:text-ink"
          onClick={onClose}
        >
          ×
        </button>
        <h3 data-testid="panel-title map-panel-title" className="order-1 font-display text-base font-bold uppercase tracking-wide">
          {title}
        </h3>
      </div>
      {member ? (
        <>
          <p data-testid="map-panel-text" className="mt-2 text-sm text-muted">
            {kind === "suggest"
              ? "Suggesting new places needs an account so we can thank you and follow up. Accounts are coming later; until then the map works fully without one."
              : kind === "personal"
                ? "Personal markers are saved to an account so they follow you to every device. Accounts are coming later; your ticks already stay in this browser."
                : "Map contests are run for members with an account. Accounts are coming later, so there is nothing to enter yet."}
          </p>
          <div className="mt-3 flex gap-2">
            <a
              href="/login/"
              data-testid="panel-links map-panel-login"
              className="inline-flex h-9 items-center rounded-full bg-teal px-4 font-display text-xs font-bold uppercase tracking-wide text-white! hover:bg-[#0b3e40] hover:text-white!"
              onClick={(e) => {
                e.preventDefault();
                onLogin();
              }}
            >
              Log in
            </a>
            <a
              href="/membership/free/"
              target="_blank"
              rel="noopener"
              data-testid="panel-links map-panel-join"
              className="inline-flex h-9 items-center rounded-full border border-teal px-4 font-display text-xs font-bold uppercase tracking-wide text-teal hover:bg-sand"
            >
              Join
            </a>
          </div>
        </>
      ) : (
        <p data-testid="map-panel-text" className="mt-2 text-sm text-muted">
          Spotted a marker in the wrong place or missing something? Feedback tools are coming later; for now, thanks
          for exploring the sample island.
        </p>
      )}
    </section>
  );
}
