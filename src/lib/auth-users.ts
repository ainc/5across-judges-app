import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/utils/password";

export type UserRole = "ADMIN" | "JUDGE";

export type AuthUser = {
  id: string;
  name: string;
  role: UserRole;
  judgeId: string | null;
};

type StoredUser = {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  judgeCode: string | null;
};

type UserModel = {
  findUnique: (args: { where: { username: string } }) => Promise<StoredUser | null>;
};

async function findUserByUsername(username: string) {
  return (prisma as unknown as { user: UserModel }).user.findUnique({ where: { username } });
}

/** Seed login slots (judge1/2/3) → judge order when codes no longer match. */
export const JUDGE_LOGIN_SLOTS: Record<string, number> = {
  JA: 0,
  JB: 1,
  JC: 2,
  "1": 0,
  "2": 1,
  "3": 2,
};

function sortJudgesByCreatedAt<T extends { id: string; createdAt: Date }>(judges: T[]) {
  return [...judges].sort((a, b) => {
    const byTime = a.createdAt.getTime() - b.createdAt.getTime();
    return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
  });
}

export async function withJudgeUsernames<
  T extends { id: string; code: string | null; createdAt: Date },
>(judges: T[]) {
  const users = await (prisma as unknown as {
    user: {
      findMany: (args: {
        where: { role: "JUDGE" };
        select: { username: true; judgeCode: true };
        orderBy: { username: "asc" };
      }) => Promise<Array<{ username: string; judgeCode: string | null }>>;
    };
  }).user.findMany({
    where: { role: "JUDGE" },
    select: { username: true, judgeCode: true },
    orderBy: { username: "asc" },
  });

  const ordered = sortJudgesByCreatedAt(judges);

  const withUsernames = ordered.map((judge, index) => {
    const byCode = judge.code
      ? users.find((user) => user.judgeCode === judge.code)
      : undefined;
    const bySlot = users.find((user) =>
      user.judgeCode ? JUDGE_LOGIN_SLOTS[user.judgeCode] === index : false,
    );

    return {
      ...judge,
      username: byCode?.username ?? bySlot?.username ?? null,
    };
  });

  return withUsernames
    .sort((a, b) => {
      if (a.username && b.username) {
        return a.username.localeCompare(b.username, undefined, { numeric: true });
      }
      if (a.username) return -1;
      if (b.username) return 1;
      return 0;
    })
    .map(({ username: _username, ...judge }) => judge);
}

export async function resolveJudgeIdForCode(judgeCode: string) {
  const competition = await prisma.competition.findFirst({
    where: { isActive: true },
    include: { judges: true },
  });

  if (!competition) {
    return null;
  }

  const ordered = sortJudgesByCreatedAt(competition.judges);

  const byCode = ordered.find((entry) => entry.code === judgeCode);
  if (byCode) {
    return byCode.id;
  }

  // Fallback: JA/JB/JC (or 1/2/3) map to 1st/2nd/3rd judge so renames still allow judge1/2/3 login.
  const slot = JUDGE_LOGIN_SLOTS[judgeCode];
  if (slot === undefined) {
    return null;
  }

  return ordered[slot]?.id ?? null;
}

export async function getUserFromDb(
  username: string,
  password: string,
): Promise<AuthUser | null> {
  const user = await findUserByUsername(username);

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

  if (!user.judgeCode) {
    return null;
  }

  const judgeId = await resolveJudgeIdForCode(user.judgeCode);
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
