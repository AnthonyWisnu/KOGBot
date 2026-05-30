-- CreateTable
CREATE TABLE "UserDownloadLimit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userJid" TEXT NOT NULL,
    "groupJid" TEXT NOT NULL,
    "limit" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDownloadLimit_userJid_groupJid_key" ON "UserDownloadLimit"("userJid", "groupJid");

-- CreateIndex
CREATE INDEX "UserDownloadLimit_groupJid_idx" ON "UserDownloadLimit"("groupJid");
