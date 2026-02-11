export type MetricSet = {
  performedAt: Date;
  reps: number;
  weight: number;
  rpe: number | null;
  pain: number | null;
};

const BODYWEIGHT_MULTIPLIER = 10;

export function setLoad(reps: number, weight: number) {
  if (reps <= 0) return 0;
  if (!weight || weight <= 0) return reps * BODYWEIGHT_MULTIPLIER;
  return reps * weight;
}

export function weeklyLoad(sets: MetricSet[], from: Date, to: Date) {
  return sets
    .filter((set) => set.performedAt >= from && set.performedAt < to)
    .reduce((sum, set) => sum + setLoad(set.reps, set.weight), 0);
}

export function baselineLoad(sets: MetricSet[], weekStart: Date) {
  const prev4WeeksStart = new Date(weekStart);
  prev4WeeksStart.setDate(prev4WeeksStart.getDate() - 28);

  const weeklyValues = Array.from({ length: 4 }, (_, index) => {
    const start = new Date(weekStart);
    start.setDate(start.getDate() - 7 * (index + 1));
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return weeklyLoad(sets, start, end);
  }).filter((value) => value > 0);

  if (weeklyValues.length > 0) {
    return weeklyValues.reduce((sum, value) => sum + value, 0) / weeklyValues.length;
  }

  const previous14Start = new Date(weekStart);
  previous14Start.setDate(previous14Start.getDate() - 14);
  const previous14 = weeklyLoad(sets, previous14Start, weekStart);
  return previous14 > 0 ? previous14 / 2 : null;
}

export function averageRecent(values: Array<number | null>) {
  const clean = values.filter((value): value is number => value != null);
  if (clean.length === 0) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

export function computeRiskScore({
  acuteLoad,
  baseline,
  avgPain,
  avgRpe,
}: {
  acuteLoad: number;
  baseline: number | null;
  avgPain: number | null;
  avgRpe: number | null;
}) {
  if (baseline == null || baseline <= 0 || (avgPain == null && avgRpe == null)) {
    return null;
  }

  const ratio = acuteLoad / baseline;
  let score = 20;

  if (ratio >= 1.4) score += 35;
  else if (ratio >= 1.15) score += 20;
  else if (ratio < 0.8) score -= 10;

  if (avgPain != null) {
    if (avgPain >= 4) score += 30;
    else if (avgPain >= 2) score += 15;
  }

  if (avgRpe != null) {
    if (avgRpe >= 8) score += 25;
    else if (avgRpe >= 6.5) score += 12;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const label = score >= 75 ? "High" : score >= 45 ? "Moderate" : "Low";
  return { score, label, ratio };
}
