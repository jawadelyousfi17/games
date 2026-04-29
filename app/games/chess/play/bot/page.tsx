import { ChessGameBot } from "@/components/chess/chess-game-bot";
import { Shell } from "@/components/shell/shell";
import { resolveBotLevel, type BotLevelId } from "@/lib/chess/bot-levels";

type SearchParams = Promise<{ level?: string; side?: string }>;

/**
 * /games/chess/play/bot — single-player chess against Stockfish. Level and
 * side seed from query params (`?level=3&side=black`) so lobby links can
 * jump straight in. The component itself owns the live picker UI.
 */
export default async function BotChessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const parsed = Number.parseInt(sp.level ?? "", 10);
  const initialLevel = (resolveBotLevel(parsed as BotLevelId).id) as BotLevelId;
  const initialSide: "white" | "black" =
    sp.side === "black" ? "black" : "white";

  return (
    <Shell>
      <ChessGameBot initialLevel={initialLevel} initialSide={initialSide} />
    </Shell>
  );
}
