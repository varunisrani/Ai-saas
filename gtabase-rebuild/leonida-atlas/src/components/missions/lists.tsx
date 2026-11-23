/**
 * Shared pieces of the mission list pages (R-918..R-921).
 */
import type { ReactNode } from "react";
import { missions } from "@/data";
import { CHECKLIST_LISTS } from "@/lib";
import { ChecklistProvider } from "@/components/checklist/Checklist";

/** Every item of list `gta6-missions` (flat, no parents). */
export function missionChecklistItems() {
  return missions.map((m) => ({ id: m.checklistId }));
}

export function MissionsChecklist({ children }: { children: ReactNode }) {
  return (
    <ChecklistProvider listId={CHECKLIST_LISTS.missions} items={missionChecklistItems()}>
      {children}
    </ChecklistProvider>
  );
}

export function ListHeading({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} data-testid="chapter-heading" className="mt-10! scroll-mt-24 font-display text-xl font-bold uppercase tracking-wide text-ink">
      {children}
    </h2>
  );
}

export function Faq({ items }: { items: [string, string][] }) {
  return (
    <div className="mt-4 space-y-4">
      {items.map(([q, a]) => (
        <div key={q} className="rounded-2xl border border-sand-dark bg-white p-4">
          <h3 className="font-display text-base font-bold text-ink">{q}</h3>
          <p className="mt-1 text-sm text-muted">{a}</p>
        </div>
      ))}
    </div>
  );
}
