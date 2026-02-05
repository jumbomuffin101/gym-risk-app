import type { SetEntry } from "@prisma/client";

export type ExerciseRiskPayload =
  | {
      hasData: true;
      score: number;
      label: "Low" | "Mod" | "High";
      recentVolume: number;
      recentRpe: number | null;
      painAvg: number | null;
      changePct: number | null;
    }
  | { hasData: false };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toLabel(score: number): "Low" | "Mod" | "High" {
  if (score >= 75) return "High";
  if (score >= 45) return "Mod";
  return "Low";
}

export function computeExerciseRisk(sets: Array<Pick<SetEntry, "performedAt" | "reps" | "weight" | "rpe" | "pain">>): ExerciseRiskPayload {
  if (sets.length === 0) {
    return { hasData: false };
  }

  const latest = Math.max(...sets.map((set) => new Date(set.performedAt).getTime()));
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const recentStart = latest - weekMs;
  const prevStart = latest - weekMs * 2;

  let recentVolume = 0;
  let prevVolume = 0;
  let rpeTotal = 0;
  let rpeCount = 0;
  let painTotal = 0;
  let painCount = 0;

  for (const set of sets) {
    const performedAt = new Date(set.performedAt).getTime();
    const volume = set.reps * set.weight;

    if (performedAt >= recentStart) {
      recentVolume += volume;
      if (set.rpe != null) {
        rpeTotal += set.rpe;
        rpeCount += 1;
      }
      if (set.pain != null) {
        painTotal += set.pain;
        painCount += 1;
      }
    } else if (performedAt >= prevStart) {
      prevVolume += volume;
    }
  }

  const recentRpe = rpeCount > 0 ? rpeTotal / rpeCount : null;
  const painAvg = painCount > 0 ? painTotal / painCount : null;
  const changePct = prevVolume > 0 ? Math.round(((recentVolume - prevVolume) / prevVolume) * 100) : null;

  const volumeScore = Math.min(45, (recentVolume / 1000) * 7.5);
  const rpeScore = recentRpe != null ? Math.min(35, (recentRpe / 10) * 35) : 0;
  const painScore = painAvg != null ? Math.min(20, (painAvg / 10) * 20) : 0;
  const changeScore = changePct != null && changePct > 0 ? Math.min(20, changePct / 2) : 0;

  const score = clamp(Math.round(volumeScore + rpeScore + painScore + changeScore), 0, 100);

  return {
    hasData: true,
    score,
    label: toLabel(score),
    recentVolume: Math.round(recentVolume),
    recentRpe: recentRpe != null ? Math.round(recentRpe * 10) / 10 : null,
    painAvg: painAvg != null ? Math.round(painAvg * 10) / 10 : null,
    changePct,
  };
}
