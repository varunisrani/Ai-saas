/**
 * The map artwork (section 20, D-UI-6): own invented island with lagoons and roads, drawn as one SVG whose
 * viewBox follows the visible map window (map units, y flipped), so it stays crisp at every zoom.
 */
import { memo } from "react";
import type { MapArtData } from "./types";

function pathOf(points: readonly [number, number][], close = true): string {
  return points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${-y}`).join(" ") + (close ? " Z" : "");
}

export const MapArt = memo(function MapArt({ art, viewBox }: { art: MapArtData; viewBox: string }) {
  const { bounds } = art;
  const island = pathOf(art.island);
  return (
    <svg
      data-testid="tile-first"
      className="pointer-events-none absolute inset-0 h-full w-full select-none"
      viewBox={viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id="la-map-waves" width="400" height="400" patternUnits="userSpaceOnUse">
          <path d="M0 200 Q100 170 200 200 T400 200" fill="none" stroke="#bfe0dc" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </pattern>
      </defs>
      <rect
        x={bounds.minX - 20000}
        y={-bounds.maxY - 20000}
        width={bounds.maxX - bounds.minX + 40000}
        height={bounds.maxY - bounds.minY + 40000}
        fill="#d4ebe8"
      />
      <rect
        x={bounds.minX - 20000}
        y={-bounds.maxY - 20000}
        width={bounds.maxX - bounds.minX + 40000}
        height={bounds.maxY - bounds.minY + 40000}
        fill="url(#la-map-waves)"
      />
      <path d={island} fill="#eadbbd" stroke="#c9e4df" strokeWidth="14" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <path d={island} fill="#f6eedf" stroke="#d8c6a2" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      {art.lagoons.map((l, i) => (
        <path key={i} d={pathOf(l)} fill="#a9d6d2" stroke="#7fbfba" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      ))}
      {art.roads.map((r, i) => (
        <g key={i}>
          <path d={pathOf(r, false)} fill="none" stroke="#d6c39f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <path d={pathOf(r, false)} fill="none" stroke="#fffaf0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </svg>
  );
});
