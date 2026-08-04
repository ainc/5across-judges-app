import { buildRankings, scoresFromFinalJudges, winnerFromRankings } from "@/lib/competition-results";
import { prisma } from "@/lib/prisma";

export type ResultPayload = {
  competition: {
    id: string;
    name: string;
    eventDate: string;
    winner: string | null;
  };
  finalJudgeCount: number;
  categories: Array<{ id: string; name: string; weight: number }>;
  rankings: Array<{
    companyId: string;
    companyName: string;
    companyPresenter: string;
    finalScore: number;
    judgeCount: number;
    rank: number;
    byJudge: Array<{
      judgeId: string;
      judgeName: string;
      categories: Record<string, number>;
      judgeTotal: number | null;
    }>;
  }>;
};

export async function getResults(competitionId?: string): Promise<ResultPayload> {
  const competition = await prisma.competition.findFirst({
    where: competitionId ? { id: competitionId } : { isActive: true },
    include: {
      companies: { orderBy: { name: "asc" } },
      judges: { orderBy: { name: "asc" } },
      categories: { orderBy: { createdAt: "asc" } },
      sessions: true,
      scores: {
        include: { category: true, judge: true },
      },
    },
  });

  if (!competition) {
    throw new Error("Failed to fetch results");
  }

  const finalScores = scoresFromFinalJudges(competition.scores, competition.sessions);
  const rankings = buildRankings(
    competition.companies,
    competition.judges,
    competition.categories,
    finalScores,
  );
  const finalJudgeCount = competition.sessions.filter((session) => session.status === "FINAL").length;

  return {
    competition: {
      id: competition.id,
      name: competition.name,
      eventDate: competition.eventDate.toISOString(),
      winner: winnerFromRankings(rankings),
    },
    finalJudgeCount,
    categories: competition.categories.map((category) => ({
      id: category.id,
      name: category.name,
      weight: category.weight,
    })),
    rankings,
  };
}
