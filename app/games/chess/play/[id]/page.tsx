import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth-provider";
import { getChessGame } from "@/actions/games/chess/get-game";
import { ChessGameOnline } from "@/components/chess/chess-game-online";
import { Shell } from "@/components/shell/shell";

type ChessGamePageProps = {
  params: Promise<{ id: string }>;
};

/** /games/chess/play/[id] — live multiplayer chess game inside the shell. */
export default async function ChessGamePage({ params }: ChessGamePageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    const { id } = await params;
    redirect(`/login?callbackUrl=/games/chess/play/${id}`);
  }

  const { id } = await params;
  const snapshot = await getChessGame(id);

  return (
    <Shell>
      <ChessGameOnline snapshot={snapshot} />
    </Shell>
  );
}
