-- Explicit deny policies for Supabase Data API roles.
-- Clears "RLS enabled but no policies" advisor INFO while keeping REST locked.
-- Prisma (privileged DATABASE_URL role) continues to bypass RLS.

CREATE POLICY "Deny anon/authenticated access" ON "Competition"
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny anon/authenticated access" ON "Judge"
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny anon/authenticated access" ON "Company"
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny anon/authenticated access" ON "Category"
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny anon/authenticated access" ON "SubmissionSession"
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny anon/authenticated access" ON "User"
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny anon/authenticated access" ON "Score"
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);
