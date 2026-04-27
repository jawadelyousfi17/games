-- CreateEnum
CREATE TYPE "ChessGameStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ChessResult" AS ENUM ('WHITE_WIN', 'BLACK_WIN', 'DRAW');

-- CreateTable
CREATE TABLE "ChessGame" (
    "id" TEXT NOT NULL,
    "whiteId" TEXT NOT NULL,
    "blackId" TEXT NOT NULL,
    "fen" TEXT NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    "pgn" TEXT NOT NULL DEFAULT '',
    "status" "ChessGameStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "result" "ChessResult",
    "initialMs" INTEGER NOT NULL DEFAULT 300000,
    "incrementMs" INTEGER NOT NULL DEFAULT 0,
    "whiteMs" INTEGER NOT NULL DEFAULT 300000,
    "blackMs" INTEGER NOT NULL DEFAULT 300000,
    "lastMoveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "whiteRatingBefore" INTEGER NOT NULL DEFAULT 1200,
    "blackRatingBefore" INTEGER NOT NULL DEFAULT 1200,
    "whiteRatingAfter" INTEGER,
    "blackRatingAfter" INTEGER,

    CONSTRAINT "ChessGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChessMove" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "ply" INTEGER NOT NULL,
    "san" TEXT NOT NULL,
    "uci" TEXT NOT NULL,
    "fenAfter" TEXT NOT NULL,
    "msSpent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChessMove_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChessQueueTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "initialMs" INTEGER NOT NULL DEFAULT 300000,
    "incrementMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChessQueueTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChessRating" (
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 1200,
    "games" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChessRating_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "ChessGame_whiteId_idx" ON "ChessGame"("whiteId");

-- CreateIndex
CREATE INDEX "ChessGame_blackId_idx" ON "ChessGame"("blackId");

-- CreateIndex
CREATE INDEX "ChessGame_status_idx" ON "ChessGame"("status");

-- CreateIndex
CREATE INDEX "ChessMove_gameId_idx" ON "ChessMove"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "ChessMove_gameId_ply_key" ON "ChessMove"("gameId", "ply");

-- CreateIndex
CREATE UNIQUE INDEX "ChessQueueTicket_userId_key" ON "ChessQueueTicket"("userId");

-- CreateIndex
CREATE INDEX "ChessQueueTicket_createdAt_idx" ON "ChessQueueTicket"("createdAt");

-- AddForeignKey
ALTER TABLE "ChessGame" ADD CONSTRAINT "ChessGame_whiteId_fkey" FOREIGN KEY ("whiteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChessGame" ADD CONSTRAINT "ChessGame_blackId_fkey" FOREIGN KEY ("blackId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChessMove" ADD CONSTRAINT "ChessMove_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "ChessGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChessQueueTicket" ADD CONSTRAINT "ChessQueueTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChessRating" ADD CONSTRAINT "ChessRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
