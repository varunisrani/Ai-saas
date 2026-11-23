"use client";

/**
 * Generic image viewer (R-1205..R-1214, R-610; DIVERGENCE D-024): a modal dialog over the page.
 * Top bar = exactly five children: counter "k/N", "Download", "Copy link", "Share…", close (×, name "close").
 * Arrows "previous"/"next" (none with a single image), ArrowLeft/ArrowRight, wheel (not macOS, one step per
 * 800 ms) and swipe/drag > 10 px step with wrap-around; Escape or the close button close it; clicks on the
 * picture or the caption strip do nothing; the address never changes. One slot per image, an image is created
 * only for loaded slots (current ± 2, wrapping; loaded images stay). While open the document root carries the
 * state token `page-scroll-lock` and the page does not scroll.
 *
 * Usage (controlled): keep `openIndex` (0-based) in the gallery; `null` = closed.
 *   <Lightbox images={imgs} openIndex={i} label="Screenshots" onClose={(last) => setI(null)} />
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { artUrl, type GalleryImage } from "@/data";
import {
  counterText,
  lightboxHasArrows,
  nextIndex,
  preloadSet,
  prevIndex,
  swipeStep,
  wheelStep,
} from "@/lib";
import { useCopyFeedback } from "./ShareActions";

export interface LightboxProps {
  images: GalleryImage[];
  /** 0-based index to open at; null = closed. */
  openIndex: number | null;
  /** Accessible name: the block heading, else the page h1. */
  label: string;
  /** Called with the last shown index (0-based) when the lightbox closes. */
  onClose: (lastIndex: number) => void;
  /** Called on every move (optional). */
  onIndexChange?: (index: number) => void;
}

const SCROLL_TOKEN = "page-scroll-lock";

function addRootToken(token: string) {
  const root = document.documentElement;
  const list = (root.getAttribute("data-testid") ?? "").split(/\s+/).filter(Boolean);
  if (!list.includes(token)) list.push(token);
  root.setAttribute("data-testid", list.join(" "));
  root.setAttribute("data-scroll-lock", "lightbox");
}

function removeRootToken(token: string) {
  const root = document.documentElement;
  const list = (root.getAttribute("data-testid") ?? "").split(/\s+/).filter((t) => t && t !== token);
  if (list.length) root.setAttribute("data-testid", list.join(" "));
  else root.removeAttribute("data-testid");
  if (root.getAttribute("data-scroll-lock") === "lightbox") root.removeAttribute("data-scroll-lock");
}

export function Lightbox(props: LightboxProps) {
  if (props.openIndex === null || props.images.length === 0) return null;
  return <LightboxOpen {...props} openIndex={props.openIndex} />;
}

