import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { saltAndHashPassword } from "@/utils/password";

export class JudgeLoginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JudgeLoginError";
  }
}

type ExistingJudge = { id: string; username: string };
type PayloadJudge = { id?: string; name?: string; username?: string | null };

type JudgeDb = Prisma.TransactionClient | typeof prisma;

export function sortJudgesByUsername<T extends { username: string }>(judges: T[]) {
  return [...judges].sort((a, b) => a.username.localeCompare(b.username, undefined, { numeric: true }));
}

async function sharedJudgePasswordHash(db: JudgeDb = prisma) {
  const existing = await db.user.findFirst({
    where: { role: "JUDGE" },
    select: { passwordHash: true },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing.passwordHash;

  const password = process.env.JUDGE_PASSWORD;
  if (!password) {
    throw new JudgeLoginError("Set JUDGE_PASSWORD before creating a judge login.");
  }
  return saltAndHashPassword(password);
}

export async function ensureJudgeLogins(usernames: string[]) {
  const unique = [...new Set(usernames.map((username) => username.trim()).filter(Boolean))];
  if (unique.length === 0) return;

  const existing = await prisma.user.findMany({
    where: { username: { in: unique } },
    select: { username: true, role: true },
  });
  const byName = new Map(existing.map((user) => [user.username, user]));

  for (const username of unique) {
    const match = byName.get(username);
    if (match && match.role !== "JUDGE") {
      throw new JudgeLoginError(`Username "${username}" is already used by an admin account.`);
    }
  }

  const missing = unique.filter((username) => !byName.has(username));
  if (missing.length === 0) return;

  const passwordHash = await sharedJudgePasswordHash();
  await prisma.user.createMany({
    data: missing.map((username) => ({
      username,
      passwordHash,
      role: "JUDGE" as const,
    })),
  });
}

async function syncRenamedLogins(
  tx: Prisma.TransactionClient,
  renames: Array<{ previousUsername: string; username: string }>,
  passwordHash: string,
) {
  const moves: Array<{ userId: string; username: string }> = [];
  const creates: string[] = [];

  for (const rename of renames) {
    const stillOnPrevious = await tx.judge.findFirst({
      where: { username: rename.previousUsername },
      select: { id: true },
    });
    const previous = await tx.user.findUnique({ where: { username: rename.previousUsername } });

    if (stillOnPrevious || previous?.role !== "JUDGE") {
      creates.push(rename.username);
      continue;
    }

    await tx.user.update({
      where: { id: previous.id },
      data: { username: `__tmp_${previous.id}` },
    });
    moves.push({ userId: previous.id, username: rename.username });
  }

  for (const move of moves) {
    const taken = await tx.user.findUnique({ where: { username: move.username } });
    if (taken && taken.role !== "JUDGE") {
      throw new JudgeLoginError(`Username "${move.username}" is already used by an admin account.`);
    }
    if (taken) {
      throw new JudgeLoginError(`Username "${move.username}" is already used.`);
    }
    await tx.user.update({
      where: { id: move.userId },
      data: { username: move.username },
    });
  }

  for (const username of creates) {
    const existing = await tx.user.findUnique({ where: { username } });
    if (existing && existing.role !== "JUDGE") {
      throw new JudgeLoginError(`Username "${username}" is already used by an admin account.`);
    }
    if (!existing) {
      await tx.user.create({
        data: { username, passwordHash, role: "JUDGE" },
      });
    }
  }
}

export async function syncCompetitionJudges(
  competitionId: string,
  existingJudges: ExistingJudge[],
  payloadJudges: PayloadJudge[],
) {
  if (payloadJudges.length === 0) {
    throw new JudgeLoginError("At least one judge is required.");
  }

  if (payloadJudges.some((judge) => !judge.name?.trim())) {
    throw new JudgeLoginError("All judges must have a name.");
  }

  const names = payloadJudges.map((judge) => judge.name!.trim().toLowerCase());
  if (new Set(names).size !== names.length) {
    throw new JudgeLoginError("Judge names cannot be identical. Please try again.");
  }

  const existingById = new Map(existingJudges.map((judge) => [judge.id, judge]));
  const planned = payloadJudges.map((judge) => {
    const existing = judge.id ? existingById.get(judge.id) : undefined;
    const isNew = !existing || !judge.id || judge.id.startsWith("new-");
    const requestedUsername = judge.username?.trim() ?? "";
    const username = isNew ? requestedUsername : requestedUsername || existing?.username || "";
    return {
      id: existing && !judge.id?.startsWith("new-") ? existing.id : undefined,
      name: judge.name!.trim(),
      username,
      previousUsername: existing?.username,
      isNew,
    };
  });

  if (planned.some((judge) => !judge.username)) {
    throw new JudgeLoginError("All judges must have a username.");
  }

  if (planned.some((judge) => /\s/.test(judge.username) || judge.username.length > 64)) {
    throw new JudgeLoginError("Usernames cannot contain spaces and must be 64 characters or fewer.");
  }

  const usernameKeys = planned.map((judge) => judge.username.toLowerCase());
  if (new Set(usernameKeys).size !== usernameKeys.length) {
    throw new JudgeLoginError("Usernames must be unique.");
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { username: true },
  });
  const adminNames = new Set(admins.map((admin) => admin.username.toLowerCase()));
  const takenByAdmin = planned.find((judge) => adminNames.has(judge.username.toLowerCase()));
  if (takenByAdmin) {
    throw new JudgeLoginError(`Username "${takenByAdmin.username}" is already used by an admin account.`);
  }

  const keptIds = new Set(planned.map((judge) => judge.id).filter((id): id is string => Boolean(id)));
  const judgesToDelete = existingJudges.filter((judge) => !keptIds.has(judge.id));
  const existingLogins = await prisma.user.findMany({
    where: { username: { in: planned.map((judge) => judge.username) } },
    select: { username: true },
  });
  const loginNames = new Set(existingLogins.map((user) => user.username));
  const needsLogin =
    planned.some((judge) => judge.isNew) ||
    planned.some((judge) => !judge.isNew && judge.previousUsername !== judge.username) ||
    planned.some((judge) => !loginNames.has(judge.username));
  const passwordHash = needsLogin ? await sharedJudgePasswordHash() : null;

  await prisma.$transaction(async (tx) => {
    if (judgesToDelete.length > 0) {
      const deletedUsernames = judgesToDelete.map((judge) => judge.username);
      await tx.judge.deleteMany({
        where: { id: { in: judgesToDelete.map((judge) => judge.id) }, competitionId },
      });
      const stillUsed = await tx.judge.findMany({
        where: { username: { in: deletedUsernames } },
        select: { username: true },
      });
      const stillUsedNames = new Set(stillUsed.map((judge) => judge.username));
      const loginsToDelete = deletedUsernames.filter((username) => !stillUsedNames.has(username));
      if (loginsToDelete.length > 0) {
        await tx.user.deleteMany({
          where: { role: "JUDGE", username: { in: loginsToDelete } },
        });
      }
    }

    const kept = planned.filter((judge) => !judge.isNew && judge.id);
    for (const judge of kept) {
      await tx.judge.updateMany({
        where: { id: judge.id, competitionId },
        data: { name: `__tmp_${judge.id}`, username: `__tmp_${judge.id}` },
      });
    }
    for (const judge of kept) {
      await tx.judge.updateMany({
        where: { id: judge.id, competitionId },
        data: { name: judge.name, username: judge.username },
      });
    }

    if (passwordHash) {
      await syncRenamedLogins(
        tx,
        kept
          .filter((judge) => judge.previousUsername && judge.previousUsername !== judge.username)
          .map((judge) => ({
            previousUsername: judge.previousUsername!,
            username: judge.username,
          })),
        passwordHash,
      );
    }

    for (const judge of planned.filter((item) => item.isNew)) {
      await tx.judge.create({
        data: {
          competitionId,
          name: judge.name,
          username: judge.username,
        },
      });

      const login = await tx.user.findUnique({ where: { username: judge.username } });
      if (login) {
        if (login.role !== "JUDGE") {
          throw new JudgeLoginError(`Username "${judge.username}" is already used by an admin account.`);
        }
        continue;
      }

      await tx.user.create({
        data: {
          username: judge.username,
          passwordHash: passwordHash!,
          role: "JUDGE",
        },
      });
    }

    if (passwordHash) {
      for (const judge of planned) {
        const login = await tx.user.findUnique({ where: { username: judge.username } });
        if (login && login.role !== "JUDGE") {
          throw new JudgeLoginError(`Username "${judge.username}" is already used by an admin account.`);
        }
        if (!login) {
          await tx.user.create({
            data: { username: judge.username, passwordHash, role: "JUDGE" },
          });
        }
      }
    }
  });
}
