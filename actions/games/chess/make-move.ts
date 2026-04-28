"use server";

import { Chess } from "chess.js";
import type { ChessResult, ChessEndReason } from "@/lib/generated/prisma";
import { auth } from "@/lib/auth/auth-provider";
import { prisma } from "@/lib/prisma/prisma";
import { emitGameState } from "@/lib/chess/socket-bus";
import { toGameStatePayload } from "@/lib/chess/game-state";
import { finalizeChessGame } from "./finalize";

type MakeMoveInput = {
  gameId: string;
  from: string;
  to: string;
  /** "q" | "r" | "b" | "n"; defaults to queen on auto-promotion. */
  promotion?: string;
};

/**
 * Server-authoritative move handler. Validates against chess.js using the
 * stored FEN, persists the move, deducts elapsed clock time from the moving
 * color, finalizes if the move ended the game, then broadcasts the resulting
 * state for any subscribed clients.
 */
export async function makeChessMove(
  input: MakeMoveInput,
): Promise<{ ok: boolean; reason?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, reason: "unauthenticated" };
  const userId = session.user.id;

  let didFinalize = false;

  try {
    await prisma.$transaction(async (tx) => {
      const game = await tx.chessGame.findUnique({
        where: { id: input.gameId },
        include: { moves: { select: { san: true, ply: true } } },
      });
      if (!game) throw new Error("not_found");
      if (game.status !== "IN_PROGRESS") throw new Error("game_over");

      const myColor =
        game.whiteId === userId ? "w" : game.blackId === userId ? "b" : null;
      if (!myColor) throw new Error("not_a_player");

      const chess = new Chess(game.fen);
      if (chess.turn() !== myColor) throw new Error("not_your_turn");

      const move = chess.move({
        from: input.from,
        to: input.to,
        promotion: input.promotion ?? "q",
      });
      if (!move) throw new Error("illegal_move");

      const now = new Date();
      const elapsed = Math.max(
        0,
        now.getTime() - game.lastMoveAt.getTime(),
      );
      const moverMs = myColor === "w" ? game.whiteMs : game.blackMs;
      const remaining = Math.max(0, moverMs - elapsed) + game.incrementMs;

      const ply = game.moves.length + 1;

      await tx.chessMove.create({
        data: {
          gameId: game.id,
          ply,
          san: move.san,
          uci: `${move.from}${move.to}${move.promotion ?? ""}`,
          fenAfter: chess.fen(),
          msSpent: elapsed,
        },
      });

      const updateData: Parameters<typeof tx.chessGame.update>[0]["data"] = {
        fen: chess.fen(),
        pgn: chess.pgn(),
        lastMoveAt: now,
        // Any move implicitly declines a pending draw offer.
        drawOfferedBy: null,
        ...(myColor === "w"
          ? { whiteMs: remaining }
          : { blackMs: remaining }),
      };

      await tx.chessGame.update({
        where: { id: game.id },
        data: updateData,
      });

      let terminal: ChessResult | null = null;
      let reason: ChessEndReason | null = null;
      if (chess.isCheckmate()) {
        terminal = myColor === "w" ? "WHITE_WIN" : "BLACK_WIN";
        reason = "CHECKMATE";
      } else if (chess.isStalemate()) {
        terminal = "DRAW";
        reason = "STALEMATE";
      } else if (chess.isInsufficientMaterial()) {
        terminal = "DRAW";
        reason = "DRAW_INSUFFICIENT";
      } else if (chess.isThreefoldRepetition()) {
        terminal = "DRAW";
        reason = "DRAW_THREEFOLD";
      } else if (chess.isDraw()) {
        terminal = "DRAW";
        reason = "DRAW_FIFTY_MOVE";
      }

      if (terminal && reason) {
        await finalizeChessGame(tx, game.id, terminal, reason);
        didFinalize = true;
      }
    });
  } catch (e) {
    const reason = e instanceof Error ? e.message : "error";
    return { ok: false, reason };
  }

  // Fan out the post-commit state to subscribers. Done outside the
  // transaction so the emit doesn't block the move ack. In-process emit
  // via Socket.IO — no network round-trip to a broker.
  await broadcastFreshState(input.gameId);
  return { ok: true, reason: didFinalize ? "finalized" : undefined };
}

async function broadcastFreshState(gameId: string): Promise<void> {
  const fresh = await prisma.chessGame.findUnique({
    where: { id: gameId },
    include: { moves: { select: { san: true, ply: true, uci: true } } },
  });
  if (!fresh) return;
  emitGameState(gameId, toGameStatePayload(fresh));
}
