import { computeSetLoad } from "@/lib/metrics/load";
import { prisma } from "src/app/lib/prisma";

export type RiskReason = {
  kind: string;
  title: string;
  score: number; // 0-100
  details: Record<string, unknown>;
};

type RiskSet = {
  sessionId?: string;
  weight: number;
  reps: number;
  durationSeconds?: number | null;
  distanceMeters?: number | null;
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

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function sumSetLoad(sets: Pick<RiskSet, "weight" | "reps" | "durationSeconds" | "distanceMeters" | "rpe">[]) {
  return sets.reduce((total, set) => total + computeSetLoad(set), 0);
}

export function deriveRiskReasonsForSets(
  sets: RiskSet[],
  recentSetsByCategory: Record<string, Array<RiskSet & { sessionId: string }>> = {}
): RiskReason[] {
  if (sets.length === 0) return [];

  const reasons: RiskReason[] = [];

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

  const hardSets = sets.filter((s) => (s.rpe ?? 0) >= 9);
  if (hardSets.length >= 3) {
    reasons.push({
      kind: "rpe_spike",
      title: `High intensity streak (${hardSets.length} sets at RPE >= 9)`,
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
      title: `High intensity present (${hardSets.length} sets at RPE >= 9)`,
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

  const sessionByCategory = new Map<string, RiskSet[]>();
  for (const set of sets) {
    const category = set.exercise.category;
    if (!category) continue;
    const existing = sessionByCategory.get(category) ?? [];
    existing.push(set);
    sessionByCategory.set(category, existing);
  }

  for (const [category, categorySets] of sessionByCategory.entries()) {
    const sessionLoad = sumSetLoad(categorySets);
    const recentSets = recentSetsByCategory[category] ?? [];
    const bySession = new Map<string, number>();

    for (const set of recentSets) {
      bySession.set(set.sessionId, (bySession.get(set.sessionId) ?? 0) + computeSetLoad(set));
    }

    const baselines = [...bySession.values()].filter((value) => value > 0);
    const baselineAvg = average(baselines);

    if (baselines.length >= 3 && baselineAvg > 0) {
      const ratio = sessionLoad / baselineAvg;
      if (ratio >= 1.5) {
        const pct = Math.round((ratio - 1) * 100);
        reasons.push({
          kind: category === "conditioning" ? "conditioning_load_spike" : "volume_spike",
          title:
            category === "conditioning"
              ? `Conditioning spike (+${pct}% vs 7-day avg)`
              : `Load spike in ${category} (+${pct}% vs 7-day avg)`,
          score: clamp(40 + pct, 45, 95),
          details: {
            category,
            sessionLoad: Math.round(sessionLoad),
            baselineAvg: Math.round(baselineAvg),
            pct,
            sessionsUsed: baselines.length,
          },
        });
      }
    }

    if (category === "conditioning") {
      const totalDurationSeconds = sum(categorySets.map((set) => set.durationSeconds ?? 0));
      const totalDistanceMeters = sum(categorySets.map((set) => set.distanceMeters ?? 0));
      const avgRpe = average(categorySets.map((set) => set.rpe).filter((value): value is number => value !== null));
      const hardConditioningBouts = categorySets.filter(
        (set) => ((set.durationSeconds ?? 0) >= 300 || (set.distanceMeters ?? 0) >= 1000) && (set.rpe ?? 0) >= 8
      );

      if (totalDurationSeconds >= 1800 || totalDistanceMeters >= 5000 || hardConditioningBouts.length >= 3) {
        reasons.push({
          kind: "conditioning_density",
          title: "Conditioning strain is elevated",
          score: clamp(
            45 +
              Math.round(totalDurationSeconds / 120) +
              Math.round(totalDistanceMeters / 400) +
              hardConditioningBouts.length * 6 +
              Math.max(0, Math.round((avgRpe - 7) * 10)),
            45,
            92
          ),
          details: {
            totalDurationSeconds,
            totalDistanceMeters,
            avgRpe: Number(avgRpe.toFixed(1)),
            hardBouts: hardConditioningBouts.length,
          },
        });
      }
    }
  }

  reasons.sort((a, b) => b.score - a.score);
  return reasons.slice(0, 5);
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
      sessionId: true,
      weight: true,
      reps: true,
      rpe: true,
      pain: true,
      exercise: { select: { category: true, name: true } },
    },
  });

  if (sets.length === 0) return [];

  const categories = Array.from(new Set(sets.map((set) => set.exercise.category).filter(Boolean))) as string[];
  const sessionStart = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    select: { startedAt: true },
  });
  const since = new Date((sessionStart?.startedAt ?? new Date()).getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentSets = categories.length
    ? await prisma.setEntry.findMany({
        where: {
          session: { userId, startedAt: { gte: since }, id: { not: sessionId } },
          exercise: { category: { in: categories } },
        },
        select: {
          sessionId: true,
          weight: true,
          reps: true,
          rpe: true,
          pain: true,
          exercise: { select: { category: true, name: true } },
        },
      })
    : [];

  const recentSetsByCategory: Record<string, Array<RiskSet & { sessionId: string }>> = {};
  for (const set of recentSets) {
    const category = set.exercise.category;
    if (!category) continue;
    recentSetsByCategory[category] ??= [];
    recentSetsByCategory[category].push(set);
  }

  return deriveRiskReasonsForSets(sets, recentSetsByCategory);
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
