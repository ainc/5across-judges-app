import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if (authResult.response) {
    return authResult.response;
  }

  const { id } = await context.params;
  const existing = await prisma.previousJudge.findUnique({
    where: { id },
    select: { id: true, name: true, username: true, usernameKey: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Previous judge not found." }, { status: 404 });
  }

  const activeJudges = await prisma.judge.findMany({
    where: { competition: { isActive: true } },
    select: { username: true },
  });
  const stillOnCompetition = activeJudges.some(
    (judge) => judge.username.trim().toLowerCase() === existing.usernameKey,
  );
  if (stillOnCompetition) {
    return NextResponse.json(
      {
        error: `"${existing.name}" (${existing.username}) is still on the current competition. Remove them in Manage Judges and save before deleting them from previous judges.`,
      },
      { status: 409 },
    );
  }

  const judgeLogins = await prisma.user.findMany({
    where: { role: "JUDGE" },
    select: { id: true, username: true },
  });
  const loginIds = judgeLogins
    .filter((login) => login.username.trim().toLowerCase() === existing.usernameKey)
    .map((login) => login.id);

  await prisma.$transaction([
    prisma.previousJudge.delete({ where: { id } }),
    ...(loginIds.length > 0 ? [prisma.user.deleteMany({ where: { id: { in: loginIds } } })] : []),
  ]);

  return NextResponse.json({ ok: true });
}
