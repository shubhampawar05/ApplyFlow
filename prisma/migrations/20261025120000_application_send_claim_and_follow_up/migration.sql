-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'SENDING';

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "followUpAt" TIMESTAMP(3),
ADD COLUMN     "followUpCompletedAt" TIMESTAMP(3),
ADD COLUMN     "sendOutcomeUnknown" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sendStartedAt" TIMESTAMP(3);

-- Backfill: existing sent applications start reminding 7 days after their latest delivery.
UPDATE "Application" AS a
SET "followUpAt" = d."lastSentAt" + INTERVAL '7 days'
FROM (
  SELECT "applicationId", MAX("sentAt") AS "lastSentAt"
  FROM "EmailDelivery"
  WHERE "sentAt" IS NOT NULL
  GROUP BY "applicationId"
) AS d
WHERE a."id" = d."applicationId"
  AND a."status" IN ('SENT', 'FOLLOW_UP')
  AND a."followUpAt" IS NULL;
