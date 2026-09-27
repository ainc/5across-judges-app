import { NextResponse } from "next/server";
import { DEFAULT_CATEGORIES, DEFAULT_COMPANIES, DEFAULT_JUDGES } from "@/lib/competition-config";
import { parseEventDate } from "@/lib/competition-results";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.response) {
    return authResult.response;
  }

  const active = await prisma.competition.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
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

  const categories =
    latestArchived?.categories.length
      ? latestArchived.categories.map((category) => ({
          name: category.name,
          weight: category.weight,
          maxScore: category.maxScore,
        }))
      : DEFAULT_CATEGORIES.map((category) => ({ ...category }));

  const eventDate = payload.eventDate
    ? (parseEventDate(String(payload.eventDate)) ?? new Date())
    : latestArchived
      ? new Date(latestArchived.eventDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      : new Date();

  const nextCompetition = await prisma.competition.create({
    data: {
      name: payload.nextName ?? "5 Across",
      eventDate,
      isActive: true,
      judgeMessage: latestArchived?.judgeMessage ?? null,
      judges: {
        create: DEFAULT_JUDGES.map((judge) => ({ ...judge })),
      },
      companies: {
        create: DEFAULT_COMPANIES.map((company) => ({ ...company })),
      },
      categories: {
        create: categories,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    nextCompetitionId: nextCompetition.id,
    nextCompetitionName: nextCompetition.name,
  });
}
