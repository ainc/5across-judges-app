import { NextResponse } from "next/server";
import { getCompetitionResults } from "@/lib/competition-results";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

export async function POST() {
  const authResult = await requireAdmin();
  if (authResult.response) {
    return authResult.response;
  }

  const current = await prisma.competition.findFirst({
    where: { isActive: true },
  });

  if (!current) {
    return NextResponse.json({ error: "No active competition found." }, { status: 404 });
  }

  const results = await getCompetitionResults(current.id);
  if (!results) {
    return NextResponse.json({ error: "Unable to compute results." }, { status: 500 });
  }

  await prisma.competition.update({
    where: { id: current.id },
    data: {
      isActive: false,
      resultsSummary: results.resultsSummary,
    },
  });

  return NextResponse.json({
    ok: true,
    archivedCompetitionId: current.id,
    archivedCompetitionName: current.name,
  });
}
