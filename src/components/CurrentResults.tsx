"use client";

import { useMemo, useState } from "react";
import { CompaniesJudgesTable } from "@/components/CompaniesJudgesTable";
import { CompanyResultsTables } from "@/components/CompanyResultsTables";
import { JudgesCategoryTable } from "@/components/JudgesCategoryTable";
import { ResultsPodiums } from "@/components/ResultsPodiums";
import { ResultsScoreCircles } from "@/components/ResultsScoreCircles";
import { ResultsScores } from "@/components/ResultsScores";
import type { RankingRow } from "@/lib/competition-results";

type CategoryRef = { name: string; description?: string | null; weight: number };

type GraphicView = "podiums" | "circles" | "scores";
type TableView = "companies-categories" | "judges-category" | "companies-judges";

function toGraphicRow(row: RankingRow) {
  return {
    companyId: row.companyId,
    companyName: row.companyName,
    finalScore: row.finalScore,
    rank: row.rank,
    pitch: row.pitch,
  };
}

export function CurrentResults({
  rankings,
  categories,
}: {
  rankings: RankingRow[];
  categories: CategoryRef[];
}) {
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [graphicView, setGraphicView] = useState<GraphicView>("podiums");
  const [tableView, setTableView] = useState<TableView>("companies-categories");
  const companiesByPitch = useMemo(
    () => [...rankings].sort((a, b) => a.pitch - b.pitch),
    [rankings],
  );
  const activeCompanyId = rankings.some((row) => row.companyId === selectedCompanyId)
    ? selectedCompanyId
    : (companiesByPitch[0]?.companyId ?? "");

  function selectCompany(companyId: string) {
    setSelectedCompanyId(companyId);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <label className="inline-flex items-center gap-2 text-xs text-muted">
          Graphic
          <select
            aria-label="Graphic view"
            value={graphicView}
            onChange={(event) => setGraphicView(event.target.value as GraphicView)}
            className="rounded border border-border bg-surface px-2 py-1 text-sm text-foreground"
          >
            <option value="podiums">Podiums</option>
            <option value="circles">Circles</option>
            <option value="scores">Scores</option>
          </select>
        </label>
      </div>
      {graphicView === "podiums" ? (
        <ResultsPodiums
          rankings={rankings.map(toGraphicRow)}
          selectedCompanyId={selectedCompanyId}
          onSelectCompany={selectCompany}
        />
      ) : graphicView === "circles" ? (
        <ResultsScoreCircles
          rankings={rankings.map(toGraphicRow)}
          selectedCompanyId={selectedCompanyId}
          onSelectCompany={selectCompany}
        />
      ) : (
        <ResultsScores
          rankings={rankings.map(toGraphicRow)}
          selectedCompanyId={selectedCompanyId}
          onSelectCompany={selectCompany}
        />
      )}
      <div className="flex justify-end">
        <label className="inline-flex items-center gap-2 text-xs text-muted">
          Table
          <select
            aria-label="Table view"
            value={tableView}
            onChange={(event) => setTableView(event.target.value as TableView)}
            className="rounded border border-border bg-surface px-2 py-1 text-sm text-foreground"
          >
            <option value="companies-categories">Companies x Categories</option>
            <option value="judges-category">Judges x Category</option>
            <option value="companies-judges">Companies x Judges</option>
          </select>
        </label>
      </div>
      {tableView === "companies-categories" ? (
        <CompanyResultsTables
          rankings={rankings}
          categories={categories}
          selectedCompanyId={selectedCompanyId}
        />
      ) : tableView === "judges-category" ? (
        <JudgesCategoryTable
          rankings={rankings}
          categories={categories}
          selectedCompanyId={activeCompanyId}
          onSelectCompany={selectCompany}
        />
      ) : (
        <CompaniesJudgesTable rankings={rankings} selectedCompanyId={selectedCompanyId} />
      )}
    </div>
  );
}
