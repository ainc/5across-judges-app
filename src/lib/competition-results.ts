import { formatWeightedTotal } from "@/lib/judging-format";
import { roundToHundredth } from "@/lib/scoring";

type CategoryRef = { name: string; weight: number };
type JudgeRef = { id: string; name: string };

export type StoredScore = {
  companyId: string;
  judgeId: string;
  score: number;
  category: CategoryRef;
  judge: JudgeRef;
};

type PublishableScore = {
  judgeId: string;
  score: number;
  publishedScore: number | null;
};

export function scoresFromFinalJudges<T extends PublishableScore>(scores: T[]): T[] {
  return scores.flatMap((entry) => {
    if (entry.publishedScore == null) return [];
    return [{ ...entry, score: entry.publishedScore }];
  });
}

export function countPublishedJudges(scores: Array<{ judgeId: string; publishedScore: number | null }>): number {
  return new Set(scores.filter((score) => score.publishedScore != null).map((score) => score.judgeId)).size;
}

export type RankingRow = {
  companyId: string;
  companyName: string;
  companyPresenter: string;
  finalScore: number;
  judgeCount: number;
  pitch: number;
  rank: number;
  byJudge: Array<{
    judgeId: string;
    judgeName: string;
    categories: Record<string, number>;
    judgeTotal: number | null;
  }>;
};

export function buildRankings(
  companies: Array<{ id: string; name: string; presenter?: string | null }>,
  judges: JudgeRef[],
  categories: CategoryRef[],
  scores: StoredScore[],
): RankingRow[] {
  const judgeIds = new Set(judges.map((judge) => judge.id));
  const categoryWeightByName = new Map(categories.map((category) => [category.name, category.weight]));

  return companies
    .map((company, index) => {
      const judgeTotals = new Map<string, number>();
      const categoryByJudge = new Map<string, Record<string, number>>();

      for (const judge of judges) {
        categoryByJudge.set(judge.id, {});
      }

      for (const score of scores.filter((item) => item.companyId === company.id)) {
        if (!judgeIds.has(score.judgeId)) continue;

        const categoryName = score.category.name;
        const weight = categoryWeightByName.get(categoryName);
        if (weight === undefined) continue;

        const weighted = score.score * (weight / 100);
        judgeTotals.set(score.judgeId, (judgeTotals.get(score.judgeId) ?? 0) + weighted);
        const current = categoryByJudge.get(score.judgeId)!;
        current[categoryName] = score.score;
      }

      for (const [judgeId, total] of judgeTotals) {
        judgeTotals.set(judgeId, roundToHundredth(total));
      }

      const totals = Array.from(judgeTotals.values());
      const finalScore =
        totals.length > 0 ? roundToHundredth(totals.reduce((sum, value) => sum + value, 0) / totals.length) : 0;

      return {
        companyId: company.id,
        companyName: company.name,
        companyPresenter: company.presenter?.trim() ?? "",
        pitch: index + 1,
        finalScore,
        judgeCount: judgeTotals.size,
        byJudge: judges.map((judge) => ({
          judgeId: judge.id,
          judgeName: judge.name,
          categories: categoryByJudge.get(judge.id) ?? {},
          judgeTotal: judgeTotals.has(judge.id) ? judgeTotals.get(judge.id)! : null,
        })),
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function winnerFromRankings(rankings: Array<{ companyName: string }>): string | null {
  return rankings[0]?.companyName ?? null;
}

export function normalizeEventDate(value: string): string | null {
  const match = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || month < 1 || month > 12 || day < 1) {
    return null;
  }

  const lastDay = new Date(year, month, 0).getDate();
  if (day > lastDay) return null;

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Parse a YYYY-MM-DD (or ISO) value as a local calendar date (noon, avoids TZ day-shift). */
export function parseEventDate(value: string | Date): Date | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0);
  }

  const normalized = normalizeEventDate(value.trim().slice(0, 10));
  if (!normalized) return null;

  const [year, month, day] = normalized.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function formatEventDate(value: string | Date): string {
  const date = parseEventDate(value);
  return date ? date.toLocaleDateString() : "";
}

export function formatResultsSummary(
  competitionName: string,
  eventDate: string | Date,
  rankings: Array<{ rank: number; companyName: string; finalScore: number; judgeCount: number }>,
  winner: string | null,
  finalJudgeCount: number,
): string {
  const dateLabel = formatEventDate(eventDate);
  const lines = [
    dateLabel ? `${competitionName} — ${dateLabel}` : competitionName,
    `Winner: ${winner ?? "TBD"}`,
    `Final judge submissions: ${finalJudgeCount}`,
    "",
    "Rankings:",
    ...rankings.map(
      (row) =>
        `${row.rank}. ${row.companyName} — ${formatWeightedTotal(row.finalScore)} (from ${row.judgeCount} judge${row.judgeCount === 1 ? "" : "s"})`,
    ),
  ];
  return lines.join("\n");
}

export async function getCompetitionResults(competitionId: string) {
  const { prisma } = await import("@/lib/prisma");
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      companies: { orderBy: { createdAt: "asc" } },
      judges: { orderBy: { name: "asc" } },
      categories: { orderBy: { createdAt: "asc" } },
      sessions: true,
      scores: {
        include: { category: true, judge: true },
      },
    },
  });

  if (!competition) return null;

  const finalScores = scoresFromFinalJudges(competition.scores);
  const rankings = buildRankings(
    competition.companies,
    competition.judges,
    competition.categories,
    finalScores,
  );
  const finalJudgeCount = countPublishedJudges(competition.scores);

  return {
    competition,
    rankings,
    winner: winnerFromRankings(rankings),
    finalJudgeCount,
    resultsSummary: formatResultsSummary(
      competition.name,
      competition.eventDate,
      rankings,
      winnerFromRankings(rankings),
      finalJudgeCount,
    ),
  };
}
