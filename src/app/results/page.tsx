type ResultPayload = {
  competition: {
    id: string;
    name: string;
    eventDate: string;
    winner: string | null;
  };
  rankings: Array<{
    companyId: string;
    companyName: string;
    finalScore: number;
    judgeCount: number;
    rank: number;
    byJudge: Array<{
      judgeId: string;
      judgeName: string;
      categories: Record<string, number>;
    }>;
  }>;
};

async function getResults() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/results`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch results");
  }
  return (await response.json()) as ResultPayload;
}

export default async function ResultsPage() {
  const data = await getResults();
  return (
    <main className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Current Competition Results</h1>
        <p>{data.competition.name}</p>
        <p className="text-sm">Winner: {data.competition.winner ?? "TBD"}</p>
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
              <td className="border p-2">{row.companyName}</td>
              <td className="border p-2">{row.finalScore.toFixed(2)}</td>
              <td className="border p-2">{row.judgeCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Judge / Category Drill-down</h2>
        {data.rankings.map((row) => (
          <div key={row.companyId} className="border rounded p-3">
            <p className="font-semibold">{row.companyName}</p>
            {row.byJudge.map((judge) => (
              <div key={judge.judgeId} className="mt-2">
                <p className="text-sm font-medium">{judge.judgeName}</p>
                <ul className="list-disc pl-5 text-sm">
                  {Object.entries(judge.categories).map(([category, score]) => (
                    <li key={`${judge.judgeId}:${category}`}>
                      {category}: {typeof score === "number" ? score.toFixed(2) : score}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </section>
    </main>
  );
}
