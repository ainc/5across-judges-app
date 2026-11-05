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
  const existing = await prisma.previousJudge.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "Previous judge not found." }, { status: 404 });
  }

  await prisma.previousJudge.update({
    where: { id },
    data: { hidden: true },
  });

  return NextResponse.json({ ok: true });
}
