/**
 * Placeholder image of the sample data (section 20, D-UI-6): renders `/art/<kind>/<id>.svg` (route of section 0.1
 * row 36) with the descriptor's intrinsic size. Plain <img> so it works in server and client components.
 */
import type { ImgHTMLAttributes } from "react";
import { artFor, artUrl, type ArtRef } from "@/data";

export interface ArtImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  art: ArtRef;
  alt: string;
  /** Default "lazy"; pass "eager" for above-the-fold images and gallery thumbnails (R-1203). */
  loading?: "lazy" | "eager";
}

export function ArtImage({ art, alt, loading = "lazy", width, height, ...rest }: ArtImageProps) {
  const d = artFor(art.kind, art.id);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={artUrl(art)}
      alt={alt}
      width={width ?? d?.width}
      height={height ?? d?.height}
      loading={loading}
      decoding="async"
      {...rest}
    />
  );
}
