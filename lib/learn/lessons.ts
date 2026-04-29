/**
 * Curated chess lessons. Each lesson is a sequence of board snapshots with
 * captions — like a short slideshow. Kept hand-authored for now (no CMS,
 * no fetch) so the experience works offline and adding content is just an
 * edit to this file.
 */

export type LessonCategory = "basics" | "tactics" | "endgames" | "openings";

export type LessonStep = {
  /** Position to display on the board. */
  fen: string;
  /** Short paragraph shown beside or under the board. */
  caption: string;
  /** Optional list of squares to glow as the step's "focus". */
  highlight?: string[];
  /** Optional arrows drawn on the board (from → to). Used to suggest
   *  ideas or show piece movement. */
  arrows?: Array<{ from: string; to: string; color?: "lime" | "amber" | "coral" }>;
  /** Whose turn the explanation is from. Drives the orientation hint. */
  side?: "w" | "b";
};

export type Lesson = {
  slug: string;
  title: string;
  blurb: string;
  category: LessonCategory;
  /** Rough length in minutes — purely informational for the card. */
  durationMin: number;
  steps: LessonStep[];
};

const STARTING_POSITION =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const LESSONS: Lesson[] = [
  {
    slug: "how-pieces-move",
    title: "How the pieces move",
    blurb: "Each piece's movement at a glance — start here if you're new.",
    category: "basics",
    durationMin: 6,
    steps: [
      {
        fen: STARTING_POSITION,
        caption:
          "Chess starts with this position. White moves first. Each piece has its own way of moving — let's go through them one by one.",
      },
      {
        fen: "8/8/8/3P4/8/8/8/8 w - - 0 1",
        caption:
          "Pawns move one square forward, but on their first move they may go two squares. They capture diagonally one square.",
        highlight: ["d6", "d7"],
      },
      {
        fen: "8/8/8/3N4/8/8/8/8 w - - 0 1",
        caption:
          "Knights jump in an L-shape: two squares in one direction and one square perpendicular. They are the only piece that can leap over others.",
        highlight: ["b6", "c7", "e7", "f6", "f4", "e3", "c3", "b4"],
      },
      {
        fen: "8/8/8/3B4/8/8/8/8 w - - 0 1",
        caption:
          "Bishops slide diagonally any number of squares. Each bishop stays on one color forever.",
        highlight: ["a8", "b7", "c6", "e6", "f7", "g8", "e4", "f3", "g2", "h1", "c4", "b3", "a2"],
      },
      {
        fen: "8/8/8/3R4/8/8/8/8 w - - 0 1",
        caption:
          "Rooks slide horizontally and vertically any number of squares. They love open files and ranks.",
        highlight: ["d1", "d2", "d3", "d4", "d6", "d7", "d8", "a5", "b5", "c5", "e5", "f5", "g5", "h5"],
      },
      {
        fen: "8/8/8/3Q4/8/8/8/8 w - - 0 1",
        caption:
          "The queen combines rook and bishop — it slides in any direction, any distance. It's the strongest piece on the board.",
      },
      {
        fen: "8/8/8/3K4/8/8/8/8 w - - 0 1",
        caption:
          "The king moves one square in any direction. It's never captured — instead, the game ends in checkmate when it can't escape attack.",
        highlight: ["c4", "d4", "e4", "c5", "e5", "c6", "d6", "e6"],
      },
    ],
  },
  {
    slug: "castling",
    title: "Castling",
    blurb: "Tuck your king to safety and bring a rook into play.",
    category: "basics",
    durationMin: 3,
    steps: [
      {
        fen: "rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R w KQkq - 1 2",
        caption:
          "Castling is a special king + rook move. You need a clear path between them, neither piece can have moved yet, and the king can't pass through check.",
      },
      {
        fen: "rnbqkbnr/pppppppp/8/8/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 1 4",
        caption:
          "Once the squares between the king and rook are empty, you can castle. Kingside: king goes to g1, rook to f1.",
        arrows: [
          { from: "e1", to: "g1", color: "lime" },
          { from: "h1", to: "f1", color: "amber" },
        ],
      },
      {
        fen: "rnbqkbnr/pppppppp/8/8/2B1P3/2N2N2/PPPPQPPP/R1B1K2R w KQkq - 1 6",
        caption:
          "Queenside castling moves the king two squares left to c1 and the rook to d1. You need three squares clear instead of two.",
        arrows: [{ from: "e1", to: "c1", color: "lime" }],
      },
      {
        fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 b kq - 5 5",
        caption:
          "After castling, your king is tucked behind a wall of pawns and your rook is centralized. Almost every opening goal includes castling within the first 10 moves.",
      },
    ],
  },
  {
    slug: "opening-principles",
    title: "Opening principles",
    blurb: "Control the center, develop pieces, castle early.",
    category: "openings",
    durationMin: 5,
    steps: [
      {
        fen: STARTING_POSITION,
        caption:
          "Three rules for the opening: 1) Fight for the central squares (e4, d4, e5, d5). 2) Develop knights and bishops quickly. 3) Get your king safe by castling.",
      },
      {
        fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2",
        caption:
          "1.e4 e5 — both sides occupy the center. Pawns control the squares diagonally in front of them.",
        highlight: ["e4", "e5"],
      },
      {
        fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
        caption:
          "2.Nf3 develops a piece, attacks black's e5 pawn, and prepares to castle. Knights before bishops is a good rule of thumb.",
        arrows: [{ from: "g1", to: "f3", color: "lime" }],
      },
      {
        fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
        caption:
          "Black mirrors with 2…Nc6, defending e5 and developing. Both sides keep building.",
      },
      {
        fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 6 5",
        caption:
          "After a few normal moves both sides have pieces out and are ready to castle. Compare this to a position where one side delayed development — safety + activity wins.",
      },
    ],
  },
  {
    slug: "back-rank-mate",
    title: "Back-rank mate",
    blurb: "The classic king-trapped-on-the-eighth-rank pattern.",
    category: "tactics",
    durationMin: 4,
    steps: [
      {
        fen: "6k1/5ppp/8/8/8/8/8/4R3 w - - 0 1",
        caption:
          "The black king is stuck on the back rank by its own pawns. With a rook on the open file, white can deliver mate in one.",
        arrows: [{ from: "e1", to: "e8", color: "lime" }],
      },
      {
        fen: "4R1k1/5ppp/8/8/8/8/8/8 b - - 1 1",
        caption:
          "Re8# — checkmate. The king has no escape: f7/g7/h7 are blocked by the pawns and the rook covers the entire 8th rank.",
        highlight: ["g8"],
      },
      {
        fen: "6k1/5pp1/7p/8/8/8/8/4R3 w - - 0 1",
        caption:
          "If black makes a luft (a small escape square for the king like …h6), the back-rank mate threat goes away. Always create one in the middlegame.",
        highlight: ["h7", "h6"],
      },
    ],
  },
  {
    slug: "fork-pin-skewer",
    title: "Fork, pin, skewer",
    blurb: "Three of the most common ways to win material.",
    category: "tactics",
    durationMin: 5,
    steps: [
      {
        fen: "4k3/8/3r4/8/4N3/8/8/4K3 w - - 0 1",
        caption:
          "Fork: one piece attacks two enemy pieces at once. Knights are kings of the fork because they jump over defenders.",
        arrows: [
          { from: "e4", to: "d6", color: "lime" },
        ],
      },
      {
        fen: "4k3/8/8/8/3N4/8/8/4K3 b - - 0 2",
        caption:
          "After Nxd6+ the knight forks the king and rook. Black must move the king and white wins the rook next move.",
      },
      {
        fen: "4k3/4q3/8/8/8/8/4R3/4K3 w - - 0 1",
        caption:
          "Pin: a piece can't move because doing so would expose a more valuable piece behind it. Here the queen is pinned to the king.",
        highlight: ["e7", "e8"],
      },
      {
        fen: "4k3/8/8/8/8/4q3/4R3/4K3 w - - 0 1",
        caption:
          "Skewer: like a pin, but the more valuable piece is in front. The attacker forces it to move, then captures the piece behind.",
        arrows: [{ from: "e2", to: "e3", color: "amber" }],
      },
    ],
  },
  {
    slug: "kq-vs-k",
    title: "Mate with king + queen",
    blurb: "The fundamental endgame every player must know.",
    category: "endgames",
    durationMin: 4,
    steps: [
      {
        fen: "8/8/8/4k3/8/8/8/3QK3 w - - 0 1",
        caption:
          "King + queen vs lone king is always winning. The plan: push the enemy king to the edge with the queen, then bring your king up to deliver mate.",
      },
      {
        fen: "8/8/8/8/3k4/8/3Q4/4K3 w - - 0 1",
        caption:
          "Keep the queen a knight's move away from the enemy king. This blocks escape squares without allowing stalemate.",
        highlight: ["d4", "d2"],
      },
      {
        fen: "3k4/8/3K4/3Q4/8/8/8/8 b - - 0 1",
        caption:
          "Once the king is on the edge, your own king moves up to support the mate. The queen delivers the final blow next.",
      },
      {
        fen: "3kQ3/8/3K4/8/8/8/8/8 b - - 0 1",
        caption:
          "Qe8# — the king is trapped against the edge with no escape. Always check for stalemate before delivering: don't take every flight square unless your queen is defended.",
      },
    ],
  },
];

export function getLesson(slug: string): Lesson | null {
  return LESSONS.find((l) => l.slug === slug) ?? null;
}

export const CATEGORY_LABEL: Record<LessonCategory, string> = {
  basics: "Basics",
  tactics: "Tactics",
  endgames: "Endgames",
  openings: "Openings",
};
