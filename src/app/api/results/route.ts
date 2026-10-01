import { NextRequest, NextResponse } from "next/server";
import { buildRankings, countPublishedJudges, scoresFromFinalJudges, winnerFromRankings } from "@/lib/competition-results";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.response) {
    return authResult.response;
  }

  const competitionId = request.nextUrl.searchParams.get("competitionId");

  const competition = await prisma.competition.findFirst({
    where: competitionId ? { id: competitionId } : { isActive: true },
    include: {
      companies: { orderBy: { createdAt: "asc" } },
      judges: { orderBy: { name: "asc" } },
      categories: { orderBy: { createdAt: "asc" } },
      sessions: true,
      scores: {
        include: { category: true, judge: true },
      },
    },
  });

  if (!competition) {
    return NextResponse.json({ error: "Competition not found." }, { status: 404 });
  }

  const finalScores = scoresFromFinalJudges(competition.scores);
  const rankings = buildRankings(
    competition.companies,
    competition.judges,
    competition.categories,
    finalScores,
  );
  const finalJudgeCount = countPublishedJudges(competition.scores);

  return NextResponse.json({
    competition: {
      id: competition.id,
      name: competition.name,
      eventDate: competition.eventDate,
      winner: winnerFromRankings(rankings),
    },
    finalJudgeCount,
    judges: competition.judges.map((judge) => ({ id: judge.id, name: judge.name })),
    categories: competition.categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      weight: category.weight,
    })),
    rankings,
  });
}
