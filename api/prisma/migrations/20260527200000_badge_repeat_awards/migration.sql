-- Drop single-award constraint; allow multiple awards per badge type
DROP INDEX IF EXISTS "BadgeAward_userId_badgeType_key";

ALTER TABLE "BadgeAward" ADD COLUMN IF NOT EXISTS "weekKey" TEXT;

CREATE INDEX IF NOT EXISTS "BadgeAward_userId_badgeType_idx" ON "BadgeAward"("userId", "badgeType");
CREATE INDEX IF NOT EXISTS "BadgeAward_userId_badgeType_weekKey_idx" ON "BadgeAward"("userId", "badgeType", "weekKey");
