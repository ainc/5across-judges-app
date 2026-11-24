import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CurrentResults } from "@/components/CurrentResults";
import { judgeDisplayName } from "@/lib/auth-users";
import { getResults } from "@/lib/results-client";
import { AppHeader } from "@/components/admin/AppHeader";

export default async function ResultsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const data = await getResults();
  const isAdmin = session.user.role === "ADMIN";
  const judgeName = isAdmin ? null : await judgeDisplayName(session.user.judgeId);

  return (
    <>
      <AppHeader showAdminLink={isAdmin} judgeName={judgeName ?? undefined} className="mb-12" />
      <main className="min-w-0 space-y-4 px-6 pb-6">
        {data ? (
          <CurrentResults
            rankings={data.rankings}
            categories={data.categories}
            judgeId={session.user.judgeId ?? null}
          />
        ) : (
          <p className="text-sm text-muted">No results yet.</p>
        )}
      </main>
    </>
  );
}
