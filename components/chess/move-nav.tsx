"use client";

import {
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  FlipVertical2,
} from "lucide-react";

type MoveNavProps = {
  /** Total number of plies in the history. */
  total: number;
  /** Current viewing ply (-1 = starting position, 0..total-1 = after that ply). */
  currentPly: number;
  /** Sets the new viewing ply. Caller clamps. */
  onSeek: (ply: number) => void;
  /** Flip board orientation. */
  onFlip: () => void;
};

/**
 * Move-history navigation strip. Wires Start / Prev / Next / End controls to
 * step through the game's positions; the flip-board button rotates board
 * perspective independently.
 */
export function MoveNav({ total, currentPly, onSeek, onFlip }: MoveNavProps) {
  const atStart = currentPly <= -1;
  const atEnd = currentPly >= total - 1;

  return (
    <div className="grid grid-cols-5 gap-2 p-3">
      <NavBtn
        label="Start"
        Icon={SkipBack}
        disabled={atStart}
        onClick={() => onSeek(-1)}
      />
      <NavBtn
        label="Previous"
        Icon={ChevronLeft}
        disabled={atStart}
        onClick={() => onSeek(currentPly - 1)}
      />
      <NavBtn
        label="Next"
        Icon={ChevronRight}
        disabled={atEnd || total === 0}
        onClick={() => onSeek(currentPly + 1)}
      />
      <NavBtn
        label="End"
        Icon={SkipForward}
        disabled={atEnd || total === 0}
        onClick={() => onSeek(total - 1)}
      />
      <NavBtn label="Flip board" Icon={FlipVertical2} onClick={onFlip} />
    </div>
  );
}

function NavBtn({
  label,
  Icon,
  onClick,
  disabled,
}: {
  label: string;
  Icon: typeof SkipBack;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="btn-3d-dark flex h-11 items-center justify-center rounded-md text-white ring-1 ring-white/5 disabled:text-navy-400"
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
    </button>
  );
}
