"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ChessTheme } from "@/lib/chess/themes";

type ThemePickerProps = {
  themes: ChessTheme[];
  active: ChessTheme;
  onSelect: (id: string) => void;
};

/**
 * Compact swatch popover for switching board themes. Lives next to the move
 * list so it's visible during play without crowding the board.
 */
export function ThemePicker({ themes, active, onSelect }: ThemePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Board theme"
          className="inline-flex h-8 items-center gap-2 rounded-full bg-white/[0.03] px-3 text-[12px] text-navy-200 ring-1 ring-white/10 transition hover:text-white"
        >
          <Swatch theme={active} size={14} />
          {active.name}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-56 rounded-2xl border-white/10 bg-navy-900 p-2"
      >
        <div className="grid gap-1">
          {themes.map((t) => {
            const isActive = t.id === active.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t.id)}
                className={`flex items-center gap-3 rounded-lg px-2 py-2 text-left text-[13px] transition ${
                  isActive
                    ? "bg-white/[0.06] text-white"
                    : "text-navy-200 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Swatch theme={t} size={20} />
                <span className="flex-1">{t.name}</span>
                {isActive && (
                  <span className="text-[10px] text-brand-lime">
                    active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Swatch({ theme, size }: { theme: ChessTheme; size: number }) {
  return (
    <span
      className="inline-block overflow-hidden rounded-md ring-1 ring-black/30"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${theme.light} 0%, ${theme.light} 50%, ${theme.dark} 50%, ${theme.dark} 100%)`,
      }}
    />
  );
}
