-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastCheckDate" TEXT,
ADD COLUMN     "previousStreak" INTEGER NOT NULL DEFAULT 0;
