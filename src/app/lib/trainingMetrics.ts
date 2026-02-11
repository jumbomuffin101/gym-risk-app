export type SetLike = {
  reps: number | null;
  weight: number | null;
  rpe?: number | null;
  pain?: number | null;
  performedAt: Date;
};

const BODYWEIGHT_MULTIPLIER = 10;

export function calculateSetLoad(reps: number | null, weight: number | null) {
  const safeReps = reps ?? 0;
  if (safeReps <= 0) return 0;
  if (weight == null || weight <= 0) return safeReps * BODYWEIGHT_MULTIPLIER;
  return safeReps * weight;
}

export function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function fatigueLabelFromAvgRpe(avgRpe: number | null) {
  if (avgRpe == null) return null;
  if (avgRpe >= 8) return "High";
  if (avgRpe >= 6) return "Moderate";
  return "Low";
}

export function painTrendLabel(recent: number | null, previous: number | null) {
  if (recent == null || previous == null) return null;
  const delta = recent - previous;
  if (delta > 0.5) return "Rising";
  if (delta < -0.5) return "Improving";
  return "Stable";
}
