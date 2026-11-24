"use client";

import { useState } from "react";
import { CompanyResultsTables } from "@/components/CompanyResultsTables";
import { ResultsPodiums } from "@/components/ResultsPodiums";
// import { ResultsScoreCircles } from "@/components/ResultsScoreCircles";
// import { ResultsScores } from "@/components/ResultsScores";
import { formatWeightedTotal } from "@/lib/judging-format";
import type { RankingRow } from "@/lib/competition-results";

type CategoryRef = { name: string; description?: string | null; weight: number };

// type GraphicView = "podiums" | "circles" | "scores";
type TableView = "yours" | "cumulative";

function podiumRows(rankings: RankingRow[], judgeId: string | null, tableView: TableView) {
  const personal = Boolean(judgeId && tableView === "yours");
  const withScore = rankings.map((row) => ({
    companyId: row.companyId,
    companyName: row.companyName,
    pitch: row.pitch,
    finalScore: personal
      ? (row.byJudge.find((judge) => judge.judgeId === judgeId)?.judgeTotal ?? null)
      : row.finalScore,
  }));
  const ranked = [...withScore].sort((a, b) => {
    if (a.finalScore == null && b.finalScore == null) return a.pitch - b.pitch;
    if (a.finalScore == null) return 1;
    if (b.finalScore == null) return -1;
    return b.finalScore - a.finalScore || a.pitch - b.pitch;
  });
  return ranked.map((row, index) => ({
    ...row,
    rank: row.finalScore == null ? ranked.length + 1 : index + 1,
  }));
}

const TABLE_OPTIONS: Array<{ value: TableView; label: string }> = [
  { value: "yours", label: "Your Scores" },
  { value: "cumulative", label: "Cumulative Judges Scores" },
];

export function CurrentResults({
  rankings,
  categories,
  judgeId,
}: {
  rankings: RankingRow[];
  categories: CategoryRef[];
  judgeId: string | null;
}) {
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  // const [graphicView, setGraphicView] = useState<GraphicView>("podiums");
  const [tableView, setTableView] = useState<TableView>(judgeId ? "yours" : "cumulative");

  function selectCompany(companyId: string) {
    setSelectedCompanyId(companyId);
  }

  const tableToggle = judgeId ? (
    <div className="inline-flex shrink-0 overflow-hidden rounded border border-border text-sm" role="group" aria-label="Table">
      {TABLE_OPTIONS.map((option) => {
        const selected = tableView === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => setTableView(option.value)}
            className={`px-3 py-1 ${option.value === "cumulative" ? "border-l border-border" : ""} ${selected ? "bg-gray-900 text-white" : "bg-surface text-foreground"}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  ) : null;

  const graphicRows = podiumRows(rankings, judgeId, tableView);
  const leader = graphicRows.find((row) => row.rank === 1);

  return (
    <div className="space-y-4">
      {/*
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
      */}
      <div className="flex items-end gap-4">
        {leader ? (
          <aside className="flex w-80 shrink-0 flex-col justify-between self-stretch rounded-lg bg-[#e5e7eb] px-4 py-3 text-[#111827]">
            <div>
              <p className="text-sm">Highest Score</p>
              <p className="break-words text-2xl font-bold leading-tight">{leader.companyName}</p>
              <p className="text-sm font-semibold leading-tight">Pitch {leader.pitch}</p>
            </div>
            <p className="text-6xl font-bold leading-none text-[#EC3641]">
              {leader.finalScore == null ? "" : formatWeightedTotal(leader.finalScore)}
              <span className="text-2xl text-[#111827]">/5</span>
            </p>
          </aside>
        ) : null}
        <div className="flex min-w-0 flex-1 self-stretch">
          <ResultsPodiums
            rankings={graphicRows}
            selectedCompanyId={selectedCompanyId}
            onSelectCompany={selectCompany}
          />
        </div>
        {tableToggle}
      </div>
      {/*
      {graphicView === "circles" ? (
        <>
          <ResultsScoreCircles
            rankings={rankings.map(toGraphicRow)}
            selectedCompanyId={selectedCompanyId}
            onSelectCompany={selectCompany}
          />
          {tableToggle ? <div className="flex justify-end">{tableToggle}</div> : null}
        </>
      ) : (
        <>
          <ResultsScores
            rankings={rankings.map(toGraphicRow)}
            selectedCompanyId={selectedCompanyId}
            onSelectCompany={selectCompany}
          />
          {tableToggle ? <div className="flex justify-end">{tableToggle}</div> : null}
        </>
      )}
      */}
      <CompanyResultsTables
        rankings={rankings}
        categories={categories}
        selectedCompanyId={selectedCompanyId}
        judgeId={judgeId && tableView === "yours" ? judgeId : undefined}
      />
    </div>
  );
}
