"use client";

/**
 * Embedded block (R-1202, R-1205, R-1211): a main image with previous/next buttons and a horizontal thumbnail
 * strip. A thumbnail click only changes the main image and marks that thumbnail active (exactly one); a click or
 * Enter on the main image opens the lightbox there; after closing, the main image and the active thumbnail are
 * the last image shown in the lightbox.
 */
import { useState } from "react";
import { artUrl, type GalleryImage } from "@/data";
import { Lightbox } from "@/components/ui";
import { nextIndex, prevIndex } from "@/lib";

export interface EmbeddedGalleryProps {
  images: GalleryImage[];
  block: number;
  thumbStart: number;
  label: string;
}

export function EmbeddedGallery({ images, block, thumbStart, label }: EmbeddedGalleryProps) {
  const [active, setActive] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const main = images[active];
  if (!main) return <p data-testid="gallery-empty">Coming soon.</p>;
  const b = `g${block}`;
  return (
    <div className="atlas-embedded">
      <div className="atlas-slideshow" data-testid="main-slideshow">
        <button type="button" className="atlas-main-image" data-testid={`main-image ${b}-main-active`} onClick={() => setOpenIndex(active)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={artUrl(main.art)} alt={main.alt} width={main.width} height={main.height} loading="eager" data-testid={`${b}-main-active-img`} />
          <span className="atlas-zoom-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
              <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </button>
        {images.length > 1 ? (
          <>
            <button type="button" className="atlas-slide-nav is-prev" aria-label="Previous image" data-testid={`${b}-main-prev`} onClick={() => setActive((i) => prevIndex(i, images.length))}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className="atlas-slide-nav is-next" aria-label="Next image" data-testid={`${b}-main-next`} onClick={() => setActive((i) => nextIndex(i, images.length))}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        ) : null}
      </div>
      <p className="atlas-image-caption">{main.caption}</p>
      <ul className="atlas-strip">
        {images.map((img, i) => {
          const isActive = i === active;
          const k = thumbStart + i + 1;
          const t = ["thumb", `thumb-${k}`, `${b}-thumb`, `${b}-thumb-${i + 1}`];
          if (isActive) t.push(`${b}-active-thumb`, `${b}-thumb-${i + 1}-active`);
          const it = ["thumb-img", `${b}-thumb-img`];
          if (k === 1) it.push("thumb-1-img");
          if (isActive) it.push(`${b}-active-thumb-img`);
          return (
            <li key={img.id}>
              <button
                type="button"
                className={`atlas-thumb ${isActive ? "is-active" : ""}`}
                aria-pressed={isActive}
                data-testid={t.join(" ")}
                onClick={() => setActive(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={artUrl(img.art)} alt={img.alt} width={160} height={90} loading="eager" decoding="async" data-testid={it.join(" ")} />
              </button>
            </li>
          );
        })}
      </ul>
      <Lightbox
        images={images}
        openIndex={openIndex}
        label={label}
        onClose={(last) => {
          setOpenIndex(null);
          setActive(last);
        }}
      />
    </div>
  );
}
