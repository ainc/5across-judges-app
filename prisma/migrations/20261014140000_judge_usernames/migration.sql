-- Judge logins are the username on the judge row. Scores stay on the judge id.
ALTER TABLE "Judge" ADD COLUMN "username" TEXT;

-- Existing logins were linked by judge code (JA/JB/JC → judge1/judge2/judge3).
UPDATE "Judge" AS j
SET "username" = u.username
FROM "User" AS u
WHERE u.role = 'JUDGE'
  AND j.code IS NOT NULL
  AND u."judgeCode" = j.code
  AND j."username" IS NULL;

-- Judges with no matching login take the first free judge1/judge2/judge3 slot in creation order.
WITH ordered AS (
  SELECT
    id,
    "competitionId",
    ROW_NUMBER() OVER (PARTITION BY "competitionId" ORDER BY "createdAt" ASC, id ASC) AS slot
  FROM "Judge"
  WHERE "username" IS NULL
)
UPDATE "Judge" AS j
SET "username" = 'judge' || ordered.slot::text
FROM ordered
WHERE j.id = ordered.id
  AND ordered.slot <= 3
  AND NOT EXISTS (
    SELECT 1
    FROM "Judge" AS other
    WHERE other."competitionId" = j."competitionId"
      AND other."username" = 'judge' || ordered.slot::text
  );

UPDATE "Judge"
SET "username" = 'judge-' || id
WHERE "username" IS NULL;

-- Two judges in one competition can match the same login. Keep the earliest and give the rest a distinct username.
WITH duplicated AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY "competitionId", "username" ORDER BY "createdAt" ASC, id ASC) AS n
  FROM "Judge"
)
UPDATE "Judge" AS j
SET "username" = j."username" || '-' || duplicated.n::text
FROM duplicated
WHERE j.id = duplicated.id
  AND duplicated.n > 1;

ALTER TABLE "Judge" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "Judge_competitionId_username_key" ON "Judge"("competitionId", "username");

DROP INDEX "User_judgeCode_key";

ALTER TABLE "User" DROP COLUMN "judgeCode";

ALTER TABLE "Judge" DROP COLUMN "code";
