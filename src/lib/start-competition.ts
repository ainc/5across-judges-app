import type { Prisma } from "@prisma/client";
import { DEFAULT_CATEGORIES, DEFAULT_COMPANIES, DEFAULT_JUDGES } from "@/lib/competition-config";
import { ensureJudgeLogins } from "@/lib/judge-logins";
import { prisma } from "@/lib/prisma";

type CategoryInput = {
  name: string;
  description?: string | null;
  weight: number;
  maxScore: number;
};

type CompetitionDb = Prisma.TransactionClient | typeof prisma;

export async function createLiveCompetition(
  input: {
    name: string;
    eventDate: Date;
    judgeMessage?: string | null;
    categories?: CategoryInput[];
  },
  db: CompetitionDb = prisma,
) {
  await ensureJudgeLogins(DEFAULT_JUDGES.map((judge) => judge.username));

  const categories = input.categories?.length
    ? input.categories
    : DEFAULT_CATEGORIES.map((category) => ({ ...category }));

  return db.competition.create({
    data: {
      name: input.name,
      eventDate: input.eventDate,
      isActive: true,
      judgeMessage: input.judgeMessage ?? null,
      judges: {
        create: DEFAULT_JUDGES.map((judge) => ({ ...judge })),
      },
      companies: {
        create: DEFAULT_COMPANIES.map((company) => ({ ...company })),
      },
      categories: {
        create: categories.map((category) => ({
          name: category.name,
          description: category.description ?? "",
          weight: category.weight,
          maxScore: category.maxScore,
        })),
      },
    },
  });
}
