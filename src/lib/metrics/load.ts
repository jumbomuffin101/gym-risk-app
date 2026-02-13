export type SetLoadInput = {
  reps: number;
  weight: number;
  rpe?: number | null;
};

export type RiskState = "Stable" | "Monitor" | "High";

export function computeSetLoad(set: SetLoadInput): number {
  const rpeMultiplier =
    typeof set.rpe === "number" && Number.isFinite(set.rpe)
      ? 1 + (set.rpe - 6) * 0.05
      : 1;

  return set.weight * set.reps * rpeMultiplier;
}

export function computeSessionLoad(sets: SetLoadInput[]): number {
  return sets.reduce((sum, set) => sum + computeSetLoad(set), 0);
}

export function computeWowPercent(weeklyLoad: number, priorWeeklyLoad: number): number {
  const raw = ((weeklyLoad - priorWeeklyLoad) / Math.max(priorWeeklyLoad, 1)) * 100;
  return Math.max(-999, Math.min(999, raw));
}

export function computeAcuteChronicRatio(acute7d: number, chronic28d: number): number {
  const chronicEquivalent7d = chronic28d / 4;
  if (chronicEquivalent7d <= 0) return 0;
  return acute7d / chronicEquivalent7d;
}

export function deriveRiskState(wowPercent: number, ratio: number): {
  state: RiskState;
  driver: string;
} {
  if (wowPercent >= 30) {
    return { state: "High", driver: `WoW spike +${wowPercent.toFixed(0)}%` };
  }

  if (ratio > 1.5) {
    return { state: "High", driver: `AC ratio ${ratio.toFixed(2)}` };
  }

  if (ratio >= 1.3) {
    return { state: "Monitor", driver: `AC ratio ${ratio.toFixed(2)}` };
  }

  if (wowPercent >= 15) {
    return { state: "Monitor", driver: `WoW increase +${wowPercent.toFixed(0)}%` };
  }

  return { state: "Stable", driver: "Load within stable band" };
}

function dayStart(value: Date): Date {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function sumLoadInWindow(
  sessions: Array<{ startedAt: Date; sessionLoad: number }>,
  startInclusive: Date,
  endExclusive: Date
): number {
  return sessions
    .filter((session) => {
      const day = dayStart(session.startedAt).getTime();
      return day >= dayStart(startInclusive).getTime() && day < dayStart(endExclusive).getTime();
    })
    .reduce((sum, session) => sum + session.sessionLoad, 0);
}
