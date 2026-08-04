import { prisma } from "@/lib/prisma";

export async function copyCompetitionToArchive(sourceId: string) {
  const source = await prisma.competition.findUnique({
    where: { id: sourceId },
    include: {
      judges: true,
      companies: true,
      categories: true,
      sessions: true,
      scores: true,
    },
  });

  if (!source) {
    throw new Error("Competition not found.");
  }

  return prisma.$transaction(async (tx) => {
    const archived = await tx.competition.create({
      data: {
        name: source.name,
        eventDate: source.eventDate,
        isActive: false,
        judgeMessage: source.judgeMessage,
        resultsSummary: source.resultsSummary,
        judges: {
          create: source.judges.map((judge) => ({
            name: judge.name,
            code: judge.code,
            message: judge.message,
          })),
        },
        companies: {
          create: source.companies.map((company) => ({
            name: company.name,
            presenter: company.presenter,
          })),
        },
        categories: {
          create: source.categories.map((category) => ({
            name: category.name,
            weight: category.weight,
            maxScore: category.maxScore,
          })),
        },
      },
      include: {
        judges: true,
        companies: true,
        categories: true,
      },
    });

    const judgeIdByName = new Map(archived.judges.map((judge) => [judge.name, judge.id]));
    const companyIdByName = new Map(archived.companies.map((company) => [company.name, company.id]));
    const categoryIdByName = new Map(archived.categories.map((category) => [category.name, category.id]));

    const judgeNameById = new Map(source.judges.map((judge) => [judge.id, judge.name]));
    const companyNameById = new Map(source.companies.map((company) => [company.id, company.name]));
    const categoryNameById = new Map(source.categories.map((category) => [category.id, category.name]));

    const sessionIdMap = new Map<string, string>();

    for (const session of source.sessions) {
      const judgeName = judgeNameById.get(session.judgeId);
      const newJudgeId = judgeName ? judgeIdByName.get(judgeName) : undefined;
      if (!newJudgeId) continue;

      const newSession = await tx.submissionSession.create({
        data: {
          competitionId: archived.id,
          judgeId: newJudgeId,
          status: session.status,
          submittedAt: session.submittedAt,
        },
      });
      sessionIdMap.set(session.id, newSession.id);
    }

    for (const score of source.scores) {
      const judgeName = judgeNameById.get(score.judgeId);
      const companyName = companyNameById.get(score.companyId);
      const categoryName = categoryNameById.get(score.categoryId);
      const newSessionId = sessionIdMap.get(score.sessionId);
      if (!judgeName || !companyName || !categoryName || !newSessionId) continue;

      const newJudgeId = judgeIdByName.get(judgeName);
      const newCompanyId = companyIdByName.get(companyName);
      const newCategoryId = categoryIdByName.get(categoryName);
      if (!newJudgeId || !newCompanyId || !newCategoryId) continue;

      await tx.score.create({
        data: {
          competitionId: archived.id,
          judgeId: newJudgeId,
          companyId: newCompanyId,
          categoryId: newCategoryId,
          sessionId: newSessionId,
          score: score.score,
        },
      });
    }

    return archived;
  });
}

export async function archivedCompetitionMatchesActive(archivedId: string): Promise<boolean> {
  const [archived, active] = await Promise.all([
    prisma.competition.findUnique({
      where: { id: archivedId },
      select: { name: true },
    }),
    prisma.competition.findFirst({
      where: { isActive: true },
      select: { name: true },
    }),
  ]);

  if (!archived || !active) return false;

  return archived.name.trim() === active.name.trim();
}
