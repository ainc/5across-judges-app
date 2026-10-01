"use client";

import { useState } from "react";
import { CompanyResultsTables } from "@/components/CompanyResultsTables";
import { ResultsPodiums } from "@/components/ResultsPodiums";
import type { RankingRow } from "@/lib/competition-results";

type CategoryRef = { name: string; description?: string | null; weight: number };

export function CurrentResults({
  rankings,
  categories,
}: {
  rankings: RankingRow[];
  categories: CategoryRef[];
}) {
  const [tableCompanyId, setTableCompanyId] = useState(rankings[0]?.companyId ?? "");
  const [podiumCompanyId, setPodiumCompanyId] = useState("");

  function selectCompany(companyId: string) {
    setTableCompanyId(companyId);
    setPodiumCompanyId(companyId);
  }

  return (
    <>
      <ResultsPodiums
        rankings={rankings.map((row) => ({
          companyId: row.companyId,
          companyName: row.companyName,
          finalScore: row.finalScore,
          rank: row.rank,
        }))}
        selectedCompanyId={podiumCompanyId}
        onSelectCompany={selectCompany}
      />
      <CompanyResultsTables
        rankings={rankings}
        categories={categories}
        selectedCompanyId={tableCompanyId}
        onSelectCompany={selectCompany}
      />
    </>
  );
}
