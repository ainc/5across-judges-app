import { NextResponse } from "next/server";
import { DEFAULT_COMPANIES, DEFAULT_JUDGES } from "@/lib/competition-config";
import {
  buildRankings,
  parseEventDate,
  scoresFromFinalJudges,
  winnerFromRankings,
} from "@/lib/competition-results";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.response) {
    return authResult.response;
  }

  const competitions = await prisma.competition.findMany({
    where: { isActive: false },
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
      finalSubmissionCount: competition.sessions.filter((session) => session.status === "FINAL").length,
    };
  });

  return NextResponse.json({ competitions: payload });
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.response) {
    return authResult.response;
  }

  const payload = await request.json().catch(() => ({}));
  const templateId = typeof payload.templateId === "string" ? payload.templateId : undefined;
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const eventDate = payload.eventDate ? parseEventDate(String(payload.eventDate)) : new Date();

  if (!name) {
    return NextResponse.json({ error: "Competition name is required." }, { status: 400 });
  }

  if (!eventDate || Number.isNaN(eventDate.getTime())) {
    return NextResponse.json({ error: "Invalid event date." }, { status: 400 });
  }

  const template = templateId
    ? await prisma.competition.findUnique({
        where: { id: templateId },
        include: { categories: { orderBy: { createdAt: "asc" } } },
      })
    : await prisma.competition.findFirst({
        where: { isActive: true },
        include: { categories: { orderBy: { createdAt: "asc" } } },
      });

  const created = await prisma.competition.create({
    data: {
      name,
      eventDate,
      isActive: false,
      judgeMessage: null,
      judges: {
        create: DEFAULT_JUDGES.map((judge) => ({ ...judge })),
      },
      companies: {
        create: DEFAULT_COMPANIES.map((company) => ({ ...company })),
      },
      categories: {
        create: (template?.categories ?? [{ name: "Criterion 1", weight: 100, maxScore: 5 }]).map((category) => ({
          name: category.name,
          weight: category.weight,
          maxScore: category.maxScore,
        })),
      },
    },
    select: { id: true, name: true },
  });

  return NextResponse.json({
    ok: true,
    competitionId: created.id,
    competitionName: created.name,
  });
}
