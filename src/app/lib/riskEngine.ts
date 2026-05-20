import {
  computeDashboardRiskSignal,
  getBaselineReadiness,
  type DashboardMetricSet,
} from "src/app/lib/dashboardRisk";
import { prisma } from "src/app/lib/prisma";

type RiskReason = {
  kind: string;
  title: string;
  score: number; // 0-100
  details: Record<string, unknown>;
};

type RiskSet = {
  sessionId?: string;
  weight: number;
  reps: number;
  durationSeconds: number | null;
  distanceMeters: number | null;
  rpe: number | null;
  pain: number | null;
  exercise: {
    category: string | null;
    name: string;
  };
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function setExternalLoad(set: Pick<RiskSet, "weight" | "reps">) {
  return set.weight * set.reps;
}

export function deriveRiskReasonsForSets(
  sets: RiskSet[],
  baselineByCategory: Record<string, RiskSet[]> = {}
): RiskReason[] {
  const reasons: RiskReason[] = [];
  const conditioningSets = sets.filter((set) => set.exercise.category === "conditioning");
  const conditioningSeconds = conditioningSets.reduce(
    (sum, set) => sum + (set.durationSeconds ?? 0),
    0
  );
  const conditioningDistance = conditioningSets.reduce(
    (sum, set) => sum + (set.distanceMeters ?? 0),
    0
  );
  const conditioningAverageRpe =
    conditioningSets.length > 0
      ? conditioningSets.reduce((sum, set) => sum + (set.rpe ?? 0), 0) / conditioningSets.length
      : 0;

  if (
    conditioningSets.length >= 3 &&
    conditioningAverageRpe >= 8 &&
    (conditioningSeconds >= 1500 || conditioningDistance >= 4000)
  ) {
    reasons.push({
      kind: "conditioning_density",
      title: "Conditioning density is elevated",
      score: clamp(40 + conditioningSets.length * 8, 40, 85),
      details: {
        setCount: conditioningSets.length,
        durationSeconds: conditioningSeconds,
        distanceMeters: conditioningDistance,
        averageRpe: conditioningAverageRpe,
      },
    });
  }

  const currentLoadByCategory = new Map<string, number>();
  for (const set of sets) {
    const category = set.exercise.category;
    if (!category) continue;
    currentLoadByCategory.set(
      category,
      (currentLoadByCategory.get(category) ?? 0) + setExternalLoad(set)
    );
  }

  for (const [category, currentLoad] of currentLoadByCategory) {
    const baselineSets = baselineByCategory[category] ?? [];
    if (baselineSets.length === 0) continue;

    const baselineSessionLoads = new Map<string, number>();
    for (const set of baselineSets) {
      const key = set.sessionId ?? `${set.exercise.name}-${baselineSessionLoads.size}`;
      baselineSessionLoads.set(key, (baselineSessionLoads.get(key) ?? 0) + setExternalLoad(set));
    }

    const baselineLoads = Array.from(baselineSessionLoads.values());
    const baselineAverage =
      baselineLoads.reduce((sum, load) => sum + load, 0) / baselineLoads.length;
    if (baselineAverage > 0 && currentLoad >= baselineAverage * 1.3) {
      const increasePct = ((currentLoad - baselineAverage) / baselineAverage) * 100;
      reasons.push({
        kind: "volume_spike",
        title: `${category} load increased ${Math.round(increasePct)}% vs recent baseline`,
        score: clamp(45 + increasePct / 2, 45, 95),
        details: {
          category,
          currentLoad,
          baselineAverage,
          increasePct,
        },
      });
    }
  }

  return reasons.sort((a, b) => b.score - a.score).slice(0, 5);
}

/**
 * Computes explainable risk reasons for one session.
 * Workload spike reasons are suppressed until the user's baseline is ready.
 */
export async function computeSessionRisk(userId: string, sessionId: string): Promise<RiskReason[]> {
  const sets = await prisma.setEntry.findMany({
    where: { sessionId },
    orderBy: { performedAt: "asc" },
    select: {
      weight: true,
      reps: true,
      rpe: true,
      pain: true,
      exercise: { select: { category: true, name: true } },
    },
  });

  if (sets.length === 0) return [];

  const sessionStart = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    select: { startedAt: true },
  });
  const riskAsOf = sessionStart
    ? new Date(sessionStart.startedAt.getTime() + 1)
    : new Date();
  const baselineWorkouts = await prisma.workoutSession.findMany({
    where: {
      userId,
      endedAt: { not: null },
      sets: { some: {} },
      startedAt: { lte: riskAsOf },
    },
    select: { startedAt: true, endedAt: true },
  });
  const baselineReadiness = getBaselineReadiness(baselineWorkouts, riskAsOf);
  const windowStart = new Date(riskAsOf.getTime() - 35 * 24 * 60 * 60 * 1000);
  const windowSessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      endedAt: { not: null },
      sets: { some: {} },
      startedAt: { gte: windowStart, lte: riskAsOf },
    },
    select: {
      startedAt: true,
      sets: {
        select: {
          reps: true,
          weight: true,
          rpe: true,
          pain: true,
          exercise: { select: { name: true, category: true } },
        },
      },
    },
  });
  const windowSets: DashboardMetricSet[] = windowSessions.flatMap((session) =>
    session.sets.map((set) => ({
      performedAt: session.startedAt,
      reps: set.reps,
      weight: set.weight,
      rpe: set.rpe,
      pain: set.pain,
      exercise: set.exercise,
    }))
  );
  const riskSignal = computeDashboardRiskSignal(
    windowSets,
    riskAsOf,
    baselineReadiness.comparisonReady
  );
  const reasons: RiskReason[] = [];

  const workloadDriver =
    baselineReadiness.comparisonReady && riskSignal.wowChangePct !== null && riskSignal.wowChangePct >= 15
      ? `Weekly load increased ${riskSignal.wowChangePct >= 0 ? "+" : ""}${Math.round(riskSignal.wowChangePct)}% vs prior week`
      : baselineReadiness.comparisonReady &&
        riskSignal.acuteChronicRatio !== null &&
        riskSignal.acuteChronicRatio > 1.3
      ? `Acute:chronic ratio ${riskSignal.acuteChronicRatio.toFixed(2)}`
      : null;

  if (workloadDriver) {
    reasons.push({
      kind: riskSignal.state === "high" ? "workload_spike" : "workload_monitor",
      title: workloadDriver,
      score: riskSignal.score,
      details: {
        baselineReady: baselineReadiness.comparisonReady,
        wowChangePct: riskSignal.wowChangePct,
        acuteChronicRatio: riskSignal.acuteChronicRatio,
        acuteLoad: Math.round(riskSignal.acuteLoad),
        priorWeekLoad: Math.round(riskSignal.priorWeekLoad),
        chronicWeeklyLoad:
          riskSignal.chronicWeeklyLoad === null
            ? null
            : Math.round(riskSignal.chronicWeeklyLoad),
      },
    });
  }

  const painSets = sets.filter((s) => (s.pain ?? 0) >= 7);
  if (painSets.length > 0) {
    const maxPain = Math.max(...painSets.map((s) => s.pain ?? 0));
    const severePain = maxPain >= 9 || painSets.length >= 5;
    reasons.push({
      kind: "pain_flag",
      title: `Pain flagged (max ${maxPain}/10)`,
      score:
        severePain
          ? clamp(70 + (maxPain - 9) * 10 + painSets.length * 2, 70, 95)
          : baselineReadiness.comparisonReady
          ? clamp(50 + (maxPain - 7) * 10, 50, 90)
          : clamp(45 + (maxPain - 7) * 8, 45, 69),
      details: {
        maxPain,
        count: painSets.length,
        baselineReady: baselineReadiness.comparisonReady,
        examples: painSets.slice(0, 3).map((s) => ({
          exercise: s.exercise.name,
          category: s.exercise.category,
          pain: s.pain,
        })),
      },
    });
  }

  const hardSets = sets.filter((s) => (s.rpe ?? 0) >= 9);
  if (hardSets.length >= 3) {
    const severeHighRpe = hardSets.length >= 6;
    reasons.push({
      kind: "rpe_spike",
      title: `High intensity streak (${hardSets.length} sets at RPE >= 9)`,
      score:
        baselineReadiness.comparisonReady && severeHighRpe
          ? clamp(70 + hardSets.length * 4, 70, 95)
          : baselineReadiness.comparisonReady
          ? clamp(40 + hardSets.length * 8, 50, 95)
          : clamp(40 + hardSets.length * 5, 40, 69),
      details: {
        baselineReady: baselineReadiness.comparisonReady,
        hardSets: hardSets.slice(0, 5).map((s) => ({
          exercise: s.exercise.name,
          category: s.exercise.category,
          rpe: s.rpe,
        })),
      },
    });
  } else if (hardSets.length > 0) {
    reasons.push({
      kind: "rpe_warning",
      title: `High intensity present (${hardSets.length} sets at RPE >= 9)`,
      score: baselineReadiness.comparisonReady
        ? clamp(25 + hardSets.length * 10, 25, 60)
        : clamp(40 + hardSets.length * 5, 40, 69),
      details: {
        baselineReady: baselineReadiness.comparisonReady,
        hardSets: hardSets.slice(0, 5).map((s) => ({
          exercise: s.exercise.name,
          category: s.exercise.category,
          rpe: s.rpe,
        })),
      },
    });
  }

  reasons.sort((a, b) => b.score - a.score);
  return reasons.slice(0, 5);
}

/**
 * For now, we do NOT persist risk events because the Prisma schema
 * doesn't include a RiskEvent model yet.
 */
export async function writeRiskEventsForSession(userId: string, sessionId: string) {
  const reasons = await computeSessionRisk(userId, sessionId);
  return { reasons };
}
