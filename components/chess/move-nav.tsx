"use client";

const BUTTONS = [
  { label: "Start", glyph: "⏮" },
  { label: "Prev", glyph: "‹" },
  { label: "Auto", glyph: "▶" },
  { label: "Next", glyph: "›" },
  { label: "End", glyph: "⏭" },
] as const;

/**
 * Move-history navigation controls. Visual only for v1 — actual back/forward
 * scrubbing would need a separate "viewing position" piece of state. The
 * flip-board button on the right is wired so players can rotate perspective.
 */
export function MoveNav({ onFlip }: { onFlip: () => void }) {
  return (
    <div className="grid grid-cols-6 gap-2 p-3">
      {BUTTONS.map((b) => (
        <button
          key={b.label}
          type="button"
          aria-label={b.label}
          disabled
          className="flex h-11 items-center justify-center rounded-md bg-navy-800 text-[16px] font-bold text-navy-300 ring-1 ring-white/5 shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)] transition disabled:opacity-50"
        >
          {b.glyph}
        </button>
      ))}
      <button
        type="button"
        aria-label="Flip board"
        onClick={onFlip}
        className="flex h-11 items-center justify-center rounded-md bg-navy-800 text-[16px] font-bold text-white ring-1 ring-white/5 shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)] transition hover:bg-navy-700 active:translate-y-px active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)]"
      >
        ⇅
      </button>
    </div>
  );
}
