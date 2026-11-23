/** Media tab bar (R-1201): Screenshots, Trailer Screens, Artworks, Videos; the current tab is marked. */
import Link from "next/link";

const TABS = [
  { key: "screenshots", label: "Screenshots", href: "/gta-6/screenshots/" },
  { key: "trailers", label: "Trailer Screens", href: "/gta-6/screenshots/trailers/" },
  { key: "artworks", label: "Artworks", href: "/gta-6/artworks/" },
  { key: "videos", label: "Videos", href: "/gta-6/videos/" },
] as const;

export function MediaTabs({ current }: { current: "screenshots" | "trailers" | "artworks" }) {
  return (
    <nav aria-label="Media">
      <ul className="atlas-media-tabs">
        {TABS.map((t) => {
          const active = t.key === current;
          const tokens = ["media-tab", `media-tab-${t.key}`];
          if (active) tokens.push("media-tab-active");
          return (
            <li key={t.key}>
              <Link href={t.href} aria-current={active ? "page" : undefined} data-testid={tokens.join(" ")}>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
