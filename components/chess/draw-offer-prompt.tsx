"use client";

import { Handshake } from "lucide-react";

type DrawOfferPromptProps = {
  /** Login of the player who offered the draw. */
  fromLogin: string;
  onAccept: () => void;
  onDecline: () => void;
};

/**
 * Inline card that appears between the board and the action bar when the
 * opponent offers a draw. Two clear actions, no modal — keeps the player
 * focused on the board.
 */
export function DrawOfferPrompt({
  fromLogin,
  onAccept,
  onDecline,
}: DrawOfferPromptProps) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-navy-900 px-4 py-3 ring-1 ring-brand-amber/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_8px_rgba(0,0,0,0.3)]">
      <Handshake
        className="h-5 w-5 shrink-0 text-brand-amber"
        strokeWidth={2}
      />
      <div className="min-w-0 flex-1 text-[13px] text-white">
        <span className="font-semibold">{fromLogin}</span>{" "}
        <span className="text-navy-200">offers a draw.</span>
      </div>
      <button
        type="button"
        onClick={onDecline}
        className="btn-3d-dark flex h-9 items-center justify-center rounded-md px-3 text-[13px] font-semibold text-white ring-1 ring-white/10"
      >
        Decline
      </button>
      <button
        type="button"
        onClick={onAccept}
        className="btn-3d-lime flex h-9 items-center justify-center rounded-md px-4 text-[13px] font-bold text-navy-950"
      >
        Accept
      </button>
    </div>
  );
}
