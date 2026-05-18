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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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
  const windowSets: DashboardMetricSet[] = await prisma.setEntry.findMany({
    where: {
      userId,
      performedAt: { gte: windowStart, lte: riskAsOf },
      session: { endedAt: { not: null } },
    },
    select: {
      performedAt: true,
      reps: true,
      weight: true,
      rpe: true,
      pain: true,
      exercise: { select: { name: true, category: true } },
    },
  });
  const riskSignal = computeDashboardRiskSignal(
    windowSets,
    riskAsOf,
    baselineReadiness.isReady
  );
  const reasons: RiskReason[] = [];

  const workloadDriver =
    baselineReadiness.isReady && riskSignal.wowChangePct !== null && riskSignal.wowChangePct >= 15
      ? `Weekly load increased ${riskSignal.wowChangePct >= 0 ? "+" : ""}${Math.round(riskSignal.wowChangePct)}% vs prior week`
      : baselineReadiness.isReady &&
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
        baselineReady: baselineReadiness.isReady,
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
          : baselineReadiness.isReady
          ? clamp(50 + (maxPain - 7) * 10, 50, 90)
          : clamp(45 + (maxPain - 7) * 8, 45, 69),
      details: {
        maxPain,
        count: painSets.length,
        baselineReady: baselineReadiness.isReady,
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
        baselineReadiness.isReady && severeHighRpe
          ? clamp(70 + hardSets.length * 4, 70, 95)
          : baselineReadiness.isReady
          ? clamp(40 + hardSets.length * 8, 50, 95)
          : clamp(40 + hardSets.length * 5, 40, 69),
      details: {
        baselineReady: baselineReadiness.isReady,
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
      score: baselineReadiness.isReady
        ? clamp(25 + hardSets.length * 10, 25, 60)
        : clamp(40 + hardSets.length * 5, 40, 69),
      details: {
        baselineReady: baselineReadiness.isReady,
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
