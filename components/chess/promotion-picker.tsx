"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PromotionPiece } from "@/lib/chess/promotion";

const PIECES: Array<{ id: PromotionPiece; label: string; whiteGlyph: string; blackGlyph: string }> = [
  { id: "q", label: "Queen", whiteGlyph: "♕", blackGlyph: "♛" },
  { id: "r", label: "Rook", whiteGlyph: "♖", blackGlyph: "♜" },
  { id: "b", label: "Bishop", whiteGlyph: "♗", blackGlyph: "♝" },
  { id: "n", label: "Knight", whiteGlyph: "♘", blackGlyph: "♞" },
];

type Props = {
  open: boolean;
  /** Color of the promoting pawn — used to pick black/white glyphs. */
  color: "w" | "b";
  onPick: (piece: PromotionPiece) => void;
  /** Called when the user dismisses without picking — caller should
   *  cancel the pending move. */
  onCancel: () => void;
};

/**
 * Modal picker for pawn promotion. Caller defers `chess.move()` until the
 * user selects a piece, so under-promotions to N/B/R are possible.
 */
export function PromotionPicker({ open, color, onPick, onCancel }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
    >
      <DialogContent className="max-w-[360px] border-white/10 bg-navy-900 p-0">
        <DialogHeader className="border-b border-white/5 px-5 py-4">
          <DialogTitle className="text-[14px] font-bold text-white">
            Promote pawn to
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2 p-4">
          {PIECES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p.id)}
              className="card-3d flex flex-col items-center gap-1 rounded-md p-3 text-white"
            >
              <span className="text-[44px] leading-none">
                {color === "w" ? p.whiteGlyph : p.blackGlyph}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-navy-300">
                {p.label}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
