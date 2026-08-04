import { NextResponse } from "next/server";
import { buildCompetitionConfigRevision } from "@/lib/competition-config";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult.response) {
    return authResult.response;
  }

  const competition = await prisma.competition.findFirst({
    where: { isActive: true },
    include: {
      judges: { orderBy: { name: "asc" } },
      companies: { orderBy: { name: "asc" } },
      categories: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!competition) {
    return NextResponse.json({ error: "No active competition found." }, { status: 404 });
  }

  return NextResponse.json({
    competition: {
      id: competition.id,
      name: competition.name,
      eventDate: competition.eventDate,
      judgeMessage: competition.judgeMessage,
      updatedAt: competition.updatedAt,
    },
    configRevision: buildCompetitionConfigRevision({
      updatedAt: competition.updatedAt,
      judges: competition.judges,
      categories: competition.categories,
    }),
    judges: competition.judges,
    companies: competition.companies,
    categories: competition.categories,
  });
}
