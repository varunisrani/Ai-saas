"use client";

/**
 * Grid gallery block (R-1202..R-1212): thumbnails (buttons named by the image alt, eager images) that open the
 * block's own lightbox at that image. Positional tokens: `thumb-<k>` counts thumbnails across the page
 * (`thumbStart` = number of thumbnails of earlier blocks), `g<b>-thumb-<k>` inside block b.
 */
import { useState } from "react";
import { artUrl, type GalleryImage } from "@/data";
import { Lightbox } from "@/components/ui";

export interface GridGalleryProps {
  images: GalleryImage[];
  /** 1-based block number on the page. */
  block: number;
  /** Thumbnails of earlier blocks on this page. */
  thumbStart: number;
  /** Lightbox name: the block heading, else the page h1. */
  label: string;
}

export function GridGallery({ images, block, thumbStart, label }: GridGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <>
      <ul className="atlas-thumbs">
        {images.map((img, i) => {
          const k = thumbStart + i + 1;
          const tokens = ["thumb", `thumb-${k}`, `g${block}-thumb`, `g${block}-thumb-${i + 1}`];
          const imgTokens = ["thumb-img", `g${block}-thumb-img`];
          if (k === 1) imgTokens.push("thumb-1-img");
          return (
            <li key={img.id}>
              <button type="button" className="atlas-thumb" data-testid={tokens.join(" ")} onClick={() => setOpenIndex(i)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={artUrl(img.art)} alt={img.alt} width={320} height={180} loading="eager" decoding="async" data-testid={imgTokens.join(" ")} />
              </button>
            </li>
          );
        })}
      </ul>
      <Lightbox images={images} openIndex={openIndex} label={label} onClose={() => setOpenIndex(null)} />
    </>
  );
}
