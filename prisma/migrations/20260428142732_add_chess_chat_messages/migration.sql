-- CreateTable
CREATE TABLE "ChessChatMessage" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChessChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChessChatMessage_gameId_createdAt_idx" ON "ChessChatMessage"("gameId", "createdAt");

-- AddForeignKey
ALTER TABLE "ChessChatMessage" ADD CONSTRAINT "ChessChatMessage_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "ChessGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChessChatMessage" ADD CONSTRAINT "ChessChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
