import { Shell } from "@/components/shell/shell";
import { BotReviewClient } from "@/components/chess/bot-review-client";

/**
 * /games/chess/play/bot/review — replay + engine-graded walk-through of the
 * most recent bot game. Reads from sessionStorage on the client, so the
 * page itself stays a server component shell.
 */
export default function BotReviewPage() {
  return (
    <Shell>
      <BotReviewClient />
    </Shell>
  );
}
