"use client";

/**
 * Shell state shared between the root layout parts (lazy footer, sub-navigation, side column) and the pages:
 * the page's breadcrumb trail (R-1312, R-1115) and whether the current page is the 404 page (R-006).
 */
import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";

export interface Crumb {
  label: string;
  /** Link target; the last crumb (current page) has none. */
  href?: string;
}

interface ShellState {
  trail: Crumb[] | null;
  setTrail: (trail: Crumb[] | null) => void;
  notFound: boolean;
  setNotFound: (v: boolean) => void;
}

const ShellCtx = createContext<ShellState | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [trail, setTrail] = useState<Crumb[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const value = useMemo(() => ({ trail, setTrail, notFound, setNotFound }), [trail, notFound]);
  return <ShellCtx.Provider value={value}>{children}</ShellCtx.Provider>;
}

export function useShell(): ShellState {
  const ctx = useContext(ShellCtx);
  if (!ctx) {
    return { trail: null, setTrail: () => {}, notFound: false, setNotFound: () => {} };
  }
  return ctx;
}

/** Rendered by the 404 page: hides the GTA 6 sub-navigation and the side column (R-006). */
export function NotFoundMarker() {
  const { setNotFound } = useShell();
  useLayoutEffect(() => {
    setNotFound(true);
    return () => setNotFound(false);
  }, [setNotFound]);
  return null;
}

/** Registers the page's breadcrumb trail (rendered by the lazy footer). */
export function useRegisterTrail(trail: Crumb[]) {
  const { setTrail } = useShell();
  const key = JSON.stringify(trail);
  useLayoutEffect(() => {
    setTrail(JSON.parse(key) as Crumb[]);
    return () => setTrail(null);
  }, [key, setTrail]);
}
