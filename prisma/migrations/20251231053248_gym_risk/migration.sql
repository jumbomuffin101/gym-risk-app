/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `RiskEvent` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `SetEntry` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RiskEvent" DROP CONSTRAINT "RiskEvent_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "RiskEvent" DROP CONSTRAINT "RiskEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "SetEntry" DROP CONSTRAINT "SetEntry_exerciseId_fkey";

-- DropForeignKey
ALTER TABLE "SetEntry" DROP CONSTRAINT "SetEntry_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutSession" DROP CONSTRAINT "WorkoutSession_userId_fkey";

-- DropIndex
DROP INDEX "SetEntry_exerciseId_idx";

-- DropIndex
DROP INDEX "SetEntry_performedAt_idx";

-- AlterTable
ALTER TABLE "Exercise" ALTER COLUMN "category" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SetEntry" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password";

-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN     "endedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "RiskEvent";

-- CreateIndex
CREATE INDEX "SetEntry_exerciseId_performedAt_idx" ON "SetEntry"("exerciseId", "performedAt");

-- CreateIndex
CREATE INDEX "WorkoutSession_userId_startedAt_idx" ON "WorkoutSession"("userId", "startedAt");

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetEntry" ADD CONSTRAINT "SetEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetEntry" ADD CONSTRAINT "SetEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetEntry" ADD CONSTRAINT "SetEntry_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
