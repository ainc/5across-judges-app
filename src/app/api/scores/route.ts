import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireScorer } from "@/lib/require-auth";
import { getMissingCells, normalizeScore } from "@/lib/scoring";

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

  const [session, scores, notes] = await Promise.all([
    prisma.submissionSession.findUnique({
      where: { competitionId_judgeId: { competitionId, judgeId } },
    }),
    prisma.score.findMany({
      where: { competitionId, judgeId },
      select: { companyId: true, categoryId: true, score: true },
    }),
    prisma.judgeNote.findMany({
      where: { competitionId, judgeId },
      select: { companyId: true, categoryId: true, body: true },
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
    notes,
  });
}

const scorePayloadSchema = z.object({
  competitionId: z.string().min(1),
  judgeId: z.string().min(1),
  isFinal: z.boolean(),
  companyId: z.string().min(1).optional(),
  notesOnly: z.boolean().optional(),
  entries: z.array(
    z.object({
      companyId: z.string().min(1),
      categoryId: z.string().min(1),
      score: z.number().finite().transform(normalizeScore),
    }),
  ),
  notes: z
    .array(
      z.object({
        companyId: z.string().min(1),
        categoryId: z.string().min(1),
        body: z.string(),
      }),
    )
    .optional(),
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

  const { competitionId, judgeId, isFinal, companyId, notesOnly, entries, notes } = payload.data;

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

  if (notes) {
    const invalidNote = notes.find(
      (note) => !allowedCompanyIds.has(note.companyId) || !allowedCategoryIds.has(note.categoryId),
    );
    if (invalidNote) {
      return NextResponse.json({ error: "Payload contains invalid company or category ids in notes." }, { status: 400 });
    }
  }

  async function saveNotes() {
    if (!notes?.length) return;
    const now = new Date();
    const rows = notes.map(
      (note) => Prisma.sql`(
        ${crypto.randomUUID()},
        ${competitionId},
        ${judgeId},
        ${note.companyId},
        ${note.categoryId},
        ${note.body},
        ${now},
        ${now}
      )`,
    );
    await prisma.$executeRaw`
      INSERT INTO "JudgeNote" (
        "id",
        "competitionId",
        "judgeId",
        "companyId",
        "categoryId",
        "body",
        "createdAt",
        "updatedAt"
      )
      VALUES ${Prisma.join(rows)}
      ON CONFLICT ("competitionId", "judgeId", "companyId", "categoryId")
      DO UPDATE SET
        "body" = EXCLUDED."body",
        "updatedAt" = EXCLUDED."updatedAt"
    `;
  }

  if (notesOnly) {
    await saveNotes();
    const session = await prisma.submissionSession.findUnique({
      where: { competitionId_judgeId: { competitionId, judgeId } },
    });
    return NextResponse.json({
      sessionId: session?.id ?? null,
      status: session?.status ?? null,
      submittedAt: session?.submittedAt ?? null,
      updatedAt: session?.updatedAt ?? null,
      notesOnly: true,
    });
  }

  const uniqueEntries = new Map(entries.map((entry) => [`${entry.companyId}:${entry.categoryId}`, entry]));
  const dedupedEntries = Array.from(uniqueEntries.values());

  if (isFinal) {
    if (!companyId || !allowedCompanyIds.has(companyId)) {
      return NextResponse.json({ error: "Company submit requires a valid company." }, { status: 400 });
    }

    const missingCells = getMissingCells(
      [companyId],
      competition.categories.map((category) => category.id),
      dedupedEntries.filter((entry) => entry.companyId === companyId),
    );

    if (missingCells.length > 0) {
      return NextResponse.json(
        {
          error: "Company submit requires every category score.",
          missingCells,
        },
        { status: 400 },
      );
    }
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
      status: "DRAFT",
      submittedAt: null,
    },
    update: {
      updatedAt: new Date(),
    },
  });

  if (dedupedEntries.length > 0) {
    const now = new Date();
    const rows = dedupedEntries.map((entry) => {
      const publish = isFinal && entry.companyId === companyId;
      return Prisma.sql`(
        ${crypto.randomUUID()},
        ${competitionId},
        ${judgeId},
        ${entry.companyId},
        ${entry.categoryId},
        ${session.id},
        ${entry.score},
        ${publish ? entry.score : null},
        ${now},
        ${now}
      )`;
    });
    await prisma.$executeRaw`
      INSERT INTO "Score" (
        "id",
        "competitionId",
        "judgeId",
        "companyId",
        "categoryId",
        "sessionId",
        "score",
        "publishedScore",
        "createdAt",
        "updatedAt"
      )
      VALUES ${Prisma.join(rows)}
      ON CONFLICT ("competitionId", "judgeId", "companyId", "categoryId")
      DO UPDATE SET
        "sessionId" = EXCLUDED."sessionId",
        "score" = EXCLUDED."score",
        "publishedScore" = CASE
          WHEN EXCLUDED."publishedScore" IS NOT NULL THEN EXCLUDED."publishedScore"
          ELSE "Score"."publishedScore"
        END,
        "updatedAt" = EXCLUDED."updatedAt"
    `;
  }

  await saveNotes();

  return NextResponse.json({
    sessionId: session.id,
    status: session.status,
    submittedAt: session.submittedAt,
    updatedAt: session.updatedAt,
  });
}
