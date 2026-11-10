"use client";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Tooltip from "@mui/material/Tooltip";
import { AppSelect } from "@/components/AppSelect";
import { StyledTable, tdClass, thClass } from "@/components/StyledTable";
import { formatWeightedTotal } from "@/lib/judging-format";
import type { RankingRow } from "@/lib/competition-results";

type CategoryRef = { name: string; description?: string | null; weight: number };

export function JudgesCategoryTable({
  rankings,
  categories,
  selectedCompanyId,
  onSelectCompany,
}: {
  rankings: RankingRow[];
  categories: CategoryRef[];
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
}) {
  const company = rankings.find((row) => row.companyId === selectedCompanyId);
  if (!company) {
    return <p className="text-sm text-muted">No results yet.</p>;
  }

  const companies = [...rankings].sort((a, b) => a.pitch - b.pitch);

  return (
    <section className="space-y-8">
      <StyledTable tableClassName="company-results-table text-sm">
        <thead>
          <tr>
            <th className="border-r border-b p-0 text-left font-normal">
              <AppSelect
                header
                aria-label="Company"
                value={selectedCompanyId}
                onChange={(event) => onSelectCompany(event.target.value)}
              >
                {companies.map((option) => (
                  <option key={option.companyId} value={option.companyId}>
                    Pitch {option.pitch} - {option.companyName}
                  </option>
                ))}
              </AppSelect>
            </th>
            {company.byJudge.map((judge) => (
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
              {company.byJudge.map((judge) => (
                <td key={judge.judgeId} className={`${tdClass} text-center`}>
                  {judge.categories[category.name] !== undefined
                    ? judge.categories[category.name].toFixed(1)
                    : ""}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className={`${tdClass} font-semibold`}>Weighted Score</td>
            {company.byJudge.map((judge) => (
              <td key={judge.judgeId} className={`${tdClass} text-center font-semibold`}>
                {judge.judgeTotal !== null ? formatWeightedTotal(judge.judgeTotal) : ""}
              </td>
            ))}
          </tr>
        </tbody>
      </StyledTable>
    </section>
  );
}
