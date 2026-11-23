"use client";

/**
 * Accounts-later dialog (R-302..R-305, R-1409; DIVERGENCE D-001): replaces every member login prompt.
 * Modal (native dialog → the page behind is inert), focus moves in and returns to the opener, Escape / close /
 * "Got it" / a click on the dimmed backdrop close it, the URL never changes and no request is sent.
 * While open the root carries aria-hidden="false"; when closed it is removed from the page.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type AccountsDialogContext = "default" | "favorites" | "map";

interface AccountsDialogApi {
  open: (context?: AccountsDialogContext) => void;
  close: () => void;
}

const Ctx = createContext<AccountsDialogApi | null>(null);

export const ACCOUNTS_DIALOG_TITLE = "Sign in to Leonida Atlas";

export function AccountsDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    const active = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
    openerRef.current = active && active !== document.body ? active : null;
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener && typeof opener.focus === "function") {
      window.setTimeout(() => {
        try {
          opener.focus({ preventScroll: true });
        } catch {
          /* opener gone */
        }
      }, 0);
    }
  }, []);

  const api = useMemo(() => ({ open, close }), [open, close]);
  return (
    <Ctx.Provider value={api}>
      {children}
      {isOpen ? <AccountsDialog onClose={close} /> : null}
    </Ctx.Provider>
  );
}

/** `{ open(context?), close() }` of the accounts-later dialog. */
export function useAccountsDialog(): AccountsDialogApi {
  const ctx = useContext(Ctx);
  if (!ctx) return { open: () => {}, close: () => {} };
  return ctx;
}

function AccountsDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      if (!el.open) el.showModal();
    } catch {
      el.setAttribute("open", "");
    }
    const root = document.documentElement;
    root.setAttribute("data-scroll-lock", "dialog");
    const btn = el.querySelector<HTMLButtonElement>("[data-autofocus]");
    btn?.focus();
    return () => {
      if (root.getAttribute("data-scroll-lock") === "dialog") root.removeAttribute("data-scroll-lock");
    };
  }, []);

  return (
    <dialog
      ref={ref}
      data-testid="login-modal modal-root"
      aria-hidden="false"
      aria-modal="true"
      aria-labelledby="atlas-accounts-title"
      className="atlas-dialog"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // a click on the dimmed backdrop (outside the panel) closes the dialog
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="atlas-dialog-panel">
        <button
          type="button"
          className="atlas-dialog-close"
          aria-label="close"
          data-testid="login-modal-close modal-close"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="atlas-dialog-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="44" height="44">
            <circle cx="24" cy="24" r="21" fill="#0E4D4F" />
            <circle cx="24" cy="24" r="12" fill="none" stroke="#1F8A8A" strokeWidth="3" />
            <path d="M24 6l3 18-3 3-3-3z" fill="#FF6A4D" />
          </svg>
        </div>
        <h2 id="atlas-accounts-title" data-testid="login-heading login-title" className="atlas-dialog-title">
          {ACCOUNTS_DIALOG_TITLE}
        </h2>
        <p className="atlas-dialog-text">
          Accounts are coming later. Until then you don&apos;t need one: your checklist progress, map finds, favorites
          and settings are saved in this browser only, on this device.
        </p>
        <button type="button" className="atlas-pill atlas-pill-primary" data-autofocus onClick={onClose}>
          Got it
        </button>
      </div>
    </dialog>
  );
}
