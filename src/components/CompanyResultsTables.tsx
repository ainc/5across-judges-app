type CategoryRef = { name: string; weight: number };
type JudgeScore = {
  judgeId: string;
  judgeName: string;
  categories: Record<string, number>;
  judgeTotal: number | null;
};
type CompanyRanking = {
  companyId: string;
  companyName: string;
  byJudge: JudgeScore[];
};

export function CompanyResultsTables({
  rankings,
  categories,
}: {
  rankings: CompanyRanking[];
  categories: CategoryRef[];
}) {
  return (
    <section className="space-y-8">
      {rankings.map((row) => (
        <div key={row.companyId} className="overflow-auto">
          <table className="company-results-table w-full border-collapse border border-black text-sm">
            <thead>
              <tr>
                <th className="border border-black p-2 text-left font-semibold">{row.companyName}</th>
                {row.byJudge.map((judge) => (
                  <th key={judge.judgeId} className="border border-black p-2 text-center font-normal">
                    {judge.judgeName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.name}>
                  <td className="border border-black p-2 text-left">{category.name} <span className="text-xs text-gray-600">({category.weight}%)</span></td>
                  {row.byJudge.map((judge) => (
                    <td key={judge.judgeId} className="border border-black p-2 text-center">
                      {judge.categories[category.name] !== undefined
                        ? judge.categories[category.name].toFixed(1)
                        : ""}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="border border-black p-2 text-left font-semibold">Average Per Judge</td>
                {row.byJudge.map((judge) => (
                  <td key={judge.judgeId} className="border border-black p-2 text-center font-semibold">
                    {judge.judgeTotal !== null ? judge.judgeTotal.toFixed(1) : ""}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}
