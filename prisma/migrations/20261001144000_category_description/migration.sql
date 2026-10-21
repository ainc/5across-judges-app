ALTER TABLE "Category" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';

UPDATE "Category"
SET
  "description" = "name",
  "name" = CASE
    WHEN lower(btrim(split_part("name", '/', 1))) = 'quality of overall pitch' THEN
      btrim(regexp_replace("name", '^.*\/', ''))
    ELSE
      btrim(split_part("name", '/', 1))
  END;
