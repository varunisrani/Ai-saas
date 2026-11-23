/**
 * Right side column (R-1313, R-1405): "Latest GTA 6 Content" (8 newest items with their section name) and the
 * "Your favourites" block. Mounted ONCE by the root layout inside <main> (after the page content) —
 * pages must not render it again. Hidden on the 404 page. On phones it follows the content.
 */
import Link from "next/link";
import { latestContent } from "@/data";
import { ArtImage } from "./ArtImage";
import { FavoritesBlock, SideColumnGate } from "./SideColumnClient";

export function SideColumn() {
  const items = latestContent(8);
  return (
    <SideColumnGate>
      <aside id="side-column" className="atlas-side" aria-label="Side column" data-testid="sidebar" tabIndex={-1}>
        <section className="atlas-side-block" data-testid="sidebar-latest" aria-labelledby="atlas-side-latest">
          <h2 id="atlas-side-latest" className="atlas-side-title caps">
            Latest GTA 6 Content
          </h2>
          <ul className="atlas-side-list">
            {items.map((it) => (
              <li key={it.path}>
                <Link href={it.path} className="atlas-side-item">
                  <ArtImage art={it.image} alt="" width={96} height={54} className="atlas-side-thumb" />
                  <span className="atlas-side-text">
                    <span className="atlas-side-section">{it.section}</span>
                    <span className="atlas-side-name">{it.title}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <FavoritesBlock />
      </aside>
    </SideColumnGate>
  );
}
