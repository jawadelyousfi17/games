import { ChessGame } from "@/components/chess/chess-game";
import { Shell } from "@/components/shell/shell";

/** /games/chess/play/local — pass-and-play chess board inside the shell. */
export default function LocalChessPage() {
  return (
    <Shell>
      <ChessGame />
    </Shell>
  );
}
