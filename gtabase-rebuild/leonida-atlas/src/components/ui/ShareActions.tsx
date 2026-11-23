"use client";

/**
 * Own share actions (DIVERGENCE D-006): "Copy link" (copies the page URL; "Copied!" for 1.5 s, announced politely,
 * R-1504) and "Share…" (native share sheet when available, else copy). Tokens: the group carries `share`
 * (F2) and `share-block` (F7); each button `share-buttons`.
 */
import { useEffect, useRef, useState } from "react";

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function useCopyFeedback(ms = 1500) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  const copy = async (text: string) => {
    await copyText(text);
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), ms);
  };
  return { copied, copy };
}

export function ShareActions({ title, className }: { title?: string; className?: string }) {
  const { copied, copy } = useCopyFeedback();
  const share = async () => {
    const url = window.location.href;
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (typeof nav.share === "function") {
      try {
        await nav.share({ title: title ?? document.title, url });
        return;
      } catch {
        return;
      }
    }
    await copy(url);
  };
  return (
    <div className={`atlas-share ${className ?? ""}`} data-testid="share share-block" role="group" aria-label="Share this page">
      <button type="button" className="atlas-share-btn" data-testid="share-buttons" onClick={() => copy(window.location.href)}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>{copied ? "Copied!" : "Copy link"}</span>
      </button>
      <button type="button" className="atlas-share-btn" data-testid="share-buttons" onClick={share}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
          <path d="M12 3v12M7 8l5-5 5 5M5 14v5h14v-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Share…</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied!" : ""}
      </span>
    </div>
  );
}
