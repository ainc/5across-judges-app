"use client";

import { StyledTable, tdClass, thClass } from "@/components/StyledTable";
import { formatWeightedTotal } from "@/lib/judging-format";
import type { RankingRow } from "@/lib/competition-results";

const TOTAL_ROW_LABEL = "Overall Score";

function labelColumnWidth(labels: string[]) {
  const longest = labels.reduce((max, label) => Math.max(max, label.length), 0);
  const capped = Math.min(Math.max(longest, 12), 48);
  return `max(12rem, calc(${capped}ch + 2.75rem))`;
}

export function CompaniesJudgesTable({
  rankings,
  selectedCompanyId,
}: {
  rankings: RankingRow[];
  selectedCompanyId: string;
}) {
  const companies = [...rankings].sort((a, b) => a.pitch - b.pitch);
  if (companies.length === 0) {
    return <p className="text-sm text-muted">No results yet.</p>;
  }

  const judges = companies[0].byJudge;
  const labelWidth = labelColumnWidth(["Judge", TOTAL_ROW_LABEL, ...judges.map((judge) => judge.judgeName)]);

  return (
    <section className="space-y-8">
      <StyledTable tableClassName="company-results-table text-sm">
        <colgroup>
          <col style={{ width: labelWidth }} />
          {companies.map((company) => (
            <col key={company.companyId} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className={`${thClass} font-normal`}>Judge</th>
            {companies.map((company) => {
              const selected = company.companyId === selectedCompanyId;
              return (
                <th
                  key={company.companyId}
                  className={`border-r border-b p-2 break-words text-center ${selected ? "font-bold" : "font-normal"}`}
                >
                  Pitch {company.pitch} - {company.companyName}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {judges.map((judge) => (
            <tr key={judge.judgeId}>
              <td className={tdClass}>{judge.judgeName}</td>
              {companies.map((company) => {
                const selected = company.companyId === selectedCompanyId;
                const score = company.byJudge.find((entry) => entry.judgeId === judge.judgeId);
                return (
                  <td
                    key={company.companyId}
                    className={`${tdClass} text-center ${selected ? "font-bold" : ""}`}
                  >
                    {score?.judgeTotal == null ? "" : formatWeightedTotal(score.judgeTotal)}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <td className={`${tdClass} font-semibold`}>{TOTAL_ROW_LABEL}</td>
            {companies.map((company) => {
              const selected = company.companyId === selectedCompanyId;
              return (
                <td
                  key={company.companyId}
                  className={`${tdClass} text-center ${selected ? "font-bold" : "font-semibold"}`}
                >
                  {formatWeightedTotal(company.finalScore)}
                </td>
              );
            })}
          </tr>
        </tbody>
      </StyledTable>
    </section>
  );
}
