-- CreateTable
CREATE TABLE "IntraUser" (
    "id" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "level" DOUBLE PRECISION NOT NULL,
    "promo" INTEGER NOT NULL,
    "campusId" INTEGER NOT NULL,

    CONSTRAINT "IntraUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntraUser_login_key" ON "IntraUser"("login");
