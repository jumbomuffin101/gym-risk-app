export type MetricSet = {
  performedAt: Date;
  reps: number;
  weight: number;
  rpe: number | null;
  pain: number | null;
};

const BODYWEIGHT_FACTOR = 10;

export function sessionSetLoad(set: Pick<MetricSet, "reps" | "weight" | "rpe">) {
  const weightValue = set.weight > 0 ? set.weight : BODYWEIGHT_FACTOR;
  const rpeValue = set.rpe ?? 1;
  return rpeValue * set.reps * weightValue;
}

export function sumRangeLoad(sets: MetricSet[], start: Date, end: Date) {
  return sets
    .filter((set) => set.performedAt >= start && set.performedAt < end)
    .reduce((total, set) => total + sessionSetLoad(set), 0);
}

export function weeklyLoad(sets: MetricSet[], now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  return sumRangeLoad(sets, start, now);
}

export function baselineLoad(sets: MetricSet[], now = new Date()) {
  const weeklyHistory: number[] = [];

  for (let i = 1; i <= 4; i += 1) {
    const end = new Date(now);
    end.setDate(end.getDate() - 7 * i);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    const value = sumRangeLoad(sets, start, end);
    if (value > 0) weeklyHistory.push(value);
  }

  if (weeklyHistory.length === 0) return null;
  return weeklyHistory.reduce((total, value) => total + value, 0) / weeklyHistory.length;
}

export function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => value != null);
  if (valid.length === 0) return null;
  return valid.reduce((total, value) => total + value, 0) / valid.length;
}

export function riskScore(weekly: number, baseline: number | null) {
  if (baseline == null || baseline <= 0) return null;
  const raw = (weekly / baseline) * 100;
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const label = score >= 80 ? "High" : score >= 50 ? "Moderate" : "Low";
  return { score, label };
}

export function recoveryWarning(avgRpe: number | null, avgPain: number | null) {
  if (avgRpe == null || avgPain == null) return null;
  if (avgRpe > 8 && avgPain > 3) return "Recovery warning";
  return null;
}
