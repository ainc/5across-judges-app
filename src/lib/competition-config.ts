export const DEFAULT_JUDGES = [
  { name: "Judge A", code: "JA" },
  { name: "Judge B", code: "JB" },
  { name: "Judge C", code: "JC" },
] as const;

export const DEFAULT_COMPANIES = [
  { name: "Company A" },
  { name: "Company B" },
  { name: "Company C" },
  { name: "Company D" },
  { name: "Company E" },
] as const;

export const DEFAULT_CATEGORIES = [
  { name: "Strength / Creativity / Uniqueness of idea / Technology", weight: 15, maxScore: 5 },
  { name: "Description / Knowledge of the target market", weight: 20, maxScore: 5 },
  { name: "Traction / Growth", weight: 25, maxScore: 5 },
  { name: "Revenue Model", weight: 20, maxScore: 5 },
  { name: "Team / Advisors", weight: 15, maxScore: 5 },
  { name: "Quality of overall pitch / Presentation", weight: 5, maxScore: 5 },
] as const;

type ConfigRevisionInput = {
  updatedAt: Date | string;
  judges: Array<{ id: string; name: string; code?: string | null; message?: string | null }>;
  categories: Array<{ id: string; name: string; weight: number; maxScore?: number }>;
};

export function buildCompetitionConfigRevision({
  updatedAt,
  judges,
  categories,
}: ConfigRevisionInput) {
  const updatedAtValue = updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt;

  return [
    updatedAtValue,
    ...judges.map((judge) => `j:${judge.id}:${judge.name}:${judge.code ?? ""}:${judge.message ?? ""}`).sort(),
    ...categories
      .map((category) => `c:${category.id}:${category.name}:${category.weight}:${category.maxScore ?? 5}`)
      .sort(),
  ].join("|");
}

export function pruneScoresForCompetition(
  scores: Record<string, number>,
  companies: Array<{ id: string }>,
  categories: Array<{ id: string }>,
) {
  const validKeys = new Set(
    companies.flatMap((company) => categories.map((category) => `${company.id}:${category.id}`)),
  );
  const next: Record<string, number> = {};
  for (const [key, value] of Object.entries(scores)) {
    if (validKeys.has(key)) next[key] = value;
  }
  return next;
}
