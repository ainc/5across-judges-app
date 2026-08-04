import { NextResponse } from "next/server";
import { archivedCompetitionMatchesActive } from "@/lib/competition-snapshot";
import { buildRankings, scoresFromFinalJudges, winnerFromRankings } from "@/lib/competition-results";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if (authResult.response) {
    return authResult.response;
  }

  const { id } = await context.params;

  const competition = await prisma.competition.findUnique({
    where: { id },
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
      isActive: competition.isActive,
      judgeMessage: competition.judgeMessage,
      resultsSummary: competition.resultsSummary,
    },
    judges: competition.judges.map((judge) => ({
      name: judge.name,
      code: judge.code,
    })),
    companies: competition.companies.map((company) => ({
      name: company.name,
      presenter: company.presenter,
    })),
    categories: competition.categories.map((category) => ({
      name: category.name,
      weight: category.weight,
    })),
    winner: winnerFromRankings(rankings),
    finalSubmissionCount: competition.sessions.filter((session) => session.status === "FINAL").length,
    rankings: rankings.map(({ rank, companyName, finalScore, judgeCount }) => ({
      rank,
      companyName,
      finalScore,
      judgeCount,
    })),
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if (authResult.response) {
    return authResult.response;
  }

  const { id } = await context.params;

  const competition = await prisma.competition.findUnique({
    where: { id },
    select: { id: true, name: true, isActive: true },
  });

  if (!competition) {
    return NextResponse.json({ error: "Competition not found." }, { status: 404 });
  }

  if (competition.isActive) {
    return NextResponse.json({ error: "The active competition cannot be deleted." }, { status: 400 });
  }

  await prisma.competition.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true, deletedCompetitionId: id, deletedCompetitionName: competition.name });
}

export async function POST(_request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if (authResult.response) {
    return authResult.response;
  }

  const { id } = await context.params;

  const competition = await prisma.competition.findUnique({
    where: { id },
    select: { id: true, name: true, isActive: true },
  });

  if (!competition) {
    return NextResponse.json({ error: "Competition not found." }, { status: 404 });
  }

  if (competition.isActive) {
    return NextResponse.json({
      ok: true,
      activatedCompetitionId: id,
      activatedCompetitionName: competition.name,
    });
  }

  if (await archivedCompetitionMatchesActive(id)) {
    return NextResponse.json({ error: "This competition cannot be made live due to current active competition sharing identical name." }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.competition.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    }),
    prisma.competition.update({
      where: { id },
      data: { isActive: true },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    activatedCompetitionId: id,
    activatedCompetitionName: competition.name,
  });
}
