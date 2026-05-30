-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jid" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jid" TEXT NOT NULL,
    "name" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "welcomeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "welcomeMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WeeklyScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userJid" TEXT NOT NULL,
    "groupJid" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "weekStart" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ActiveGame" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupJid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "startedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL DEFAULT 'MTK',
    "level" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctOption" TEXT NOT NULL,
    "explanation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Family100Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Family100Answer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "normalizedAnswer" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Family100Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Family100Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_jid_key" ON "User"("jid");

-- CreateIndex
CREATE UNIQUE INDEX "Group_jid_key" ON "Group"("jid");

-- CreateIndex
CREATE INDEX "WeeklyScore_groupJid_weekStart_idx" ON "WeeklyScore"("groupJid", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyScore_userJid_groupJid_weekStart_key" ON "WeeklyScore"("userJid", "groupJid", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveGame_groupJid_type_key" ON "ActiveGame"("groupJid", "type");

-- CreateIndex
CREATE INDEX "Family100Answer_questionId_idx" ON "Family100Answer"("questionId");

-- CreateIndex
CREATE INDEX "Family100Answer_normalizedAnswer_idx" ON "Family100Answer"("normalizedAnswer");
