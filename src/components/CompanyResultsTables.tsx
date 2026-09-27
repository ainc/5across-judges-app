"use client";

import { useState } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Tooltip from "@mui/material/Tooltip";
import { AppSelect } from "@/components/AppSelect";
import { StyledTable, tdClass, thClass } from "@/components/StyledTable";
import { firstPhrase } from "@/lib/judging-format";

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
      {visibleRankings.map((row) => (
        <StyledTable key={row.companyId} tableClassName="company-results-table text-sm">
            <thead>
              <tr>
                <th className={`${thClass} font-semibold`}>
                  <AppSelect
                    aria-label="Company"
                    value={selectedCompanyId}
                    onChange={(event) => setSelectedCompanyId(event.target.value)}
                    className="w-full rounded border bg-white p-1 font-semibold"
                  >
                    {rankings.map((option) => (
                      <option key={option.companyId} value={option.companyId}>
                        {option.companyName}
                      </option>
                    ))}
                  </AppSelect>
                </th>
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
                  <td className={tdClass}>
                    <span className="inline-flex items-center gap-1">
                      {firstPhrase(category.name)}
                      <Tooltip title={category.name} arrow>
                        <button
                          type="button"
                          aria-label={`Full description: ${category.name}`}
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-500 hover:text-gray-800"
                        >
                          <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                        </button>
                      </Tooltip>
                      <span className="text-xs text-gray-600">({category.weight}%)</span>
                    </span>
                  </td>
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
