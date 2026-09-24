import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CompanyResultsTables } from "@/components/CompanyResultsTables";
import { ResultsPodiums } from "@/components/ResultsPodiums";
import { getResults } from "@/lib/results-client";
import { AppHeader } from "@/components/admin/AppHeader";

export default async function ResultsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const data = await getResults();
  const isAdmin = session.user.role === "ADMIN";

  return (
    <>
      <AppHeader showAdminLink={isAdmin} className="mb-8">
        <h1>Current Results</h1>
      </AppHeader>
      <main className="min-w-0 space-y-4 px-6 pb-6">

      <ResultsPodiums
        rankings={data.rankings.map((row) => ({
          companyId: row.companyId,
          companyName: row.companyName,
          finalScore: row.finalScore,
          rank: row.rank,
        }))}
      />

      <CompanyResultsTables rankings={data.rankings} categories={data.categories} />
      </main>
    </>
  );
}
