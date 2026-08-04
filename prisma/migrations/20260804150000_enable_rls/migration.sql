-- Lock Supabase Data API (PostgREST / anon + authenticated keys).
-- This app uses NextAuth + server-side Prisma with DATABASE_URL (privileged role),
-- so auth.uid() policies are not used. With RLS enabled and no policies,
-- anon/authenticated cannot read or write these tables via the REST API.
-- Prisma continues to work because the DB connection role bypasses RLS.

ALTER TABLE "Competition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Judge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubmissionSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Score" ENABLE ROW LEVEL SECURITY;

-- Explicit deny for API roles (belt-and-suspenders; RLS with zero policies already denies).
REVOKE ALL ON TABLE "Competition" FROM anon, authenticated;
REVOKE ALL ON TABLE "Judge" FROM anon, authenticated;
REVOKE ALL ON TABLE "Company" FROM anon, authenticated;
REVOKE ALL ON TABLE "Category" FROM anon, authenticated;
REVOKE ALL ON TABLE "SubmissionSession" FROM anon, authenticated;
REVOKE ALL ON TABLE "User" FROM anon, authenticated;
REVOKE ALL ON TABLE "Score" FROM anon, authenticated;
