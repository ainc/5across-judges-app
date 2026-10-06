import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireScorer } from "@/lib/require-auth";

export async function PUT(request: Request) {
  const authResult = await requireScorer();
  if (authResult.response) {
    return authResult.response;
  }

  const payload = await request.json();
  const judgeId = String(payload.judgeId ?? "");
  if (!judgeId) {
    return NextResponse.json({ error: "Judge is required." }, { status: 400 });
  }

  const session = authResult.session;
  if (session?.user.role !== "ADMIN" && judgeId !== session?.user.judgeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const competition = await prisma.competition.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  });
  if (!competition) {
    return NextResponse.json({ error: "No active competition found." }, { status: 404 });
  }

  const judge = await prisma.judge.findFirst({
    where: { id: judgeId, competitionId: competition.id },
  });
  if (!judge) {
    return NextResponse.json({ error: "Judge not found." }, { status: 404 });
  }

  try {
    const updatedJudge = await prisma.judge.update({
      where: { id: judgeId },
      data: { message: null },
    });

    await prisma.competition.update({
      where: { id: competition.id },
      data: { name: competition.name },
    });

    return NextResponse.json({ ok: true, judge: updatedJudge });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to delete message." }, { status: 500 });
  }
}
