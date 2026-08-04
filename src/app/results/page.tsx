import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CompanyResultsTables } from "@/components/CompanyResultsTables";
import { SignOutButton } from "@/components/SignOutButton";
import { getResults } from "@/lib/results-client";

export default async function ResultsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const data = await getResults();
  const isAdmin = session.user.role === "ADMIN";

  return (
    <main className="p-6 space-y-4">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="text-left space-y-1">
          <h1 className="text-2xl font-semibold">{data.competition.name} Results</h1>
          <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/" className="underline">
                Back to Home
              </Link>
            {isAdmin ? (
              <Link href="/admin" className="underline">
                Admin Dashboard
              </Link>
            ) : null}
            <SignOutButton />
          </div>
        </div>
        <img
          src="/images/5acrossbanner.png"
          alt="5 Across Banner"
          className="fiveacross-banner justify-self-center"
        />
        <div className="w-48 justify-self-end" aria-hidden="true" />
      </header>

      <table className="min-w-full border-collapse border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Rank</th>
            <th className="border p-2 text-left">Company</th>
            <th className="border p-2 text-left">Final Score</th>
            <th className="border p-2 text-left">Judges Included</th>
          </tr>
        </thead>
        <tbody>
          {data.rankings.map((row) => (
            <tr key={row.companyId}>
              <td className="border p-2">{row.rank}</td>
              <td className="border p-2">
                <div className="flex items-center gap-2">
                  <span>{row.companyName}</span>
                  {row.rank === 1 && (
                    <img src="/images/goldmedal.png" alt="First Place Medal" className="goldmedal" />
                  )}
                </div>
              </td>
              <td className="border p-2">{row.finalScore.toFixed(1)}</td>
              <td className="border p-2">{row.judgeCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <CompanyResultsTables rankings={data.rankings} categories={data.categories} />
    </main>
  );
}
