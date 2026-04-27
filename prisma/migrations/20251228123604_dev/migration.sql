-- CreateTable
CREATE TABLE "Preferences" (
    "id" TEXT NOT NULL,
    "changeProfile" BOOLEAN NOT NULL DEFAULT true,
    "changeCover" BOOLEAN NOT NULL DEFAULT true,
    "showQuranInFullScreen" BOOLEAN NOT NULL DEFAULT false,
    "showQuranWidget" BOOLEAN NOT NULL DEFAULT true,
    "showRanking" BOOLEAN NOT NULL DEFAULT true,
    "showPomodor" BOOLEAN NOT NULL DEFAULT true,
    "showNotes" BOOLEAN NOT NULL DEFAULT true,
    "intraUserId" TEXT NOT NULL,

    CONSTRAINT "Preferences_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Preferences" ADD CONSTRAINT "Preferences_intraUserId_fkey" FOREIGN KEY ("intraUserId") REFERENCES "IntraUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
