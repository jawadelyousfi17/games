import { GamePoster } from "./game-poster";
import { ChessPoster } from "./posters/chess";
import { UnoPoster } from "./posters/uno";
import { PokerPoster } from "./posters/poker";
import { t } from "@/lib/i18n";

const GAMES = [
  {
    key: "chess",
    nameKey: "games.items.chess.name",
    subKey: "games.items.chess.sub",
    playersKey: "games.items.chess.players",
    bg: "linear-gradient(160deg, #1d2a5e 0%, #0a0d20 100%)",
    art: <ChessPoster />,
    href: "/games/chess",
  },
  {
    key: "uno",
    nameKey: "games.items.uno.name",
    subKey: "games.items.uno.sub",
    playersKey: "games.items.uno.players",
    bg: "linear-gradient(160deg, #4a1530 0%, #2a0e22 100%)",
    art: <UnoPoster />,
  },
  {
    key: "poker",
    nameKey: "games.items.poker.name",
    subKey: "games.items.poker.sub",
    playersKey: "games.items.poker.players",
    bg: "linear-gradient(160deg, #2a1a4d 0%, #150c2a 100%)",
    art: <PokerPoster />,
  },
];

/** Games grid: three cards, no extra chrome. */
export function Games() {
  return (
    <section id="games" className="relative">
      <div className="mx-auto max-w-[1100px] px-6 pb-20">
        <h2 className="mb-8 text-[32px] font-extrabold tracking-tight text-white">
          {t("games.title")}
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {GAMES.map((g) => (
            <GamePoster
              key={g.key}
              name={t(g.nameKey)}
              sub={t(g.subKey)}
              players={t(g.playersKey)}
              bg={g.bg}
              art={g.art}
              href={g.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
