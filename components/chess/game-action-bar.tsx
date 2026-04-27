"use client";

type GameActionBarProps = {
  /** Disables all buttons when the game has finished. */
  disabled?: boolean;
  onResign?: () => void;
  onOfferDraw?: () => void;
};

/**
 * Compact action strip rendered between the board and the right rail. Matches
 * the chess.com pattern: ½-Draw on the left, Resign next to it, with each
 * button rendered as a flat secondary surface with semibold labels.
 */
export function GameActionBar({
  disabled,
  onResign,
  onOfferDraw,
}: GameActionBarProps) {
  return (
    <div className="flex items-center gap-2 px-1 pt-2">
      <ActionButton
        glyph="½"
        label="Draw"
        onClick={onOfferDraw}
        disabled={disabled || !onOfferDraw}
      />
      <ActionButton
        glyph="✕"
        label="Resign"
        onClick={onResign}
        disabled={disabled || !onResign}
      />
    </div>
  );
}

function ActionButton({
  glyph,
  label,
  onClick,
  disabled,
}: {
  glyph: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 items-center gap-2 rounded-md px-3.5 text-[14px] font-semibold text-navy-200 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
    >
      <span aria-hidden="true">{glyph}</span>
      {label}
    </button>
  );
}
