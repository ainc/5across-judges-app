import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if (authResult.response) {
    return authResult.response;
  }

  const { id } = await context.params;
  const payload = await request.json();

  const competition = await prisma.competition.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  if (!competition) {
    return NextResponse.json({ error: "No active competition found." }, { status: 404 });
  }

  const judge = await prisma.judge.findFirst({
    where: { id, competitionId: competition.id },
  });

  if (!judge) {
    return NextResponse.json({ error: "Judge not found." }, { status: 404 });
  }

  if (payload.message !== null && payload.message !== undefined && !String(payload.message).trim()) {
    return NextResponse.json({ error: "Enter a message before sending." }, { status: 400 });
  }

  const message =
    payload.message === null || payload.message === undefined ? null : String(payload.message).trim();

  try {
    const updatedJudge = await prisma.judge.update({
      where: { id },
      data: { message },
    });

    await prisma.competition.update({
      where: { id: competition.id },
      data: { name: competition.name },
    });

    return NextResponse.json({ ok: true, judge: updatedJudge });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to save judge message." }, { status: 500 });
  }
}
