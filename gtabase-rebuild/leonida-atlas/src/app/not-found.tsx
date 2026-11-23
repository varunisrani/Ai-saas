import type { Metadata } from "next";
import { NotFoundMarker } from "@/components/ui";
import { NOT_FOUND } from "@/lib";

export const metadata: Metadata = {
  title: NOT_FOUND.title,
};

/** 404 page (R-010): no links inside the content area; breadcrumb "Home › Page not found". */
export default function NotFound() {
  return (
    <div className="atlas-404" data-not-found="">
      <NotFoundMarker />
      {/* hide shell parts before hydration (removed from the page once interactive, R-006) */}
      <style>{"[data-subnav]{display:none}#side-column{display:none}"}</style>
      <div className="atlas-404-art" aria-hidden="true">
        <svg viewBox="0 0 320 200" width="320" height="200">
          <defs>
            <linearGradient id="nf-sky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#0E4D4F" />
              <stop offset="1" stopColor="#1F8A8A" />
            </linearGradient>
          </defs>
          <rect width="320" height="200" rx="18" fill="url(#nf-sky)" />
          <circle cx="248" cy="58" r="24" fill="#FF6A4D" />
          <path d="M0 150 C 60 120, 120 170, 180 140 S 290 120, 320 140 L320 200 L0 200 Z" fill="#F6EEDF" opacity="0.9" />
          <path d="M40 120 L60 60 L80 120 Z" fill="#14161B" opacity="0.35" />
          <text x="160" y="118" textAnchor="middle" fontFamily="var(--font-display), sans-serif" fontSize="64" fontWeight="700" fill="#FFFFFF">
            404
          </text>
          <path d="M150 170 l10 -18 l10 18 z" fill="#FF6A4D" />
        </svg>
      </div>
      <h1 className="atlas-h1">{NOT_FOUND.title}</h1>
      <h3 className="atlas-404-sub" data-testid="not-found-sub">{NOT_FOUND.subHeading}</h3>
      <p>This spot is off the edge of our chart — the page you asked for is not part of Leonida Atlas.</p>
      <p>A few things that might have happened:</p>
      <ul className="atlas-404-list">
        <li data-testid="content-list-items">the address has a small typing slip somewhere in it</li>
        <li data-testid="content-list-items">the page moved to a new address or was retired</li>
        <li data-testid="content-list-items">the link you followed points to a place we never mapped</li>
      </ul>
      <p>Use the main menu above or the search button in the header to find your way back.</p>
    </div>
  );
}
