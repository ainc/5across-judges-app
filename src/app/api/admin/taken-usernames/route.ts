import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";
import { usernameKey } from "@/lib/judge-usernames";

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.response) {
    return authResult.response;
  }

  const [users, previousJudges] = await Promise.all([
    prisma.user.findMany({ select: { username: true } }),
    prisma.previousJudge.findMany({ where: { hidden: false }, select: { username: true } }),
  ]);

  const usernames = [
    ...new Set(
      [...users, ...previousJudges].map((entry) => entry.username.trim()).filter(Boolean),
    ),
  ].sort((a, b) => usernameKey(a).localeCompare(usernameKey(b)));

  return NextResponse.json({ usernames });
}
