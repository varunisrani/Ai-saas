"use client";

/**
 * Detail-page gallery (R-609, R-610): a horizontal strip of thumbnails with previous/next scroll buttons; each
 * thumbnail is a button-like link named by its image alt text; click or Enter opens the shared lightbox at that
 * image (one lightbox per gallery). An empty gallery shows "Coming soon." (state token `gallery-empty`).
 */
import { useRef, useState } from "react";
import type { GalleryImage } from "@/data";
import { Lightbox } from "@/components/ui";
import { tid } from "../lists/tid";

export interface GalleryStripProps {
  images: GalleryImage[];
  /** Lightbox accessible name (the section heading). */
  label: string;
  /** Thumbnail URLs, resolved on the server. */
  thumbs: string[];
  /** Offset of this gallery's thumbnails among all thumbnails of the page (for `gallery-thumb-1`). */
  firstIndex?: number;
}

export function GalleryStrip({ images, label, thumbs, firstIndex = 0 }: GalleryStripProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const stripRef = useRef<HTMLUListElement>(null);
  if (!images.length) {
    return (
      <div data-testid="gallery gallery-empty" data-state="empty" className="rounded-xl bg-sand/70 px-4 py-6 text-center font-display font-semibold text-muted">
        Coming soon.
      </div>
    );
  }
  const scroll = (dir: 1 | -1) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(200, el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <div data-testid="gallery" className="relative">
      <button
        type="button"
        aria-label="Scroll thumbnails left"
        className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/80 text-white hover:bg-teal"
        onClick={() => scroll(-1)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <ul ref={stripRef} className="m-0 flex list-none snap-x gap-2 overflow-x-auto scroll-smooth px-10 py-1 [scrollbar-width:thin]">
        {images.map((img, i) => (
          <li key={img.id} className="shrink-0 snap-start">
            <a
              href="#"
              role="button"
              aria-label={img.alt}
              data-testid={tid("gallery-thumbs", firstIndex + i === 0 && "gallery-thumb-1")}
              className="block overflow-hidden rounded-lg border border-sand-dark hover:shadow-soft"
              onClick={(e) => {
                e.preventDefault();
                setOpenIndex(i);
              }}
              onKeyDown={(e) => {
                if (e.key === " ") {
                  e.preventDefault();
                  setOpenIndex(i);
                }
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbs[i]} alt={img.alt} width={192} height={108} loading="eager" className="h-[108px] w-[192px] object-cover" />
            </a>
          </li>
        ))}
      </ul>
      <button
        type="button"
        aria-label="Scroll thumbnails right"
        className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/80 text-white hover:bg-teal"
        onClick={() => scroll(1)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <Lightbox images={images} openIndex={openIndex} label={label} onClose={() => setOpenIndex(null)} />
    </div>
  );
}
