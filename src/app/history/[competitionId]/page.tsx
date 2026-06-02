type CompetitionResultPayload = {
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
    details: Array<{
      judgeName: string;
      categoryName: string;
      score: number;
    }>;
  }>;
};

async function getCompetitionResults(competitionId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/competitions/${competitionId}/results`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch competition results");
  }
  return (await response.json()) as CompetitionResultPayload;
}

type RouteParams = { params: Promise<{ competitionId: string }> };

export default async function CompetitionHistoryPage({ params }: RouteParams) {
  const { competitionId } = await params;
  const data = await getCompetitionResults(competitionId);

  return (
    <main className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">{data.competition.name}</h1>
        <p>Winner: {data.competition.winner ?? "TBD"}</p>
      </header>

      <table className="min-w-full border-collapse border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Rank</th>
            <th className="border p-2 text-left">Company</th>
            <th className="border p-2 text-left">Final Score</th>
            <th className="border p-2 text-left">Judge Count</th>
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
        <h2 className="text-xl font-semibold">Underlying Scores</h2>
        {data.rankings.map((row) => (
          <div key={row.companyId} className="border rounded p-3">
            <p className="font-semibold">{row.companyName}</p>
            <ul className="list-disc pl-5 text-sm">
              {row.details.map((detail, index) => (
                <li key={`${row.companyId}:${index}`}>
                  {detail.judgeName} - {detail.categoryName}: {detail.score.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
