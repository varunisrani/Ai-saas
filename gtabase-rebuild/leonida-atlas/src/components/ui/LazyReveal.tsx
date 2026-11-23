"use client";

/**
 * Deferred block (R-1506): renders `children` only once its placeholder comes within `margin` px (default 200)
 * of the viewport; the placeholder reserves `minHeight` so nothing jumps. Used by the news pager (R-1107), the
 * article / detail previous-next pagers (R-620, R-1114) and the lazy footer (R-1312).
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

export interface LazyRevealProps {
  children: ReactNode;
  margin?: number;
  minHeight?: number | string;
  className?: string;
  /** data-testid tokens of the placeholder element. */
  testId?: string;
  as?: "div" | "section" | "nav";
}

export function LazyReveal({ children, margin = 200, minHeight, className, testId }: LazyRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;
    const check = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top <= vh + margin && r.bottom >= -margin) {
        setShown(true);
        return true;
      }
      return false;
    };
    if (check()) return;
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) setShown(true);
        },
        { rootMargin: `${margin}px 0px ${margin}px 0px` },
      );
      io.observe(el);
    }
    const onScroll = () => {
      check();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [shown, margin]);

  return (
    <div ref={ref} className={className} data-testid={testId} style={shown ? undefined : { minHeight }}>
      {shown ? children : null}
    </div>
  );
}