function LightboxOpen({ images, openIndex, label, onClose, onIndexChange }: LightboxProps & { openIndex: number }) {
  const total = images.length;
  const start = Math.min(Math.max(0, openIndex), total - 1);
  const [index, setIndex] = useState(start);
  const [loaded, setLoaded] = useState<Set<number>>(() => preloadSet(start, total));
  const dialogRef = useRef<HTMLDialogElement>(null);
  const indexRef = useRef(start);
  const wheelAt = useRef<number | null>(null);
  const pointerX = useRef<number | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const { copied, copy } = useCopyFeedback();

  const go = useCallback(
    (to: number) => {
      indexRef.current = to;
      setIndex(to);
      setLoaded((prev) => preloadSet(to, total, prev));
      onIndexChange?.(to);
    },
    [total, onIndexChange],
  );
  const step = useCallback(
    (dir: 1 | -1 | 0) => {
      if (dir === 0) return;
      const cur = indexRef.current;
      go(dir === 1 ? nextIndex(cur, total) : prevIndex(cur, total));
    },
    [go, total],
  );

  const close = useCallback(() => {
    onClose(indexRef.current);
  }, [onClose]);

  useEffect(() => {
    const el = dialogRef.current;
    const active = document.activeElement as HTMLElement | null;
    openerRef.current = active && active !== document.body ? active : null;
    if (el) {
      try {
        if (!el.open) el.showModal();
      } catch {
        el.setAttribute("open", "");
      }
      el.focus({ preventScroll: true });
    }
    addRootToken(SCROLL_TOKEN);
    const opener = openerRef;
    return () => {
      removeRootToken(SCROLL_TOKEN);
      const o = opener.current;
      if (o && document.contains(o)) {
        try {
          o.focus({ preventScroll: true });
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    const isMac = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
    const now = Date.now();
    const s = wheelStep(e.deltaY, wheelAt.current, now, isMac);
    if (s !== 0) {
      wheelAt.current = now;
      step(s);
    }
  };

  const current = images[index];
  const arrows = lightboxHasArrows(total);
  const fullUrl = artUrl(current.art);

  return (
    <dialog
      ref={dialogRef}
      className="atlas-lightbox"
      data-testid="lightbox"
      aria-label={label}
      aria-modal="true"
      tabIndex={-1}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onKeyDown={onKeyDown}
      onWheel={onWheel}
      onPointerDown={(e) => {
        pointerX.current = e.clientX;
      }}
      onPointerUp={(e) => {
        if (pointerX.current === null) return;
        const dx = e.clientX - pointerX.current;
        pointerX.current = null;
        step(swipeStep(dx));
      }}
    >
      <div className="atlas-lb-top">
        <div className="atlas-lb-counter" data-testid="lb-counter lightbox-counter lightbox-buttons" aria-live="polite">
          {counterText(index, total).split("/")[0]}/<span data-testid="lb-total">{total}</span>
        </div>
        <button
          type="button"
          className="atlas-lb-action"
          data-testid="lb-toolbar-action lb-download lightbox-buttons"
          onClick={() => window.open(fullUrl, "_blank", "noopener")}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M12 4v11M7 10l5 5 5-5M5 19h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Download</span>
        </button>
        <button
          type="button"
          className="atlas-lb-action"
          data-testid="lb-toolbar-action lightbox-buttons"
          onClick={() => copy(window.location.href)}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>{copied ? "Copied!" : "Copy link"}</span>
        </button>
        <button
          type="button"
          className="atlas-lb-action"
          data-testid="lb-toolbar-action lightbox-buttons"
          onClick={async () => {
            const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
            if (typeof nav.share === "function") {
              try {
                await nav.share({ title: current.alt, url: window.location.href });
              } catch {
                /* cancelled */
              }
            } else {
              await copy(window.location.href);
            }
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M12 3v12M7 8l5-5 5 5M5 14v5h14v-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Share…</span>
        </button>
        <button
          type="button"
          className="atlas-lb-close"
          aria-label="close"
          data-testid="lb-close lightbox-close lightbox-buttons"
          onClick={close}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="atlas-lb-stage">
        {arrows ? (
          <button type="button" className="atlas-lb-arrow is-prev" aria-label="previous" data-testid="lb-prev lightbox-prev" onClick={() => step(-1)}>
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
        <div className="atlas-lb-slots">
          {images.map((img, i) => (
            <div key={img.id} className={`atlas-lb-slot ${i === index ? "is-current" : ""}`} data-testid="lb-slot" aria-hidden={i === index ? undefined : true}>
              {loaded.has(i) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artUrl(img.art)}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                  draggable={false}
                  data-testid={i === index ? "lb-loaded-image lb-image" : "lb-loaded-image"}
                />
              ) : null}
            </div>
          ))}
        </div>
        {arrows ? (
          <button type="button" className="atlas-lb-arrow is-next" aria-label="next" data-testid="lb-next lightbox-next" onClick={() => step(1)}>
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">
              <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
      </div>
      <div className="atlas-lb-bottom" data-testid="lb-bottom">
        <p className="atlas-lb-caption" data-testid="lb-caption">
          {current.caption}
        </p>
      </div>
    </dialog>
  );
}
