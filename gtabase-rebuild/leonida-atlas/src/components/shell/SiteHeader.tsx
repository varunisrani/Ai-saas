"use client";

/**
 * Header bar (R-1301..R-1305, R-1307): logo, main menu with four disclosure sub-menus, search panel,
 * "Log In" (accounts-later dialog) + "Join"; below 1024 px a "Menu" button, the search form as the last menu
 * entry and the "Account" menu. Only one popover is open at a time; Escape and a click outside close it.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { useAccountsDialog } from "@/components/ui/AccountsDialog";
import { useShell } from "@/components/ui/ShellContext";
import { CompassRose, Wordmark } from "./Logo";
import { MAIN_MENU, isGta6Path, type NavEntry } from "./nav";

type Popover = null | "search" | "account" | "phone-menu";

const PHONE_QUERY = "(max-width: 1023.98px)";

function isPhone(): boolean {
  return typeof window !== "undefined" && window.matchMedia(PHONE_QUERY).matches;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SearchForm({ variant }: { variant: "panel" | "menu" }) {
  const id = useId();
  const inputId = `atlas-search-${variant}-${id.replace(/:/g, "")}`;
  return (
    <form action="/search" method="get" role="search" className={`atlas-search-form is-${variant}`}>
      <label htmlFor={inputId} className="sr-only">
        Search
      </label>
      <input
        id={inputId}
        type="search"
        name="q"
        placeholder="Search …"
        autoComplete="off"
        data-testid={variant === "panel" ? "search-input" : "mobile-search-input"}
      />
      <button type="submit" className="atlas-search-submit" data-testid={variant === "panel" ? "search-submit" : undefined}>
        Search
      </button>
    </form>
  );
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const { notFound } = useShell();
  const accounts = useAccountsDialog();
  const [popover, setPopover] = useState<Popover>(null);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const accountToggleRef = useRef<HTMLButtonElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  const gta6Active = !notFound && isGta6Path(pathname);

  // close menus on navigation
  useEffect(() => {
    setPopover(null);
    setOpenSub(null);
  }, [pathname]);

  // click outside closes popovers and sub-menus
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const h = headerRef.current;
      if (!h) return;
      if (!h.contains(e.target as Node)) {
        setPopover(null);
        setOpenSub(null);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  useEffect(() => {
    if (popover === "search") {
      const input = headerRef.current?.querySelector<HTMLInputElement>('[data-testid~="search-input"]');
      input?.focus();
    }
  }, [popover]);

  const togglePopover = useCallback((p: Exclude<Popover, null>) => {
    setPopover((cur) => (cur === p ? null : p));
    if (p !== "phone-menu") setOpenSub(null);
  }, []);

  const onHeaderKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    if (openSub) {
      const btn = toggleRefs.current[openSub];
      setOpenSub(null);
      btn?.focus();
      e.stopPropagation();
      return;
    }
    if (popover) {
      const target =
        popover === "search" ? searchToggleRef.current : popover === "account" ? accountToggleRef.current : menuToggleRef.current;
      setPopover(null);
      target?.focus();
      e.stopPropagation();
    }
  };

  const onParentClick = (entry: NavEntry) => (e: MouseEvent<HTMLAnchorElement | HTMLSpanElement>) => {
    if (!entry.sub) return;
    const modifier = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
    if (isPhone() && !modifier) {
      // phone: a plain tap toggles the sub-menu instead of navigating (R-1305)
      e.preventDefault();
      setOpenSub((cur) => (cur === entry.id ? null : entry.id));
      return;
    }
    if (entry.href === "#") e.preventDefault();
  };

  return (
    <header ref={headerRef} className="atlas-header atlas-dark" onKeyDown={onHeaderKeyDown}>
      <div className="atlas-header-bar">
        <button
          ref={menuToggleRef}
          type="button"
          className="atlas-menu-toggle"
          aria-expanded={popover === "phone-menu"}
          aria-controls="main-nav"
          data-testid="menu-toggle menu-button"
          onClick={() => togglePopover("phone-menu")}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
            {popover === "phone-menu" ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            )}
          </svg>
          <span className="sr-only">Menu</span>
        </button>

        <Link href="/" className="atlas-logo" aria-label="Leonida Atlas" title="Leonida Atlas" data-testid="site-logo">
          <CompassRose size={36} />
          <Wordmark />
        </Link>

        <nav id="main-nav" aria-label="Main menu" className={`atlas-nav ${popover === "phone-menu" ? "is-open" : ""}`}>
          <ul className="atlas-menu" data-testid="main-menu">
            {MAIN_MENU.map((entry) => {
              const open = openSub === entry.id;
              const active = entry.id === "gta6" && gta6Active;
              const linkTokens = ["menu-top-links", entry.testId].filter(Boolean).join(" ");
              return (
                <li
                  key={entry.id}
                  className={`atlas-menu-item ${entry.sub ? "has-sub" : ""} ${open ? "is-open" : ""} ${active ? "is-active" : ""}`}
                  data-state={active ? "active" : undefined}
                >
                  <span className="atlas-menu-row">
                    {entry.href !== undefined ? (
                      <a href={entry.href} className="atlas-menu-link" data-testid={linkTokens} onClick={onParentClick(entry)}>
                        {entry.label}
                      </a>
                    ) : (
                      <span className="atlas-menu-link is-label" onClick={onParentClick(entry)}>
                        {entry.label}
                      </span>
                    )}
                    {entry.sub ? (
                      <button
                        ref={(el) => {
                          toggleRefs.current[entry.id] = el;
                        }}
                        type="button"
                        className="atlas-sub-toggle"
                        aria-expanded={open}
                        aria-controls={`atlas-sub-${entry.id}`}
                        aria-label={`${open ? "Hide" : "Show"} ${entry.label} menu`}
                        data-testid={`submenu-toggles submenu-toggle-${entry.id}`}
                        onClick={() => setOpenSub((cur) => (cur === entry.id ? null : entry.id))}
                      >
                        <span className="atlas-sub-icon" aria-hidden="true">
                          {open ? "−" : "+"}
                        </span>
                      </button>
                    ) : null}
                  </span>
                  {entry.sub ? (
                    <ul id={`atlas-sub-${entry.id}`} className="atlas-submenu" data-testid={entry.testId ? `${entry.testId}-sub` : undefined}>
                      {entry.sub.map((l) => (
                        <li key={l.label}>
                          <a
                            href={l.href}
                            aria-label={l.ariaLabel}
                            data-testid={[entry.testId ? `${entry.testId}-sub-links` : null, l.testId].filter(Boolean).join(" ") || undefined}
                          >
                            {l.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
            <li className="atlas-menu-search">
              <SearchForm variant="menu" />
            </li>
          </ul>
        </nav>

        <div className="atlas-header-actions">
          <div className="atlas-search-wrap">
            <button
              ref={searchToggleRef}
              type="button"
              className="atlas-icon-btn atlas-search-toggle"
              aria-expanded={popover === "search"}
              aria-controls="atlas-search-panel"
              data-testid="search-toggle"
              onClick={() => togglePopover("search")}
            >
              <SearchIcon />
              <span className="sr-only">Search</span>
            </button>
            <div id="atlas-search-panel" className="atlas-search-panel" data-testid="search-panel" hidden={popover !== "search"}>
              <SearchForm variant="panel" />
            </div>
          </div>
          <button
            type="button"
            className="atlas-login"
            data-testid="login-link header-login modal-trigger modal-trigger-login"
            onClick={() => accounts.open("default")}
          >
            Log In
          </button>
          <Link href="/membership/free/" className="atlas-pill atlas-join" data-testid="join-link header-join">
            Join
          </Link>
          <div className="atlas-account">
            <button
              ref={accountToggleRef}
              type="button"
              className="atlas-icon-btn atlas-account-toggle"
              aria-expanded={popover === "account"}
              aria-controls="atlas-account-menu"
              aria-haspopup="true"
              data-testid="user-dropdown-toggle mobile-join-toggle"
              onClick={() => togglePopover("account")}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
                <circle cx="12" cy="8.5" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M4 20c1.5-4 4.5-5.5 8-5.5s6.5 1.5 8 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="sr-only">Account</span>
            </button>
            <ul id="atlas-account-menu" className="atlas-account-menu" hidden={popover !== "account"}>
              <li>
                <button
                  type="button"
                  data-testid="user-dropdown-items mobile-login modal-trigger modal-trigger-login"
                  onClick={() => {
                    setPopover(null);
                    accounts.open("default");
                  }}
                >
                  Log In
                </button>
              </li>
              <li>
                <button
                  type="button"
                  data-testid="user-dropdown-items"
                  onClick={() => {
                    setPopover(null);
                    accounts.open("default");
                  }}
                >
                  Create Account
                </button>
              </li>
              <li>
                <Link href="/membership/" data-testid="user-dropdown-items">
                  Membership
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
