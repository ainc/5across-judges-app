"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isScoreInRange, normalizeScore } from "@/lib/scoring";

type Judge = { id: string; name: string; code: string | null };
type Company = { id: string; name: string };
type Category = { id: string; name: string; weight: number; maxScore: number };

type ActiveCompetitionResponse = {
  competition: { id: string; name: string; eventDate: string };
  judges: Judge[];
  companies: Company[];
  categories: Category[];
};

export default function HomePage() {
  const [data, setData] = useState<ActiveCompetitionResponse | null>(null);
  const [selectedJudgeId, setSelectedJudgeId] = useState<string>("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [statusText, setStatusText] = useState<string>("");
  const [missingCells, setMissingCells] = useState<Array<{ companyId: string; categoryId: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/competitions/active");
      if (!response.ok) {
        setStatusText("Unable to load active competition.");
        return;
      }
      const payload = (await response.json()) as ActiveCompetitionResponse;
      setData(payload);
      if (payload.judges.length > 0) setSelectedJudgeId(payload.judges[0].id);
    }
    load();
  }, []);

  const scoreLegend = "1 Weak, 2 Needs Improvement, 3 Competent, 4 Above Expectations, 5 Excellent";

  const totals = useMemo(() => {
    if (!data) return {};
    const categoryMap = new Map(data.categories.map((category) => [category.id, category]));
    const result: Record<string, number> = {};
    for (const company of data.companies) {
      let total = 0;
      for (const category of data.categories) {
        const value = scores[`${company.id}:${category.id}`];
        if (typeof value === "number") {
          total += value * ((categoryMap.get(category.id)?.weight ?? 0) / 100);
        }
      }
      result[company.id] = Math.round(total * 100) / 100;
    }
    return result;
  }, [data, scores]);

  const entryCount = useMemo(() => {
    if (!data) return 0;
    return data.companies.length * data.categories.length;
  }, [data]);

  async function submitScores(isFinal: boolean) {
    if (!data || !selectedJudgeId) {
      setStatusText("Pick a judge before saving.");
      return;
    }
    setIsSubmitting(true);
    setMissingCells([]);
    try {
      const entries = Object.entries(scores).map(([key, value]) => {
        const [companyId, categoryId] = key.split(":");
        return { companyId, categoryId, score: value };
      });
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId: data.competition.id,
          judgeId: selectedJudgeId,
          isFinal,
          entries,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setStatusText(payload.error ?? "Save failed.");
        if (payload.missingCells) setMissingCells(payload.missingCells);
        return;
      }
      setStatusText(isFinal ? "Final submission saved." : "Draft saved.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!data) {
    return <main className="p-6">Loading competition...</main>;
  }

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pitch Judging</h1>
          <p>{data.competition.name}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/results" className="underline">
            Current Results
          </Link>
          <Link href="/history" className="underline">
            Past Competitions
          </Link>
        </div>
      </header>

      <section className="flex flex-wrap items-center gap-3">
        <label htmlFor="judge-select" className="font-medium">
          Judge
        </label>
        <select
          id="judge-select"
          value={selectedJudgeId}
          onChange={(event) => setSelectedJudgeId(event.target.value)}
          className="border rounded px-2 py-1"
        >
          {data.judges.map((judge) => (
            <option key={judge.id} value={judge.id}>
              {judge.name} {judge.code ? `(${judge.code})` : ""}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-700">{scoreLegend}</p>
      </section>

      <section className="overflow-auto border rounded">
        <table className="min-w-full border-collapse">
          <thead className="sticky top-0 bg-white">
            <tr>
              <th className="sticky left-0 bg-white border p-2 text-left">Category (Weight)</th>
              {data.companies.map((company) => (
                <th key={company.id} className="border p-2 min-w-40">
                  {company.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.categories.map((category) => (
              <tr key={category.id}>
                <td className="sticky left-0 bg-white border p-2 text-sm">
                  {category.name} ({category.weight}%)
                </td>
                {data.companies.map((company) => {
                  const key = `${company.id}:${category.id}`;
                  return (
                    <td key={key} className="border p-1 text-center">
                      <input
                        className="w-16 border rounded px-2 py-1 text-center"
                        min={1}
                        max={5}
                        step={0.01}
                        type="number"
                        value={scores[key] ?? ""}
                        onChange={(event) => {
                          const raw = event.target.value;
                          if (raw === "") {
                            setScores((prev) => {
                              const next = { ...prev };
                              delete next[key];
                              return next;
                            });
                            return;
                          }
                          const numeric = Number(raw);
                          if (isScoreInRange(numeric)) {
                            setScores((prev) => ({ ...prev, [key]: normalizeScore(numeric) }));
                          }
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td className="sticky left-0 bg-gray-50 border p-2 font-semibold">Weighted total</td>
              {data.companies.map((company) => (
                <td key={company.id} className="border p-2 text-center font-semibold">
                  {totals[company.id]?.toFixed(2) ?? "0.00"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex items-center gap-3">
        <button
          disabled={isSubmitting}
          onClick={() => submitScores(false)}
          className="rounded bg-gray-900 px-3 py-2 text-white disabled:opacity-50"
        >
          Save Draft
        </button>
        <button
          disabled={isSubmitting}
          onClick={() => submitScores(true)}
          className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
        >
          Final Submit
        </button>
        <p className="text-sm text-gray-700">
          {Object.keys(scores).length}/{entryCount} cells scored
        </p>
      </section>

      {statusText && <p className="font-medium">{statusText}</p>}
      {missingCells.length > 0 && (
        <div className="rounded border border-red-300 bg-red-50 p-3">
          <p className="font-semibold">Missing cells:</p>
          <ul className="list-disc pl-5 text-sm">
            {missingCells.slice(0, 12).map((cell) => {
              const company = data.companies.find((item) => item.id === cell.companyId)?.name ?? cell.companyId;
              const category =
                data.categories.find((item) => item.id === cell.categoryId)?.name ?? cell.categoryId;
              return (
                <li key={`${cell.companyId}:${cell.categoryId}`}>
                  {company} {"->"} {category}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </main>
  );
}
