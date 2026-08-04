import type { ArchivedCompetitionDetails, Judge } from "@/components/admin/types";

export type AdminCompetitionResponse = {
  competition: {
    id: string;
    name: string;
    eventDate: string;
    judgeMessage: string | null;
    resultsSummary: string | null;
  };
  judges: Judge[];
  companies: Array<{ id: string; name: string; presenter: string | null }>;
  categories: Array<{ id: string; name: string; weight: number; maxScore: number }>;
};

export type ResultsPreview = {
  winner: string | null;
  finalJudgeCount: number;
  rankings: Array<{
    rank: number;
    companyName: string;
    finalScore: number;
    judgeCount: number;
  }>;
};

export type ArchivedCompetition = {
  id: string;
  name: string;
  eventDate: string;
  isActive: boolean;
  winner: string | null;
  finalSubmissionCount: number;
};

export async function loadArchivedCompetitionDetails(id: string) {
  const response = await fetch(`/api/admin/competitions/archived/${id}`, { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as ArchivedCompetitionDetails;
}

export async function loadAdminData() {
  const response = await fetch("/api/admin/competition", { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as AdminCompetitionResponse;
}

export async function loadResultsPreview() {
  const response = await fetch("/api/results", { cache: "no-store" });
  if (!response.ok) return null;
  const payload = await response.json();
  return {
    winner: payload.competition.winner as string | null,
    finalJudgeCount: payload.finalJudgeCount as number,
    rankings: (payload.rankings as Array<Record<string, unknown>>).map((row) => ({
      rank: row.rank as number,
      companyName: row.companyName as string,
      finalScore: row.finalScore as number,
      judgeCount: row.judgeCount as number,
    })),
  } satisfies ResultsPreview;
}

export async function loadArchivedCompetitions() {
  const response = await fetch("/api/admin/competitions/archived", { cache: "no-store" });
  if (!response.ok) return [];
  const payload = await response.json();
  return payload.competitions as ArchivedCompetition[];
}

export async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}
