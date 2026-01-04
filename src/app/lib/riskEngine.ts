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
 * Computes risk reasons for a given user + session.
 * This is intentionally rule-based and explainable for v0.
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

  const reasons: RiskReason[] = [];

  // Rule 1: Pain flags
  const painSets = sets.filter((s) => (s.pain ?? 0) >= 7);
  if (painSets.length > 0) {
    const maxPain = Math.max(...painSets.map((s) => s.pain ?? 0));
    reasons.push({
      kind: "pain_flag",
      title: `Pain flagged (max ${maxPain}/10)`,
      score: clamp(50 + (maxPain - 7) * 10, 50, 90),
      details: {
        maxPain,
        count: painSets.length,
        examples: painSets.slice(0, 3).map((s) => ({
          exercise: s.exercise.name,
          category: s.exercise.category,
          pain: s.pain,
        })),
      },
    });
  }

  // Rule 2: High RPE spike / streak
  const hardSets = sets.filter((s) => (s.rpe ?? 0) >= 9);
  if (hardSets.length >= 3) {
    reasons.push({
      kind: "rpe_spike",
      title: `High intensity streak (${hardSets.length} sets at RPE ≥ 9)`,
      score: clamp(40 + hardSets.length * 8, 50, 95),
      details: {
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
      title: `High intensity present (${hardSets.length} sets at RPE ≥ 9)`,
      score: clamp(25 + hardSets.length * 10, 25, 60),
      details: {
        hardSets: hardSets.slice(0, 5).map((s) => ({
          exercise: s.exercise.name,
          category: s.exercise.category,
          rpe: s.rpe,
        })),
      },
    });
  }

  // Rule 3: Volume spike by category (tonnage baseline)
  const sessionByCat: Record<string, number> = {};
  for (const s of sets) {
    const cat = s.exercise.category;
    if (cat) {
      sessionByCat[cat] = (sessionByCat[cat] ?? 0) + tonnage(s.weight, s.reps);
    }
  }

  const sessionStart = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    select: { startedAt: true },
  });
  const since = new Date((sessionStart?.startedAt ?? new Date()).getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const [cat, sessionTonnage] of Object.entries(sessionByCat)) {
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
 *
 * This keeps the feature usable (reasons computed) without breaking builds.
 */
export async function writeRiskEventsForSession(userId: string, sessionId: string) {
  const reasons = await computeSessionRisk(userId, sessionId);
  return { reasons };
}
