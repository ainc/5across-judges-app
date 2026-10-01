-- Draft scores stay in "score". Results read "publishedScore", set when a company is submitted.
ALTER TABLE "Score" ADD COLUMN "publishedScore" DOUBLE PRECISION;

UPDATE "Score" AS s
SET "publishedScore" = s.score
FROM "SubmissionSession" AS sess
WHERE s."sessionId" = sess.id
  AND sess.status = 'FINAL';
