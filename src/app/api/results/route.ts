import { NextRequest, NextResponse } from "next/server";
import { buildRankings, scoresFromFinalJudges, winnerFromRankings } from "@/lib/competition-results";
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
    return NextResponse.json({ error: "Competition not found." }, { status: 404 });
  }

  const finalScores = scoresFromFinalJudges(competition.scores, competition.sessions);
  const rankings = buildRankings(
    competition.companies,
    competition.judges,
    competition.categories,
    finalScores,
  );
  const finalJudgeCount = competition.sessions.filter((session) => session.status === "FINAL").length;

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
      weight: category.weight,
    })),
    rankings,
  });
}
