import { NextResponse } from "next/server";
import { DEFAULT_COMPANIES, DEFAULT_JUDGES } from "@/lib/competition-config";
import { getCompetitionResults, parseEventDate } from "@/lib/competition-results";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.response) {
    return authResult.response;
  }

  const payload = await request.json();

  const current = await prisma.competition.findFirst({
    where: { isActive: true },
    include: {
      categories: true,
    },
  });

  if (!current) {
    return NextResponse.json({ error: "No active competition found." }, { status: 404 });
  }

  let resultsSummary = payload.resultsSummary ?? null;
  const results = await getCompetitionResults(current.id);
  if (!results) {
    return NextResponse.json({ error: "Unable to compute results." }, { status: 500 });
  }
  resultsSummary = resultsSummary ?? results.resultsSummary;

  await prisma.competition.update({
    where: { id: current.id },
    data: {
      isActive: false,
      judgeMessage: payload.judgeMessage ?? current.judgeMessage,
      resultsSummary,
    },
  });

  const nextCompetition = await prisma.competition.create({
    data: {
      name: payload.nextName ?? `${current.name} - Next Round`,
      eventDate: payload.eventDate
        ? (parseEventDate(String(payload.eventDate)) ?? current.eventDate)
        : new Date(current.eventDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
      judgeMessage: payload.judgeMessage ?? current.judgeMessage,
      resultsSummary,
      judges: {
        create: DEFAULT_JUDGES.map((judge) => ({ ...judge })),
      },
      companies: {
        create: DEFAULT_COMPANIES.map((company) => ({ ...company })),
      },
      categories: {
        create: current.categories.map((category) => ({
          name: category.name,
          weight: category.weight,
          maxScore: category.maxScore,
        })),
      },
    },
  });

  return NextResponse.json({
    ok: true,
    archivedCompetitionId: current.id,
    nextCompetitionId: nextCompetition.id,
    nextCompetitionName: nextCompetition.name,
  });
}
