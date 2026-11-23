"use client";

/**
 * Previous/next links of a detail page (R-620, R-1506): inserted only when the comments placeholder (the end of the
 * article area, element `#<targetId>`) comes within 200 px of the viewport; the placeholder reserves its height so
 * nothing jumps. rel prev/next, text = the neighbour's name; none at the ends of the list.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DEFERRED_BLOCK_DISTANCE_PX, isWithinViewportDistance } from "@/lib";

export interface PagerTarget {
  name: string;
  path: string;
}

export function DeferredPager({ prev, next, targetId = "comments" }: { prev?: PagerTarget; next?: PagerTarget; targetId?: string }) {
  const [shown, setShown] = useState(false);
  const selfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shown) return;
    const target = document.getElementById(targetId) ?? selfRef.current;
    if (!target) return;
    const check = () => {
      const r = target.getBoundingClientRect();
      if (isWithinViewportDistance(r.top, window.innerHeight, DEFERRED_BLOCK_DISTANCE_PX)) {
        setShown(true);
        return true;
      }
      return false;
    };
    if (check()) return;
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((items) => {
        if (items.some((i) => i.isIntersecting)) setShown(true);
      }, { rootMargin: `0px 0px ${DEFERRED_BLOCK_DISTANCE_PX}px 0px` });
      io.observe(target);
    }
    const onScroll = () => check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [shown, targetId]);

  if (!prev && !next) return null;
  return (
    <div ref={selfRef} className="min-h-[64px]">
      {shown ? (
        <nav aria-label="Previous and next" data-testid="pager" className="grid grid-cols-2 gap-3">
          {prev ? (
            <Link
              href={prev.path}
              rel="prev"
              data-testid="pager-prev"
              className="col-start-1 flex items-center gap-2 rounded-card border border-sand-dark bg-white px-4 py-3 font-display font-semibold no-underline hover:shadow-soft"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{prev.name}</span>
            </Link>
          ) : null}
          {next ? (
            <Link
              href={next.path}
              rel="next"
              data-testid="pager-next"
              className="col-start-2 flex items-center justify-end gap-2 rounded-card border border-sand-dark bg-white px-4 py-3 text-right font-display font-semibold no-underline hover:shadow-soft"
            >
              <span>{next.name}</span>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
