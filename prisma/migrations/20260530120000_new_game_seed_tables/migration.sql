-- CreateTable
CREATE TABLE "WordScrambleQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "normalizedAnswer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmojiGuessQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emoji" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "normalizedAnswer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "WordScrambleQuestion_category_idx" ON "WordScrambleQuestion"("category");

-- CreateIndex
CREATE INDEX "WordScrambleQuestion_normalizedAnswer_idx" ON "WordScrambleQuestion"("normalizedAnswer");

-- CreateIndex
CREATE INDEX "EmojiGuessQuestion_normalizedAnswer_idx" ON "EmojiGuessQuestion"("normalizedAnswer");
