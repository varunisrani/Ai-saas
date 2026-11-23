"use client";

/**
 * Declares the page's breadcrumb trail (R-1115, R-1312). The trail is shown by the lazy footer (navigation
 * "Breadcrumbs", inserted when the end of the content comes near the viewport) and published as structured
 * breadcrumb data. "Home" (`/`) is always prepended; pass the crumbs after it, the last one (current page)
 * without href. Example: [{label:"GTA 6",href:"/gta-6/"},{label:"News",href:"/gta-6/news/"},{label:title}].
 * Renders nothing visible where it is placed.
 */
import { useRegisterTrail, type Crumb } from "./ShellContext";

export type { Crumb };

export const HOME_CRUMB: Crumb = { label: "Home", href: "/" };
export const GTA6_CRUMB: Crumb = { label: "GTA 6", href: "/gta-6/" };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const trail = [HOME_CRUMB, ...items];
  useRegisterTrail(trail);
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: c.href } : {}),
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
