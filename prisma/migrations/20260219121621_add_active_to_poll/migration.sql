/*
  Warnings:

  - You are about to drop the `IntraUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Preferences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Update` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Preferences" DROP CONSTRAINT "Preferences_intraUserId_fkey";

-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "IntraUser";

-- DropTable
DROP TABLE "Preferences";

-- DropTable
DROP TABLE "Task";

-- DropTable
DROP TABLE "Update";
