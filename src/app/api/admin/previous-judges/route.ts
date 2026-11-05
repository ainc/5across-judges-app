import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.response) {
    return authResult.response;
  }

  const judges = await prisma.previousJudge.findMany({
    where: { hidden: false },
    select: { id: true, name: true, username: true },
    orderBy: [{ name: "asc" }, { username: "asc" }],
  });

  return NextResponse.json({ judges });
}
