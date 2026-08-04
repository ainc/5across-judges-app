import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireScorer } from "@/lib/require-auth";
import { getMissingCells, getWeightedTotalForCompany, isScoreInRange, normalizeScore, roundScore } from "@/lib/scoring";

function canAccessJudge(
  session: { user: { role?: string; judgeId?: string | null } } | null,
  judgeId: string,
) {
  if (session?.user.role === "ADMIN") return true;
  return judgeId === session?.user.judgeId;
}

export async function GET(request: NextRequest) {
  const authResult = await requireScorer();
  if (authResult.response) {
    return authResult.response;
  }

  const competitionId = request.nextUrl.searchParams.get("competitionId");
  const judgeId = request.nextUrl.searchParams.get("judgeId");

  if (!competitionId || !judgeId) {
    return NextResponse.json({ error: "competitionId and judgeId are required." }, { status: 400 });
  }

  if (!canAccessJudge(authResult.session, judgeId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const judge = await prisma.judge.findUnique({ where: { id: judgeId } });
  if (!judge || judge.competitionId !== competitionId) {
    return NextResponse.json({ error: "Judge not found for competition." }, { status: 404 });
  }

  const [session, scores] = await Promise.all([
    prisma.submissionSession.findUnique({
      where: { competitionId_judgeId: { competitionId, judgeId } },
    }),
    prisma.score.findMany({
      where: { competitionId, judgeId },
      select: { companyId: true, categoryId: true, score: true },
    }),
  ]);

  return NextResponse.json({
    status: session?.status ?? null,
    submittedAt: session?.submittedAt ?? null,
    updatedAt: session?.updatedAt ?? null,
    entries: scores.map((entry) => ({
      companyId: entry.companyId,
      categoryId: entry.categoryId,
      score: entry.score,
    })),
  });
}

const scorePayloadSchema = z.object({
  competitionId: z.string().min(1),
  judgeId: z.string().min(1),
  isFinal: z.boolean(),
  entries: z.array(
    z.object({
      companyId: z.string().min(1),
      categoryId: z.string().min(1),
      score: z
        .number()
        .refine(isScoreInRange, { message: "Score must be between 0 and 5." })
        .transform(normalizeScore),
    }),
  ),
});

export async function POST(request: Request) {
  const authResult = await requireScorer();
  if (authResult.response) {
    return authResult.response;
  }

  const payload = scorePayloadSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const { competitionId, judgeId, isFinal, entries } = payload.data;

  if (!canAccessJudge(authResult.session, judgeId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [competition, judge] = await Promise.all([
    prisma.competition.findUnique({
      where: { id: competitionId },
      include: { companies: true, categories: true },
    }),
    prisma.judge.findUnique({ where: { id: judgeId } }),
  ]);

  if (!competition) {
    return NextResponse.json({ error: "Competition not found." }, { status: 404 });
  }

  if (!judge || judge.competitionId !== competitionId) {
    return NextResponse.json({ error: "Judge not found for competition." }, { status: 404 });
  }

  const allowedCompanyIds = new Set(competition.companies.map((company) => company.id));
  const allowedCategoryIds = new Set(competition.categories.map((category) => category.id));
  const invalidEntry = entries.find(
    (entry) => !allowedCompanyIds.has(entry.companyId) || !allowedCategoryIds.has(entry.categoryId),
  );
  if (invalidEntry) {
    return NextResponse.json({ error: "Payload contains invalid company/category ids." }, { status: 400 });
  }

  const uniqueEntries = new Map(entries.map((entry) => [`${entry.companyId}:${entry.categoryId}`, entry]));
  const dedupedEntries = Array.from(uniqueEntries.values());

  const missingCells = getMissingCells(
    competition.companies.map((company) => company.id),
    competition.categories.map((category) => category.id),
    dedupedEntries,
  );

  if (isFinal && missingCells.length > 0) {
    return NextResponse.json(
      {
        error: "Final submit requires every company/category score.",
        missingCells,
      },
      { status: 400 },
    );
  }

  const session = await prisma.submissionSession.upsert({
    where: {
      competitionId_judgeId: {
        competitionId,
        judgeId,
      },
    },
    create: {
      competitionId,
      judgeId,
      status: isFinal ? "FINAL" : "DRAFT",
      submittedAt: isFinal ? new Date() : null,
    },
    update: {
      status: isFinal ? "FINAL" : "DRAFT",
      submittedAt: isFinal ? new Date() : null,
    },
  });

  await prisma.$transaction(
    dedupedEntries.map((entry) =>
      prisma.score.upsert({
        where: {
          competitionId_judgeId_companyId_categoryId: {
            competitionId,
            judgeId,
            companyId: entry.companyId,
            categoryId: entry.categoryId,
          },
        },
        create: {
          competitionId,
          judgeId,
          companyId: entry.companyId,
          categoryId: entry.categoryId,
          sessionId: session.id,
          score: entry.score,
        },
        update: {
          sessionId: session.id,
          score: entry.score,
        },
      }),
    ),
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  const allScoresForJudge = await prisma.score.findMany({
    where: { competitionId, judgeId },
  });

  const totalsByCompany = competition.companies.map((company) => {
    const weighted = getWeightedTotalForCompany(company.id, competition.categories, allScoresForJudge);
    return {
      companyId: company.id,
      companyName: company.name,
      weightedTotal: roundScore(weighted),
    };
  });

  return NextResponse.json({
    sessionId: session.id,
    status: session.status,
    submittedAt: session.submittedAt,
    updatedAt: session.updatedAt,
    totalsByCompany,
  });
}
