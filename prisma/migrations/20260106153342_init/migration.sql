-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('vocab', 'quote', 'phrase', 'thought_wrapper', 'prompt', 'reflection', 'template', 'unknown');

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "docName" TEXT,
    "chunkClean" TEXT NOT NULL,
    "chunkRaw" TEXT NOT NULL,
    "type" "EntryType" NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "tags" TEXT[],
    "vocabData" JSONB,
    "quoteData" JSONB,
    "phraseData" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "parseError" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Entry_userId_idx" ON "Entry"("userId");

-- CreateIndex
CREATE INDEX "Entry_userId_type_idx" ON "Entry"("userId", "type");
