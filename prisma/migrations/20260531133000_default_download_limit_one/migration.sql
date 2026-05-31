PRAGMA foreign_keys=OFF;

CREATE TABLE "new_UserDownloadLimit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userJid" TEXT NOT NULL,
    "groupJid" TEXT NOT NULL,
    "limit" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_UserDownloadLimit" ("id", "userJid", "groupJid", "limit", "createdAt", "updatedAt")
SELECT "id", "userJid", "groupJid", "limit", "createdAt", "updatedAt"
FROM "UserDownloadLimit";

DROP TABLE "UserDownloadLimit";

ALTER TABLE "new_UserDownloadLimit" RENAME TO "UserDownloadLimit";

CREATE UNIQUE INDEX "UserDownloadLimit_userJid_groupJid_key" ON "UserDownloadLimit"("userJid", "groupJid");
CREATE INDEX "UserDownloadLimit_groupJid_idx" ON "UserDownloadLimit"("groupJid");

PRAGMA foreign_keys=ON;
