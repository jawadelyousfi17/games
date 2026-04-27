/*
  Warnings:

  - Added the required column `name` to the `IntraUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "IntraUser" ADD COLUMN     "name" TEXT NOT NULL;
