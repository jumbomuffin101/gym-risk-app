-- CreateEnum
CREATE TYPE "ExerciseSource" AS ENUM ('external', 'custom');

-- AlterTable
ALTER TABLE "Exercise"
ADD COLUMN "source" "ExerciseSource" NOT NULL DEFAULT 'custom',
ADD COLUMN "externalId" TEXT,
ADD COLUMN "createdByUserId" TEXT,
ADD COLUMN "primaryMuscles" TEXT,
ADD COLUMN "equipment" TEXT,
ADD COLUMN "instructions" TEXT;

-- DropIndex
DROP INDEX IF EXISTS "Exercise_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_externalId_key" ON "Exercise"("externalId");
CREATE UNIQUE INDEX "Exercise_name_source_createdByUserId_key" ON "Exercise"("name", "source", "createdByUserId");
CREATE INDEX "Exercise_source_category_idx" ON "Exercise"("source", "category");
