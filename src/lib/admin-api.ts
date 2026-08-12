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

async function readOkJson<T>(response: Response): Promise<T | null> {
  if (!response.ok) return null;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function loadArchivedCompetitionDetails(id: string) {
  const response = await fetch(`/api/admin/competitions/archived/${id}`, { cache: "no-store" });
  return readOkJson<ArchivedCompetitionDetails>(response);
}

export async function loadAdminData() {
  const response = await fetch("/api/admin/competition", { cache: "no-store" });
  return readOkJson<AdminCompetitionResponse>(response);
}

export async function loadResultsPreview() {
  const response = await fetch("/api/results", { cache: "no-store" });
  const payload = await readOkJson<{
    competition: { winner: string | null };
    finalJudgeCount: number;
    rankings: Array<Record<string, unknown>>;
  }>(response);
  if (!payload) return null;
  return {
    winner: payload.competition.winner,
    finalJudgeCount: payload.finalJudgeCount,
    rankings: payload.rankings.map((row) => ({
      rank: row.rank as number,
      companyName: row.companyName as string,
      finalScore: row.finalScore as number,
      judgeCount: row.judgeCount as number,
    })),
  } satisfies ResultsPreview;
}

export async function loadArchivedCompetitions() {
  const response = await fetch("/api/admin/competitions/archived", { cache: "no-store" });
  const payload = await readOkJson<{ competitions: ArchivedCompetition[] }>(response);
  return payload?.competitions ?? [];
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
