export const DEFAULT_JUDGES = [
  { name: "Judge A", username: "judge1" },
  { name: "Judge B", username: "judge2" },
  { name: "Judge C", username: "judge3" },
] as const;

export const DEFAULT_COMPANIES = [
  { name: "Company A" },
  { name: "Company B" },
  { name: "Company C" },
  { name: "Company D" },
  { name: "Company E" },
] as const;

export const DEFAULT_CATEGORIES = [
  {
    name: "Strength",
    description: "Strength / Creativity / Uniqueness of idea / Technology",
    weight: 15,
    maxScore: 5,
  },
  {
    name: "Description",
    description: "Description / Knowledge of the target market",
    weight: 20,
    maxScore: 5,
  },
  { name: "Traction", description: "Traction / Growth", weight: 25, maxScore: 5 },
  { name: "Revenue Model", description: "Revenue Model", weight: 20, maxScore: 5 },
  { name: "Team", description: "Team / Advisors", weight: 15, maxScore: 5 },
  {
    name: "Presentation",
    description: "Quality of overall pitch / Presentation",
    weight: 5,
    maxScore: 5,
  },
] as const;

type ConfigRevisionInput = {
  updatedAt: Date | string;
  judges: Array<{ id: string; name: string; username: string; message?: string | null }>;
  categories: Array<{ id: string; name: string; description?: string | null; weight: number; maxScore?: number }>;
};

export function buildCompetitionConfigRevision({
  updatedAt,
  judges,
  categories,
}: ConfigRevisionInput) {
  const updatedAtValue = updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt;

  return [
    updatedAtValue,
    ...judges.map((judge) => `j:${judge.id}:${judge.name}:${judge.username}:${judge.message ?? ""}`).sort(),
    ...categories
      .map(
        (category) =>
          `c:${category.id}:${category.name}:${category.description ?? ""}:${category.weight}:${category.maxScore ?? 5}`,
      )
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
