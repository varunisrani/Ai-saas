"use client";

/** Back to top (R-1309): link href "#", fixed bottom-right, data-state "", "visible", "visible faded". */
import { useEffect, useRef, useState } from "react";
import { backToTopState, type BackToTopState } from "@/lib";

export function BackToTop() {
  const [state, setState] = useState<BackToTopState>("");
  const stateRef = useRef<BackToTopState>("");

  useEffect(() => {
    const update = () => {
      const next = backToTopState(window.scrollY, stateRef.current);
      if (next !== stateRef.current) {
        stateRef.current = next;
        setState(next);
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <a
      href="#"
      className="atlas-backtop"
      aria-label="Back to top"
      data-testid="back-to-top"
      data-state={state || undefined}
      onClick={(e) => {
        e.preventDefault();
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}
