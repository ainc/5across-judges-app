import { NextResponse } from "next/server";
import { DEFAULT_CATEGORIES } from "@/lib/competition-config";
import { JudgeLoginError } from "@/lib/judge-logins";
import { parseEventDate } from "@/lib/competition-results";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";
import { createLiveCompetition } from "@/lib/start-competition";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.response) {
    return authResult.response;
  }

  const active = await prisma.competition.findFirst({
    where: { isActive: true },
    select: { id: true },
  });

  if (active) {
    return NextResponse.json(
      { error: "End the current competition before starting a new one." },
      { status: 409 },
    );
  }

  const payload = await request.json();
  const latestArchived = await prisma.competition.findFirst({
    where: { isActive: false },
    include: { categories: { orderBy: { createdAt: "asc" } } },
    orderBy: { eventDate: "desc" },
  });

  const categories = latestArchived?.categories.length
    ? latestArchived.categories.map((category) => ({
        name: category.name,
        description: category.description,
        weight: category.weight,
        maxScore: category.maxScore,
      }))
    : DEFAULT_CATEGORIES.map((category) => ({ ...category }));

  const eventDate = payload.eventDate
    ? (parseEventDate(String(payload.eventDate)) ?? new Date())
    : latestArchived
      ? new Date(latestArchived.eventDate.getTime() + WEEK_MS)
      : new Date();

  try {
    const nextCompetition = await createLiveCompetition({
      name: payload.nextName ?? "5 Across",
      eventDate,
      judgeMessage: latestArchived?.judgeMessage ?? null,
      categories,
    });

    return NextResponse.json({
      ok: true,
      nextCompetitionId: nextCompetition.id,
      nextCompetitionName: nextCompetition.name,
    });
  } catch (error) {
    if (error instanceof JudgeLoginError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
