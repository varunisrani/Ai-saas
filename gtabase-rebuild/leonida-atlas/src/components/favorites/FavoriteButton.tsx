"use client";

/**
 * "Add To Favorites" (R-1401, R-1402; HYPOTHESIS, DIVERGENCE D-002): a real button whose star icon is hidden from
 * assistive technology, so the accessible name is exactly its text. Activating it (click, Enter, Space) toggles a
 * browser-local favorite: "Favorited" + solid star + aria-pressed="true", or back. After the first save a short note
 * "Saved in this browser" appears next to it. No dialog opens and nothing is sent.
 */
import { useState } from "react";
import { FAVORITE_LISTS, FAVORITE_SAVED_NOTE, favoriteButtonState, favoriteItemKey } from "@/lib";
import { useFavorite } from "./useFavorites";
import { pillGhost, pillPrimary } from "../lists/styles";

export interface FavoriteButtonProps {
  /** Route list name: vehicles, weapons, animals, characters, properties, radio-stations, missions, gangs, side-missions. */
  list: string;
  slug: string;
  className?: string;
}

export function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FavoriteButton({ list, slug, className }: FavoriteButtonProps) {
  const [saved, toggle] = useFavorite(FAVORITE_LISTS.items, favoriteItemKey(list, slug));
  const [savedOnce, setSavedOnce] = useState(false);
  const state = favoriteButtonState(saved);
  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <button
        type="button"
        aria-pressed={state.pressed}
        data-testid="fav-button favorites-button fav-button-role"
        data-state={saved ? "saved" : "unsaved"}
        className={saved ? pillPrimary : pillGhost}
        onClick={() => {
          if (toggle()) setSavedOnce(true);
        }}
      >
        <StarIcon filled={saved} />
        <span>{state.text}</span>
      </button>
      {savedOnce ? (
        <span className="text-sm text-muted" role="status">
          {FAVORITE_SAVED_NOTE}
        </span>
      ) : null}
    </span>
  );
}
