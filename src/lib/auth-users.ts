import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/utils/password";

export type UserRole = "ADMIN" | "JUDGE";

export type AuthUser = {
  id: string;
  name: string;
  role: UserRole;
  judgeId: string | null;
};

export async function resolveJudgeIdForUsername(username: string) {
  const judge = await prisma.judge.findFirst({
    where: { username, competition: { isActive: true } },
    select: { id: true },
  });
  return judge?.id ?? null;
}

export async function getUserFromDb(
  username: string,
  password: string,
): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return null;
  }

  if (user.role === "ADMIN") {
    return {
      id: user.id,
      name: user.username,
      role: user.role,
      judgeId: null,
    };
  }

  const judgeId = await resolveJudgeIdForUsername(user.username);
  if (!judgeId) {
    return null;
  }

  return {
    id: user.id,
    name: user.username,
    role: user.role,
    judgeId,
  };
}
