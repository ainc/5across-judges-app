export type CategoryConfig = {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
};

export type ScoreEntry = {
  companyId: string;
  categoryId: string;
  score: number;
};

export function toWeightDecimal(weightPercent: number): number {
  return weightPercent / 100;
}

export function getWeightedTotalForCompany(
  companyId: string,
  categories: CategoryConfig[],
  scores: ScoreEntry[],
): number {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const companyScores = scores.filter((score) => score.companyId === companyId);
  return companyScores.reduce((sum, score) => {
    const category = categoryMap.get(score.categoryId);
    if (!category) return sum;
    return sum + score.score * toWeightDecimal(category.weight);
  }, 0);
}

export function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeScore(value: number): number {
  return roundScore(value);
}

export function isScoreInRange(value: number): boolean {
  return Number.isFinite(value) && value >= 1 && value <= 5;
}

export function getMissingCells(
  companyIds: string[],
  categoryIds: string[],
  scores: ScoreEntry[],
): Array<{ companyId: string; categoryId: string }> {
  const scoreLookup = new Set(scores.map((score) => `${score.companyId}:${score.categoryId}`));
  const missing: Array<{ companyId: string; categoryId: string }> = [];

  for (const companyId of companyIds) {
    for (const categoryId of categoryIds) {
      if (!scoreLookup.has(`${companyId}:${categoryId}`)) {
        missing.push({ companyId, categoryId });
      }
    }
  }

  return missing;
}
