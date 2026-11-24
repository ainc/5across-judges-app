import { NextResponse } from "next/server";
import { DEFAULT_CATEGORIES } from "@/lib/competition-config";
import { getCompetitionResults } from "@/lib/competition-results";
import { JudgeLoginError } from "@/lib/judge-logins";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";
import { createLiveCompetition } from "@/lib/start-competition";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST() {
  const authResult = await requireAdmin();
  if (authResult.response) {
    return authResult.response;
  }

  const current = await prisma.competition.findFirst({
    where: { isActive: true },
    include: { categories: { orderBy: { createdAt: "asc" } } },
  });

  if (!current) {
    return NextResponse.json({ error: "No active competition found." }, { status: 404 });
  }

  const results = await getCompetitionResults(current.id);
  if (!results) {
    return NextResponse.json({ error: "Unable to compute results." }, { status: 500 });
  }

  const categories = current.categories.length
    ? current.categories.map((category) => ({
        name: category.name,
        description: category.description,
        weight: category.weight,
        maxScore: category.maxScore,
      }))
    : DEFAULT_CATEGORIES.map((category) => ({ ...category }));

  await prisma.competition.update({
    where: { id: current.id },
    data: {
      isActive: false,
      resultsSummary: results.resultsSummary,
    },
  });

  try {
    const next = await createLiveCompetition({
      name: current.name,
      eventDate: new Date(current.eventDate.getTime() + WEEK_MS),
      judgeMessage: current.judgeMessage,
      categories,
    });

    return NextResponse.json({
      ok: true,
      archivedCompetitionId: current.id,
      archivedCompetitionName: current.name,
      nextCompetitionId: next.id,
      nextCompetitionName: next.name,
    });
  } catch (error) {
    await prisma.competition.update({
      where: { id: current.id },
      data: { isActive: true },
    });
    if (error instanceof JudgeLoginError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
