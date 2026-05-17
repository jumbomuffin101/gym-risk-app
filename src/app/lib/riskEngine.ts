import { getBaselineReadiness } from "src/app/lib/dashboardRisk";
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

function tonnage(weight: number, reps: number) {
  return weight * reps;
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
    select: { startedAt: true, endedAt: true },
  });
  const riskAsOf = sessionStart
    ? new Date((sessionStart.endedAt ?? sessionStart.startedAt).getTime() + 1)
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
  const reasons: RiskReason[] = [];

  const painSets = sets.filter((s) => (s.pain ?? 0) >= 7);
  if (painSets.length > 0) {
    const maxPain = Math.max(...painSets.map((s) => s.pain ?? 0));
    const severePain = maxPain >= 9 || painSets.length >= 5;
    reasons.push({
      kind: "pain_flag",
      title: `Pain flagged (max ${maxPain}/10)`,
      score:
        baselineReadiness.isReady || severePain
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
    reasons.push({
      kind: "rpe_spike",
      title: `High intensity streak (${hardSets.length} sets at RPE >= 9)`,
      score:
        baselineReadiness.isReady
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

  const sessionByCat: Record<string, number> = {};
  for (const s of sets) {
    const cat = s.exercise.category;
    if (cat) {
      sessionByCat[cat] = (sessionByCat[cat] ?? 0) + tonnage(s.weight, s.reps);
    }
  }

  const since = new Date((sessionStart?.startedAt ?? new Date()).getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const [cat, sessionTonnage] of Object.entries(sessionByCat)) {
    if (!baselineReadiness.isReady) continue;

    const recentSets = await prisma.setEntry.findMany({
      where: {
        session: { userId, startedAt: { gte: since }, id: { not: sessionId } },
        exercise: { category: cat },
      },
      select: { weight: true, reps: true, sessionId: true },
    });

    if (recentSets.length < 6) continue;

    const bySession: Record<string, number> = {};
    for (const rs of recentSets) {
      bySession[rs.sessionId] = (bySession[rs.sessionId] ?? 0) + tonnage(rs.weight, rs.reps);
    }

    const baselines = Object.values(bySession);
    const avg = baselines.reduce((a, b) => a + b, 0) / baselines.length;
    if (avg <= 0) continue;

    const ratio = sessionTonnage / avg;
    if (ratio >= 1.5) {
      const pct = Math.round((ratio - 1) * 100);
      reasons.push({
        kind: "volume_spike",
        title: `Volume spike in ${cat} (+${pct}% vs 7-day avg)`,
        score: clamp(40 + pct, 45, 95),
        details: {
          category: cat,
          sessionTonnage: Math.round(sessionTonnage),
          baselineAvg: Math.round(avg),
          pct,
          sessionsUsed: baselines.length,
        },
      });
    }
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
