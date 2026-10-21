import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { parseEventDate } from "@/lib/competition-results";
import { JudgeLoginError, sortJudgesByUsername, syncCompetitionJudges } from "@/lib/judge-logins";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.response) {
    return authResult.response;
  }

  const competition = await prisma.competition.findFirst({
    where: { isActive: true },
    include: {
      judges: { orderBy: { createdAt: "asc" } },
      companies: { orderBy: { createdAt: "asc" } },
      categories: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!competition) {
    return NextResponse.json({ error: "No active competition found." }, { status: 404 });
  }

  const judges = sortJudgesByUsername(competition.judges);

  return NextResponse.json({
    competition,
    judges,
    companies: competition.companies,
    categories: competition.categories,
  });
}

export async function PUT(request: Request) {
  const authResult = await requireAdmin();
  if (authResult.response) {
    return authResult.response;
  }

  try {
  const payload = await request.json();
  const competition = await prisma.competition.findFirst({
    where: { isActive: true },
    include: { judges: true, companies: true, categories: true },
  });

  if (!competition) {
    return NextResponse.json({ error: "No active competition found." }, { status: 404 });
  }

  const categories = payload.categories ?? [];
  const weightTotal = categories.reduce((sum: number, category: { weight?: number }) => sum + (category.weight ?? 0), 0);
  if ("categories" in payload && categories.length > 0 && weightTotal !== 100) {
    return NextResponse.json(
      { error: `Category weights must total 100% (currently ${weightTotal}%).` },
      { status: 400 },
    );
  }

  const updated = await prisma.competition.update({
    where: { id: competition.id },
    data: {
      name: payload.name ?? competition.name,
      eventDate: payload.eventDate
        ? (parseEventDate(String(payload.eventDate)) ?? competition.eventDate)
        : competition.eventDate,
      judgeMessage:
        payload.judgeMessage !== undefined ? payload.judgeMessage : competition.judgeMessage,
      resultsSummary:
        payload.resultsSummary !== undefined ? payload.resultsSummary : competition.resultsSummary,
    },
  });

  if ("judges" in payload) {
    const payloadJudges: Array<{ id?: string; name?: string; username?: string | null }> = payload.judges ?? [];
    await syncCompetitionJudges(competition.id, competition.judges, payloadJudges);
  }

  if ("companies" in payload) {
    const payloadCompanies: Array<{
      id?: string;
      name?: string;
      presenter?: string | null;
    }> = payload.companies ?? [];

    if (payloadCompanies.some((company) => company.id && !company.name?.trim())) {
      return NextResponse.json({ error: "All companies must have a name." }, { status: 400 });
    }

    const companyNames = payloadCompanies
      .filter((company) => company.id)
      .map((company) => company.name!.trim().toLowerCase());
    if (new Set(companyNames).size !== companyNames.length) {
      return NextResponse.json(
        { error: "Company names cannot be identical. Please try again." },
        { status: 400 },
      );
    }

    // Two-phase rename avoids unique (competitionId, name) collisions when swapping names.
    for (const company of payloadCompanies) {
      if (!company.id) continue;
      await prisma.company.updateMany({
        where: { id: company.id, competitionId: competition.id },
        data: { name: `__tmp_${company.id}` },
      });
    }

    for (const company of payloadCompanies) {
      if (!company.id) continue;
      await prisma.company.updateMany({
        where: { id: company.id, competitionId: competition.id },
        data: {
          name: company.name!.trim(),
          presenter:
            company.presenter === undefined
              ? undefined
              : company.presenter?.trim()
                ? String(company.presenter).trim()
                : null,
        },
      });
    }
  }

  if ("categories" in payload) {
    const payloadCategories: Array<{
      id?: string;
      name?: string;
      description?: string;
      weight?: number;
      maxScore?: number;
    }> = payload.categories ?? [];

    if (payloadCategories.length === 0) {
      return NextResponse.json({ error: "At least one scoring criterion is required." }, { status: 400 });
    }

    if (payloadCategories.some((category) => !category.name?.trim())) {
      return NextResponse.json({ error: "All scoring criteria must have a name." }, { status: 400 });
    }

    const payloadCategoryIds = new Set(
      payloadCategories.map((category) => category.id).filter((id): id is string => Boolean(id)),
    );

    const categoriesToDelete = competition.categories.filter((category) => !payloadCategoryIds.has(category.id));
    if (categoriesToDelete.length > 0) {
      await prisma.category.deleteMany({
        where: { id: { in: categoriesToDelete.map((category) => category.id) }, competitionId: competition.id },
      });
    }

    for (const category of payloadCategories) {
      const name = category.name!.trim();
      const description = category.description?.trim() ?? "";
      const isNew =
        !category.id ||
        category.id.startsWith("new-") ||
        !competition.categories.some((item) => item.id === category.id);

      if (isNew) {
        await prisma.category.create({
          data: {
            competitionId: competition.id,
            name,
            description,
            weight: typeof category.weight === "number" ? category.weight : 0,
            maxScore: typeof category.maxScore === "number" ? category.maxScore : 5,
          },
        });
        continue;
      }

      await prisma.category.updateMany({
        where: { id: category.id, competitionId: competition.id },
        data: {
          name,
          description,
          weight: typeof category.weight === "number" ? category.weight : undefined,
          maxScore: typeof category.maxScore === "number" ? category.maxScore : undefined,
        },
      });
    }
  }

  if ("judges" in payload || "categories" in payload) {
    await prisma.competition.update({
      where: { id: competition.id },
      data: { name: updated.name },
    });
  }

  const refreshed = await prisma.competition.findUnique({
    where: { id: competition.id },
    include: {
      judges: { orderBy: { createdAt: "asc" } },
      companies: { orderBy: { createdAt: "asc" } },
      categories: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!refreshed) {
    return NextResponse.json({ error: "Unable to reload competition." }, { status: 500 });
  }

  const judges = sortJudgesByUsername(refreshed.judges);

  return NextResponse.json({
    ok: true,
    competition: refreshed,
    judges,
    companies: refreshed.companies,
    categories: refreshed.categories,
  });
  } catch (error) {
    if (error instanceof JudgeLoginError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "A judge name or username is already in use." },
        { status: 400 },
      );
    }
    console.error("Failed to save competition settings:", error);
    return NextResponse.json(
      { error: "Unable to save settings. Check for duplicate company or judge names." },
      { status: 500 },
    );
  }
}
