import { buildRankings, countPublishedJudges, scoresFromFinalJudges, winnerFromRankings } from "@/lib/competition-results";
import { prisma } from "@/lib/prisma";

export type ResultPayload = {
  competition: {
    id: string;
    name: string;
    eventDate: string;
    winner: string | null;
  };
  finalJudgeCount: number;
  categories: Array<{ id: string; name: string; description: string; weight: number }>;
  rankings: Array<{
    companyId: string;
    companyName: string;
    companyPresenter: string;
    finalScore: number;
    judgeCount: number;
    pitch: number;
    rank: number;
    byJudge: Array<{
      judgeId: string;
      judgeName: string;
      categories: Record<string, number>;
      judgeTotal: number | null;
    }>;
  }>;
};

const resultsInclude = {
  companies: { orderBy: { createdAt: "asc" as const } },
  judges: { orderBy: { name: "asc" as const } },
  categories: { orderBy: { createdAt: "asc" as const } },
  sessions: true,
  scores: {
    include: { category: true, judge: true },
  },
};

export async function getResults(competitionId?: string): Promise<ResultPayload | null> {
  const competition = competitionId
    ? await prisma.competition.findFirst({
        where: { id: competitionId },
        include: resultsInclude,
      })
    : (await prisma.competition.findFirst({
        where: { isActive: true },
        include: resultsInclude,
      })) ??
      (await prisma.competition.findFirst({
        where: { isActive: false },
        orderBy: { updatedAt: "desc" },
        include: resultsInclude,
      }));

  if (!competition) {
    return null;
  }

  const finalScores = scoresFromFinalJudges(competition.scores);
  const rankings = buildRankings(
    competition.companies,
    competition.judges,
    competition.categories,
    finalScores,
  );
  const finalJudgeCount = countPublishedJudges(competition.scores);

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
      description: category.description,
      weight: category.weight,
    })),
    rankings,
  };
}
