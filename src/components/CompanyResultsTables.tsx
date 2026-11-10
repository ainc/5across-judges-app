"use client";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Tooltip from "@mui/material/Tooltip";
import { StyledTable, tdClass, thClass } from "@/components/StyledTable";
import { formatWeightedTotal } from "@/lib/judging-format";

type CategoryRef = { name: string; description?: string | null; weight: number };
type JudgeScore = {
  judgeId: string;
  judgeName: string;
  categories: Record<string, number>;
  judgeTotal: number | null;
};
type CompanyRanking = {
  companyId: string;
  companyName: string;
  pitch: number;
  finalScore: number;
  byJudge: JudgeScore[];
};

const TOTAL_ROW_LABEL = "Overall Score";

function labelColumnWidth(categories: CategoryRef[]) {
  const labels = [
    "Category",
    TOTAL_ROW_LABEL,
    ...categories.map((category) => `${category.name} (${category.weight}%)`),
  ];
  const longest = labels.reduce((max, label) => Math.max(max, label.length), 0);
  const capped = Math.min(Math.max(longest, 12), 48);
  return `max(12rem, calc(${capped}ch + 2.75rem))`;
}

function averageCategoryScore(judges: JudgeScore[], categoryName: string) {
  const scores = judges.flatMap((judge) => {
    const score = judge.categories[categoryName];
    return score === undefined ? [] : [score];
  });
  if (scores.length === 0) return null;
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

export function CompanyResultsTables({
  rankings,
  categories,
  selectedCompanyId,
}: {
  rankings: CompanyRanking[];
  categories: CategoryRef[];
  selectedCompanyId: string;
}) {
  const companies = [...rankings].sort((a, b) => a.pitch - b.pitch);
  if (companies.length === 0) {
    return <p className="text-sm text-muted">No results yet.</p>;
  }

  const labelWidth = labelColumnWidth(categories);

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
            <th className={`${thClass} font-normal`}>Category</th>
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
          {categories.map((category) => (
            <tr key={category.name}>
              <td className={tdClass}>
                <span className="inline-flex items-center gap-1">
                  {category.name}
                  {category.description?.trim() ? (
                    <Tooltip title={category.description} arrow>
                      <button
                        type="button"
                        aria-label={`Full description: ${category.description}`}
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted hover:text-foreground"
                      >
                        <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                      </button>
                    </Tooltip>
                  ) : null}
                  <span className="text-xs text-muted">({category.weight}%)</span>
                </span>
              </td>
              {companies.map((company) => {
                const selected = company.companyId === selectedCompanyId;
                const average = averageCategoryScore(company.byJudge, category.name);
                return (
                  <td
                    key={company.companyId}
                    className={`${tdClass} text-center ${selected ? "font-bold" : ""}`}
                  >
                    {average === null ? "" : formatWeightedTotal(average)}
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
