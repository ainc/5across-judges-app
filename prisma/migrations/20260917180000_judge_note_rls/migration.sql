ALTER TABLE "JudgeNote" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "JudgeNote" FROM anon, authenticated;

CREATE POLICY "Deny anon/authenticated access" ON "JudgeNote"
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);
