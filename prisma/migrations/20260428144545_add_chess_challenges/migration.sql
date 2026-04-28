-- CreateEnum
CREATE TYPE "ChessChallengeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ChessChallenge" (
    "id" TEXT NOT NULL,
    "challengerId" TEXT NOT NULL,
    "challengedId" TEXT NOT NULL,
    "initialMs" INTEGER NOT NULL DEFAULT 300000,
    "incrementMs" INTEGER NOT NULL DEFAULT 0,
    "status" "ChessChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "gameId" TEXT,

    CONSTRAINT "ChessChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChessChallenge_challengedId_status_idx" ON "ChessChallenge"("challengedId", "status");

-- CreateIndex
CREATE INDEX "ChessChallenge_challengerId_status_idx" ON "ChessChallenge"("challengerId", "status");

-- AddForeignKey
ALTER TABLE "ChessChallenge" ADD CONSTRAINT "ChessChallenge_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChessChallenge" ADD CONSTRAINT "ChessChallenge_challengedId_fkey" FOREIGN KEY ("challengedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
