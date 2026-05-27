-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SALES_REP', 'MANAGER');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('LEAD_CONTACTED', 'MEETING_COMPLETED', 'STAGE_ADVANCED', 'DEAL_WON', 'DEAL_LOST');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('FIRST_WIN', 'CONSISTENT_CLOSER', 'PIPELINE_BUILDER', 'HOT_STREAK', 'TOP_OF_THE_WEEK', 'COMEBACK_KID');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('BADGE_EARNED', 'LEVEL_UP', 'STREAK_MILESTONE', 'WEEKLY_TOP_3', 'PERSONAL_BEST_WEEK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SALES_REP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmIntegration" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "webhookSecret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmUserMap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmUserMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "capReached" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "ScoringRule" (
    "id" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "points" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoringRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelConfig" (
    "level" INTEGER NOT NULL,
    "minXP" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LevelConfig_pkey" PRIMARY KEY ("level")
);

-- CreateTable
CREATE TABLE "DailyCapConfig" (
    "id" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "maxCount" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCapConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStats" (
    "userId" TEXT NOT NULL,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "WeeklyStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isoWeek" TEXT NOT NULL,
    "weekPoints" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "date" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyCap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeAward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeType" "BadgeType" NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BadgeAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeType" "BadgeType" NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "targetCount" INTEGER NOT NULL,
    "weekKey" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BadgeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AwardTimeline" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TimelineEventType" NOT NULL,
    "badgeType" "BadgeType",
    "eventId" TEXT,
    "pointsSnapshot" INTEGER NOT NULL,
    "xpSnapshot" INTEGER NOT NULL,
    "levelSnapshot" INTEGER NOT NULL,
    "weekKey" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AwardTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "CrmUserMap_provider_externalId_idx" ON "CrmUserMap"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmUserMap_provider_externalId_key" ON "CrmUserMap"("provider", "externalId");

-- CreateIndex
CREATE INDEX "Event_userId_eventType_timestamp_idx" ON "Event"("userId", "eventType", "timestamp");

-- CreateIndex
CREATE INDEX "Event_userId_timestamp_idx" ON "Event"("userId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ScoringRule_eventType_key" ON "ScoringRule"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCapConfig_eventType_key" ON "DailyCapConfig"("eventType");

-- CreateIndex
CREATE INDEX "WeeklyStat_isoWeek_weekPoints_idx" ON "WeeklyStat"("isoWeek", "weekPoints");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyStat_userId_isoWeek_key" ON "WeeklyStat"("userId", "isoWeek");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCap_userId_eventType_date_key" ON "DailyCap"("userId", "eventType", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeAward_userId_badgeType_key" ON "BadgeAward"("userId", "badgeType");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeProgress_userId_badgeType_weekKey_key" ON "BadgeProgress"("userId", "badgeType", "weekKey");

-- CreateIndex
CREATE INDEX "AwardTimeline_userId_createdAt_idx" ON "AwardTimeline"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_userId_type_sentAt_idx" ON "NotificationLog"("userId", "type", "sentAt");

-- AddForeignKey
ALTER TABLE "CrmUserMap" ADD CONSTRAINT "CrmUserMap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmUserMap" ADD CONSTRAINT "CrmUserMap_provider_fkey" FOREIGN KEY ("provider") REFERENCES "CrmIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyStat" ADD CONSTRAINT "WeeklyStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCap" ADD CONSTRAINT "DailyCap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeAward" ADD CONSTRAINT "BadgeAward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeProgress" ADD CONSTRAINT "BadgeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardTimeline" ADD CONSTRAINT "AwardTimeline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
