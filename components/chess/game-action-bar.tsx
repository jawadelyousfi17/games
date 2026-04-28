"use client";

import { Handshake, Flag } from "lucide-react";

type GameActionBarProps = {
  /** Disables all buttons when the game has finished. */
  disabled?: boolean;
  onResign?: () => void;
  onOfferDraw?: () => void;
  /** When true, the user has already offered a draw — button shows
   *  "Offered…" and is disabled until the opponent responds. */
  drawOffered?: boolean;
};

/**
 * Compact action strip rendered between the board and the right rail.
 * Mirrors the chess.com pattern — Draw on the left, Resign on the right.
 */
export function GameActionBar({
  disabled,
  onResign,
  onOfferDraw,
  drawOffered,
}: GameActionBarProps) {
  return (
    <div className="flex items-center gap-2 px-1 pt-2">
      <ActionButton
        Icon={Handshake}
        label={drawOffered ? "Offered…" : "Draw"}
        onClick={onOfferDraw}
        disabled={disabled || !onOfferDraw || drawOffered}
      />
      <ActionButton
        Icon={Flag}
        label="Resign"
        onClick={onResign}
        disabled={disabled || !onResign}
      />
    </div>
  );
}

function ActionButton({
  Icon,
  label,
  onClick,
  disabled,
}: {
  Icon: typeof Handshake;
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
      <Icon className="h-[16px] w-[16px]" strokeWidth={2} />
      {label}
    </button>
  );
}
