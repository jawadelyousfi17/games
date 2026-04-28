import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth-provider";
import { getChessGame } from "@/actions/games/chess/get-game";
import { GameReviewClient } from "@/components/chess/game-review-page";
import { Shell } from "@/components/shell/shell";
import { Button } from "@/components/ui/button";

type ReviewPageProps = {
  params: Promise<{ id: string }>;
};

/** /games/chess/review/[id] — full engine-driven review for a finished game. */
export default async function ChessReviewPage({ params }: ReviewPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    const { id } = await params;
    redirect(`/login?callbackUrl=/games/chess/review/${id}`);
  }

  const { id } = await params;
  const snapshot = await getChessGame(id);

  if (!snapshot.finished) {
    return (
      <Shell>
        <div className="mx-auto flex max-w-[640px] flex-col items-start gap-4 px-6 py-16 text-navy-50">
          <h1 className="text-[24px] font-extrabold">
            Review unavailable
          </h1>
          <p className="text-[14px] text-navy-200">
            This game is still in progress. Finish it to unlock the review.
          </p>
          <Button asChild>
            <Link href={`/games/chess/play/${id}`}>Open game</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <GameReviewClient snapshot={snapshot} />
    </Shell>
  );
}
