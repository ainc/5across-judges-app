-- First time a company is submitted. Later resubmits keep this timestamp so the scoring page can list companies in submission order.
ALTER TABLE "Score" ADD COLUMN "publishedAt" TIMESTAMP(3);

UPDATE "Score"
SET "publishedAt" = "updatedAt"
WHERE "publishedScore" IS NOT NULL;
