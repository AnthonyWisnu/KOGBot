-- CreateTable
CREATE TABLE "UserStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userJid" TEXT NOT NULL,
    "groupJid" TEXT NOT NULL,
    "gamesWon" INTEGER NOT NULL DEFAULT 0,
    "lastDailyClaim" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_userJid_groupJid_key" ON "UserStats"("userJid", "groupJid");

-- CreateIndex
CREATE INDEX "UserStats_groupJid_idx" ON "UserStats"("groupJid");
