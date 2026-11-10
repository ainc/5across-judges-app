CREATE TABLE "PreviousJudge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "usernameKey" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreviousJudge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PreviousJudge_usernameKey_key" ON "PreviousJudge"("usernameKey");

ALTER TABLE "PreviousJudge" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "PreviousJudge" FROM anon, authenticated;

CREATE POLICY "Deny anon/authenticated access" ON "PreviousJudge"
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);
