import { NextResponse } from "next/server";
import { buildRankings, scoresFromFinalJudges, winnerFromRankings } from "@/lib/competition-results";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.response) {
    return authResult.response;
  }

  const competitions = await prisma.competition.findMany({
    orderBy: { eventDate: "desc" },
    include: {
      companies: true,
      judges: true,
      categories: { orderBy: { createdAt: "asc" } },
      sessions: true,
      scores: {
        include: { category: true, judge: true },
      },
    },
  });

  const payload = competitions.map((competition) => {
    const finalScores = scoresFromFinalJudges(competition.scores, competition.sessions);
    const rankings = buildRankings(
      competition.companies,
      competition.judges,
      competition.categories,
      finalScores,
    );

    return {
      id: competition.id,
      name: competition.name,
      eventDate: competition.eventDate,
      isActive: competition.isActive,
      winner: winnerFromRankings(rankings),
      judgeCount: competition.judges.length,
      finalSubmissionCount: competition.sessions.filter((session) => session.status === "FINAL").length,
    };
  });

  return NextResponse.json({ competitions: payload });
}
