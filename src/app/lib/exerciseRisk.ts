import { calculateSetLoad } from "@/app/lib/trainingMetrics";

type RiskSet = {
  performedAt: Date;
  reps: number;
  weight: number;
  rpe: number | null;
  pain: number | null;
};

export type ExerciseRiskResult = {
  score: number;
  label: "Low" | "Moderate" | "High";
  drivers: string[];
};

export function computeExerciseRisk(sets: RiskSet[]): ExerciseRiskResult | null {
  if (sets.length < 3) return null;

  const latest = Math.max(...sets.map((set) => set.performedAt.getTime()));
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const recentStart = latest - weekMs;
  const baselineStart = latest - 2 * weekMs;

  const recentSets = sets.filter((set) => set.performedAt.getTime() >= recentStart);
  const baselineSets = sets.filter(
    (set) => set.performedAt.getTime() >= baselineStart && set.performedAt.getTime() < recentStart
  );

  if (recentSets.length === 0) return null;

  const recentLoad = recentSets.reduce(
    (sum, set) => sum + calculateSetLoad(set.reps, set.weight),
    0
  );
  const baselineLoad = baselineSets.reduce(
    (sum, set) => sum + calculateSetLoad(set.reps, set.weight),
    0
  );
  const recentRpeSets = recentSets.filter((set) => set.rpe != null);
  const recentPainSets = recentSets.filter((set) => set.pain != null);

  const avgRpe =
    recentRpeSets.length > 0
      ? recentRpeSets.reduce((sum, set) => sum + (set.rpe ?? 0), 0) / recentRpeSets.length
      : null;
  const avgPain =
    recentPainSets.length > 0
      ? recentPainSets.reduce((sum, set) => sum + (set.pain ?? 0), 0) / recentPainSets.length
      : null;

  const drivers: string[] = [];
  let score = 20;

  if (avgRpe != null) {
    if (avgRpe >= 8) {
      score += 30;
      drivers.push("High avg RPE");
    } else if (avgRpe >= 6.5) {
      score += 18;
      drivers.push("Moderate avg RPE");
    }
  }

  if (avgPain != null) {
    if (avgPain >= 4) {
      score += 28;
      drivers.push("Pain reported");
    } else if (avgPain >= 2) {
      score += 14;
      drivers.push("Mild pain trend");
    }
  }

  if (baselineLoad > 0) {
    const spikeRatio = recentLoad / baselineLoad;
    if (spikeRatio >= 1.35) {
      score += 24;
      drivers.push("Load spike vs baseline");
    } else if (spikeRatio <= 0.7) {
      score -= 10;
      drivers.push("Load reduced vs baseline");
    }
  }

  if (recentLoad > 3000) {
    score += 10;
    drivers.push("High absolute load");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const label: ExerciseRiskResult["label"] = score >= 75 ? "High" : score >= 45 ? "Moderate" : "Low";

  return { score, label, drivers };
}
