import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CompanyResultsTables } from "@/components/CompanyResultsTables";
import { getResults } from "@/lib/results-client";
import { AppHeader } from "@/components/admin/AppHeader";
import { StyledTable, tdClass, thClass } from "@/components/StyledTable";

export default async function ResultsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const data = await getResults();
  const isAdmin = session.user.role === "ADMIN";

  return (
    <>
      <AppHeader showAdminLink={isAdmin}>
        <h1 className="text-2xl font-semibold">Current Results</h1>
      </AppHeader>
      <main className="space-y-4 px-6 pb-6">

      <StyledTable>
        <thead className="bg-gray-100">
          <tr>
            <th className={thClass}>Rank</th>
            <th className={thClass}>Company</th>
            <th className={thClass}>Final Score</th>
            <th className={thClass}>Judges Included</th>
          </tr>
        </thead>
        <tbody>
          {data.rankings.map((row) => (
            <tr key={row.companyId}>
              <td className={tdClass}>{row.rank}</td>
              <td className={tdClass}>
                <div className="flex items-center gap-2">
                  <span>{row.companyName}</span>
                  {row.rank === 1 && (
                    <img src="/images/goldmedal.png" alt="First Place Medal" className="goldmedal" />
                  )}
                </div>
              </td>
              <td className={tdClass}>{row.finalScore.toFixed(1)}</td>
              <td className={tdClass}>{row.judgeCount}</td>
            </tr>
          ))}
        </tbody>
      </StyledTable>

      <CompanyResultsTables rankings={data.rankings} categories={data.categories} />
      </main>
    </>
  );
}
