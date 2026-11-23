"use client";

/**
 * Cover block (R-1202, R-1205): one large main image with a zoom icon and its caption under it, no thumbnails;
 * a click or Enter on the main image opens the lightbox at that image.
 */
import { useState } from "react";
import { artUrl, type GalleryImage } from "@/data";
import { Lightbox } from "@/components/ui";

export function CoverGallery({ images, label }: { images: GalleryImage[]; label: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const main = images[0];
  if (!main) return <p data-testid="gallery-empty">Coming soon.</p>;
  return (
    <div className="atlas-slideshow" data-testid="main-slideshow">
      <button type="button" className="atlas-main-image" data-testid="main-image g1-main-active" onClick={() => setOpenIndex(0)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artUrl(main.art)} alt={main.alt} width={main.width} height={main.height} loading="eager" data-testid="thumb-img g1-main-active-img" />
        <span className="atlas-zoom-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <p className="atlas-image-caption" data-testid="image-description">
        {main.caption}
      </p>
      <Lightbox images={images} openIndex={openIndex} label={label} onClose={() => setOpenIndex(null)} />
    </div>
  );
}
