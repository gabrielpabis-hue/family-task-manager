export type QualityScore = "weak" | "good" | "excellent";

const MULTIPLIERS: Record<QualityScore, number> = {
  weak: 1,
  good: 2,
  excellent: 3,
};

export function calcFinalPoints(basePoints: number, score: QualityScore): number {
  return basePoints * MULTIPLIERS[score];
}
