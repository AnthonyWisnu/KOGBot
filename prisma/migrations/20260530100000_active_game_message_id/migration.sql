-- AlterTable
ALTER TABLE "ActiveGame" ADD COLUMN "messageId" TEXT;
ALTER TABLE "ActiveGame" ADD COLUMN "lastPromptMessageId" TEXT;

-- CreateIndex
CREATE INDEX "ActiveGame_groupJid_messageId_idx" ON "ActiveGame"("groupJid", "messageId");

-- CreateIndex
CREATE INDEX "ActiveGame_groupJid_lastPromptMessageId_idx" ON "ActiveGame"("groupJid", "lastPromptMessageId");
