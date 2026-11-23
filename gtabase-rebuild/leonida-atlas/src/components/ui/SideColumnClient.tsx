"use client";

/** Client parts of the side column: the 404 gate and the "Your favourites" block (R-1405, HYPOTHESIS). */
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { FAVORITES_KEY, recentFavorites, safeRead, type RecentFavorite } from "@/lib";
import { useShell } from "./ShellContext";

export function SideColumnGate({ children }: { children: ReactNode }) {
  const { notFound } = useShell();
  if (notFound) return null;
  return <>{children}</>;
}

/** Fired by favorite controls after they change `atlas-favorites` (the block also re-reads on its own). */
export const FAVORITES_EVENT = "atlas-favorites-change";

export function notifyFavoritesChanged() {
  try {
    window.dispatchEvent(new Event(FAVORITES_EVENT));
  } catch {
    /* ignore */
  }
}

interface Resolved {
  key: string;
  title: string;
  href: string;
  section: string;
}

function lookupKey(f: RecentFavorite): string {
  return `${f.listKey}:${f.key}`;
}

export function FavoritesBlock() {
  const [raw, setRaw] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Record<string, Resolved>>({});

  useEffect(() => {
    const read = () => setRaw(safeRead(FAVORITES_KEY, "local"));
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === FAVORITES_KEY) read();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(FAVORITES_EVENT, read);
    window.addEventListener("focus", read);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") read();
    }, 1500);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(FAVORITES_EVENT, read);
      window.removeEventListener("focus", read);
      window.clearInterval(timer);
    };
  }, []);

  const favs = raw ? recentFavorites(raw) : [];
  const missing = favs.map(lookupKey).filter((k) => !resolved[k]);
  const missingKey = missing.join(",");

  useEffect(() => {
    if (!missingKey) return;
    let cancelled = false;
    const params = new URLSearchParams();
    for (const k of missingKey.split(",")) params.append("k", k);
    fetch(`/search/lookup?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Resolved[]) => {
        if (cancelled) return;
        setResolved((prev) => {
          const next = { ...prev };
          for (const row of rows) next[row.key] = row;
          return next;
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [missingKey]);

  if (!favs.length) return null;
  return (
    <section className="atlas-side-block" data-testid="sidebar-favorites" aria-labelledby="atlas-side-favs">
      <h2 id="atlas-side-favs" className="atlas-side-title caps">
        Your favourites
      </h2>
      <ul className="atlas-side-favs">
        {favs.map((f) => {
          const r = resolved[lookupKey(f)];
          return (
            <li key={lookupKey(f)}>
              <Link href={r?.href ?? f.href}>
                <span className="atlas-side-section">{r?.section ?? (f.listKey === "gta6-map" ? "Map" : "")}</span>
                <span className="atlas-side-name">{r?.title ?? f.key}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="atlas-side-note">Saved in this browser only.</p>
    </section>
  );
}
