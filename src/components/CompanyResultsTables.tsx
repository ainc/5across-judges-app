"use client";

import { useState } from "react";
import { StyledTable, tdClass, thClass } from "@/components/StyledTable";

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
  const [selectedCompanyId, setSelectedCompanyId] = useState(rankings[0]?.companyId ?? "");
  const visibleRankings = rankings.filter((row) => row.companyId === selectedCompanyId);
  return (
    <section className="space-y-8">
      <label>
        <select
          aria-label="Company"
          value={selectedCompanyId}
          onChange={(event) => setSelectedCompanyId(event.target.value)}
          className="rounded border p-2"
        >
          {rankings.map((row) => (
            <option key={row.companyId} value={row.companyId}>
              {row.companyName}
            </option>
          ))}
        </select>
      </label>
      {visibleRankings.map((row) => (
        <StyledTable key={row.companyId} tableClassName="company-results-table text-sm">
            <thead>
              <tr>
                <th className={`${thClass} font-semibold`}>{row.companyName}</th>
                {row.byJudge.map((judge) => (
                  <th key={judge.judgeId} className={`${thClass} text-center font-normal`}>
                    {judge.judgeName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.name}>
                  <td className={tdClass}>{category.name} <span className="text-xs text-gray-600">({category.weight}%)</span></td>
                  {row.byJudge.map((judge) => (
                    <td key={judge.judgeId} className={`${tdClass} text-center`}>
                      {judge.categories[category.name] !== undefined
                        ? judge.categories[category.name].toFixed(1)
                        : ""}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className={`${tdClass} font-semibold`}>Average Per Judge</td>
                {row.byJudge.map((judge) => (
                  <td key={judge.judgeId} className={`${tdClass} text-center font-semibold`}>
                    {judge.judgeTotal !== null ? judge.judgeTotal.toFixed(1) : ""}
                  </td>
                ))}
              </tr>
            </tbody>
        </StyledTable>
      ))}
    </section>
  );
}
