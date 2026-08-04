import { NextRequest, NextResponse } from "next/server";
import { buildRankings, scoresFromFinalJudges, winnerFromRankings } from "@/lib/competition-results";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

type RouteParams = {
  params: Promise<{ competitionId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (authResult.response) {
    return authResult.response;
  }

  const { competitionId } = await params;

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
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

  return NextResponse.json({
    competition: {
      id: competition.id,
      name: competition.name,
      eventDate: competition.eventDate,
      winner: winnerFromRankings(rankings),
    },
    rankings,
  });
}
