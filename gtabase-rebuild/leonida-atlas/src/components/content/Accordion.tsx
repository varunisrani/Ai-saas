"use client";

/**
 * Accordion (R-1022..R-1026): header buttons with aria-expanded / aria-controls, panels are regions labelled by
 * their header; at most one item open (zero allowed); opening pushes "#<alias>" as a new history entry and
 * Back walks back through opened items; loading with "#<alias>" opens that item instead of the default one.
 * Keys on a header: Enter/Space toggle, ArrowDown/ArrowUp move focus, Home/End move to the first/last header
 * (moving focus never opens or closes an item; DIVERGENCE D-010). Initialised whenever it renders (D-021).
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

export interface AccordionItem {
  alias: string;
  question: string;
  answer: string;
  openByDefault: boolean;
}

function aliasFromHash(items: AccordionItem[]): string | null {
  const h = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  return items.some((i) => i.alias === h) ? h : null;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const defaultAlias = items.find((i) => i.openByDefault)?.alias ?? null;
  const [open, setOpen] = useState<string | null>(defaultAlias);
  const [ready, setReady] = useState(false);
  const headers = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const fromHash = aliasFromHash(items);
    if (fromHash) setOpen(fromHash);
    setReady(true);
    const onPop = () => setOpen(aliasFromHash(items) ?? defaultAlias);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [items, defaultAlias]);

  const toggle = useCallback((alias: string) => {
    setOpen((cur) => {
      if (cur === alias) return null;
      try {
        if (window.location.hash !== `#${alias}`) window.history.pushState(window.history.state, "", `#${alias}`);
      } catch {
        /* ignore */
      }
      return alias;
    });
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = items.length;
    let to: number | null = null;
    if (e.key === "ArrowDown") to = (i + 1) % n;
    else if (e.key === "ArrowUp") to = (i - 1 + n) % n;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = n - 1;
    if (to === null) return;
    e.preventDefault();
    headers.current[to]?.focus();
  };

  return (
    <div className="atlas-accordion" data-testid="acc-container rlta-any" data-state={ready ? "ready" : "static"}>
      {items.map((item, i) => {
        const isOpen = open === item.alias;
        const headerId = `acc-h-${item.alias}`;
        const panelId = `acc-p-${item.alias}`;
        const t = ["acc-button", `acc-${i + 1}`, "rlta-any"];
        if (i === items.length - 1) t.push("acc-last");
        if (isOpen) t.push("acc-open");
        return (
          <div key={item.alias} className={`atlas-acc-item ${isOpen ? "is-open" : ""}`}>
            <h3 className="atlas-acc-header">
              <button
                ref={(el) => {
                  headers.current[i] = el;
                }}
                id={headerId}
                type="button"
                role="button"
                tabIndex={0}
                className="atlas-acc-button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                data-testid={t.join(" ")}
                onClick={() => toggle(item.alias)}
                onKeyDown={(e) => onKeyDown(e, i)}
              >
                <span>{item.question}</span>
                <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              className="atlas-acc-panel"
              hidden={!isOpen}
              data-testid={isOpen ? "acc-panel-open rlta-any" : "rlta-any"}
            >
              <p>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
