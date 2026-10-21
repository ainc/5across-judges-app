-- Notes are stored per company and scoring category.
ALTER TABLE "JudgeNote" ADD COLUMN "categoryId" TEXT;

UPDATE "JudgeNote" AS note
SET "categoryId" = (
  SELECT category.id
  FROM "Category" AS category
  WHERE category."competitionId" = note."competitionId"
  ORDER BY category."createdAt" ASC
  LIMIT 1
)
WHERE note."categoryId" IS NULL;

DELETE FROM "JudgeNote" WHERE "categoryId" IS NULL;

ALTER TABLE "JudgeNote" ALTER COLUMN "categoryId" SET NOT NULL;

ALTER TABLE "JudgeNote" ADD CONSTRAINT "JudgeNote_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX "JudgeNote_competitionId_judgeId_companyId_key";

CREATE UNIQUE INDEX "JudgeNote_competitionId_judgeId_companyId_categoryId_key"
  ON "JudgeNote"("competitionId", "judgeId", "companyId", "categoryId");
