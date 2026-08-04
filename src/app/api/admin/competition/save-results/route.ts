import { NextResponse } from "next/server";
import { copyCompetitionToArchive } from "@/lib/competition-snapshot";
import { getCompetitionResults } from "@/lib/competition-results";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

export async function POST() {
  const authResult = await requireAdmin();
  if (authResult.response) {
    return authResult.response;
  }

  const competition = await prisma.competition.findFirst({
    where: { isActive: true },
  });

  if (!competition) {
    return NextResponse.json({ error: "No active competition found." }, { status: 404 });
  }

  const results = await getCompetitionResults(competition.id);
  if (!results) {
    return NextResponse.json({ error: "Unable to compute results." }, { status: 500 });
  }

  await prisma.competition.update({
    where: { id: competition.id },
    data: { resultsSummary: results.resultsSummary },
  });

  const archived = await copyCompetitionToArchive(competition.id);

  return NextResponse.json({
    ok: true,
    resultsSummary: results.resultsSummary,
    winner: results.winner,
    finalJudgeCount: results.finalJudgeCount,
    archivedCompetitionId: archived.id,
    rankings: results.rankings.map((row) => ({
      rank: row.rank,
      companyName: row.companyName,
      finalScore: row.finalScore,
      judgeCount: row.judgeCount,
    })),
  });
}
