"use client";

import { useState } from "react";
import { CompanyResultsTables } from "@/components/CompanyResultsTables";
import { ResultsPodiums } from "@/components/ResultsPodiums";
import { ResultsScoreCircles } from "@/components/ResultsScoreCircles";
import type { RankingRow } from "@/lib/competition-results";

type CategoryRef = { name: string; description?: string | null; weight: number };

type GraphicView = "podiums" | "circles";

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
  const [tableCompanyId, setTableCompanyId] = useState(rankings[0]?.companyId ?? "");
  const [podiumCompanyId, setPodiumCompanyId] = useState("");
  const [graphicView, setGraphicView] = useState<GraphicView>("podiums");

  function selectCompany(companyId: string) {
    setTableCompanyId(companyId);
    setPodiumCompanyId(companyId);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <label className="inline-flex items-center gap-2 text-xs text-gray-600">
          Graphic
          <select
            aria-label="Graphic view"
            value={graphicView}
            onChange={(event) => setGraphicView(event.target.value as GraphicView)}
            className="rounded border border-[#323232] bg-white px-2 py-1 text-sm text-[#323232]"
          >
            <option value="podiums">Podiums</option>
            <option value="circles">Circles</option>
          </select>
        </label>
      </div>
      {graphicView === "podiums" ? (
        <ResultsPodiums
          rankings={rankings.map(toGraphicRow)}
          selectedCompanyId={podiumCompanyId}
          onSelectCompany={selectCompany}
        />
      ) : (
        <ResultsScoreCircles
          rankings={rankings.map(toGraphicRow)}
          selectedCompanyId={podiumCompanyId}
          onSelectCompany={selectCompany}
        />
      )}
      <CompanyResultsTables
        rankings={rankings}
        categories={categories}
        selectedCompanyId={tableCompanyId}
        onSelectCompany={selectCompany}
      />
    </div>
  );
}
