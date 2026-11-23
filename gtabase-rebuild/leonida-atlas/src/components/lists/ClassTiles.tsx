"use client";

/**
 * Class tiles (R-510..R-513): a plain click on an unpicked tile switches to it, Ctrl/Cmd/Shift + click adds it, a
 * click on a picked tile removes it; each tile has a small "+" button that adds without switching. Each tile is a
 * native checkbox (name "<label> (<n>)"); Space on it behaves like a plain click. Tiles with count 0 stay visible
 * and are marked empty. On phones the tiles form one horizontally scrollable row (R-536).
 */
import type { MouseEvent } from "react";
import { addTileLabel, isAddModifier, optionLabel } from "@/lib";
import { tid } from "./tid";

export interface TileOption {
  value: string;
  label: string;
  count: number;
}

export interface ClassTilesProps {
  title: string;
  options: TileOption[];
  picked: readonly string[];
  onPick: (value: string, modifierHeld: boolean, viaAddButton: boolean) => void;
}

export function ClassTiles({ title, options, picked, onPick }: ClassTilesProps) {
  return (
    <ul
      aria-label={title}
      className="m-0 flex list-none gap-2 overflow-x-auto p-0 pb-1 [scrollbar-width:thin] lg:flex-wrap lg:overflow-visible"
    >
      {options.map((o, i) => {
        const isPicked = picked.includes(o.value);
        const empty = o.count === 0;
        const text = optionLabel(o.label, o.count);
        const onLabelClick = (e: MouseEvent<HTMLLabelElement>) => {
          const onInput = (e.target as HTMLElement).tagName === "INPUT";
          // A click on the label text must not re-dispatch a click to the checkbox: the state below is the truth.
          if (!onInput) e.preventDefault();
          onPick(o.value, isAddModifier(e), false);
        };
        return (
          <li
            key={o.value}
            data-testid={tid("class-options", empty && "class-empty")}
            data-state={empty ? "empty" : undefined}
            className={`flex shrink-0 items-stretch overflow-hidden rounded-pill border text-sm transition-colors ${
              isPicked ? "border-teal bg-teal text-white" : "border-sand-dark bg-white text-ink hover:border-lagoon"
            } ${empty && !isPicked ? "opacity-55" : ""}`}
          >
            <label
              data-testid={tid(`class-${o.value}`, i === 0 && "class-1")}
              className="flex cursor-pointer select-none items-center gap-1.5 py-1.5 pl-3 pr-2 whitespace-nowrap has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-lagoon"
              onClick={onLabelClick}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={isPicked}
                onChange={() => {
                  /* handled by the label click (R-510) */
                }}
                data-testid={tid(`class-${o.value}-box`, isPicked && "class-checked")}
              />
              <span>{text}</span>
            </label>
            <button
              type="button"
              aria-label={addTileLabel(o.label)}
              title={addTileLabel(o.label)}
              className={`border-l px-2 font-display font-bold ${isPicked ? "border-white/30 text-white/80" : "border-sand-dark text-teal hover:bg-lagoon/10"}`}
              onClick={() => onPick(o.value, false, true)}
            >
              +
            </button>
          </li>
        );
      })}
    </ul>
  );
}
