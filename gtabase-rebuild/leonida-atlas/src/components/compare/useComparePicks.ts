"use client";

/**
 * Compare picks of one list (R-702..R-704): sessionStorage `gtabCompare:<list path>`, a JSON array of
 * `{id, name}` in pick order. Nothing is written before the first change; "Clear" stores "[]"; unreadable JSON
 * counts as no picks. `ready` turns true once the stored picks were read (after hydration).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { compareStorageKey, readPicks, safeRead, safeWrite, serializePicks, togglePick, type ComparePick } from "@/lib";

export function useComparePicks(listPath: string) {
  const key = compareStorageKey(listPath);
  const [picks, setPicks] = useState<readonly ComparePick[]>([]);
  const [ready, setReady] = useState(false);
  const picksRef = useRef<readonly ComparePick[]>([]);

  useEffect(() => {
    const read = () => {
      const p = readPicks(safeRead(key, "session"));
      picksRef.current = p;
      setPicks(p);
    };
    read();
    setReady(true);
    // coming back to the page (bfcache) re-reads the picks (R-704)
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) read();
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [key]);

  const commit = useCallback(
    (next: readonly ComparePick[]) => {
      picksRef.current = next;
      setPicks(next);
      safeWrite(key, serializePicks(next), "session");
    },
    [key],
  );

  const toggle = useCallback(
    (item: ComparePick) => {
      const current = picksRef.current;
      const next = togglePick(current, item);
      if (next === current) return; // a 5th pick with 4 picked changes nothing (R-702)
      commit(next);
    },
    [commit],
  );

  const clear = useCallback(() => commit([]), [commit]);

  return { picks, toggle, clear, ready };
}
