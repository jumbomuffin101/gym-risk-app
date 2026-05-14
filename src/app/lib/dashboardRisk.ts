export type MuscleRegionId =
  | "chest"
  | "shoulders"
  | "biceps"
  | "absCore"
  | "quads"
  | "knees"
  | "upperBack"
  | "lats"
  | "triceps"
  | "lowerBack"
  | "glutes"
  | "hamstrings"
  | "calves";

export type RegionalRiskState = "stable" | "monitor" | "elevated";

export type DashboardMetricSet = {
  performedAt: Date;
  reps: number;
  weight: number;
  rpe: number | null;
  pain: number | null;
  exercise: {
    name: string;
    category: string | null;
  };
};

export type RegionRisk = {
  id: MuscleRegionId;
  name: string;
  state: RegionalRiskState;
  currentLoad: number;
  baselineLoad: number | null;
  changePct: number | null;
  highRpeSetCount: number;
  painFlagCount: number;
  relatedExercises: string[];
  why: string;
  action: string;
};

export type DashboardRiskSignal = {
  score: number;
  state: "stable" | "monitor" | "high";
  stateLabel: "Stable" | "Monitor" | "High";
  topDriver: string;
  explanation: string;
  wowChangePct: number | null;
  acuteChronicRatio: number | null;
  highRpeSetCount: number;
  painFlagCount: number;
  acuteLoad: number;
  priorWeekLoad: number;
  chronicWeeklyLoad: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const MUSCLE_REGION_LABELS: Record<MuscleRegionId, string> = {
  chest: "Chest",
  shoulders: "Shoulders",
  biceps: "Biceps",
  absCore: "Abs/Core",
  quads: "Quads",
  knees: "Knees",
  upperBack: "Upper back",
  lats: "Lats",
  triceps: "Triceps",
  lowerBack: "Lower back",
  glutes: "Glutes",
  hamstrings: "Hamstrings",
  calves: "Calves",
};

const ALL_REGIONS = Object.keys(MUSCLE_REGION_LABELS) as MuscleRegionId[];

const EXERCISE_REGION_MAP: Record<string, MuscleRegionId[]> = {
  "bench press": ["chest", "shoulders", "triceps"],
  "incline bench press": ["chest", "shoulders", "triceps"],
  "dumbbell bench press": ["chest", "shoulders", "triceps"],
  dips: ["chest", "shoulders", "triceps"],
  "push up": ["chest", "shoulders", "triceps"],
  "overhead press": ["shoulders", "triceps"],
  "back squat": ["quads", "glutes", "knees"],
  "front squat": ["quads", "glutes", "knees"],
  "goblet squat": ["quads", "glutes", "knees"],
  "leg press": ["quads", "glutes", "knees"],
  "walking lunge": ["quads", "glutes", "knees"],
  "bulgarian split squat": ["quads", "glutes", "knees"],
  deadlift: ["hamstrings", "glutes", "lowerBack"],
  "romanian deadlift": ["hamstrings", "glutes", "lowerBack"],
  "good morning": ["hamstrings", "glutes", "lowerBack"],
  "hip thrust": ["glutes", "hamstrings"],
  "back extension": ["lowerBack", "glutes", "hamstrings"],
  "pull up": ["upperBack", "lats", "biceps"],
  "lat pulldown": ["upperBack", "lats", "biceps"],
  "barbell row": ["upperBack", "lats", "biceps"],
  "dumbbell row": ["upperBack", "lats", "biceps"],
  "seated cable row": ["upperBack", "lats", "biceps"],
  "face pull": ["upperBack", "shoulders"],
  "bicep curl": ["biceps"],
  "hammer curl": ["biceps"],
  "tricep pushdown": ["triceps"],
  "skull crushers": ["triceps"],
  plank: ["absCore"],
  "hanging leg raise": ["absCore"],
  "cable crunch": ["absCore"],
  "standing calf raise": ["calves"],
  "seated calf raise": ["calves"],
};

const CATEGORY_REGION_MAP: Record<string, MuscleRegionId[]> = {
  squat: ["quads", "glutes", "knees"],
  hinge: ["hamstrings", "glutes", "lowerBack"],
  push: ["chest", "shoulders", "triceps"],
  pull: ["upperBack", "lats", "biceps"],
  core: ["absCore"],
  calves: ["calves"],
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeExerciseName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function regionsForExercise(name: string, category: string | null) {
  const exact = EXERCISE_REGION_MAP[normalizeExerciseName(name)];
  if (exact) return exact;

  const categoryRegions = category ? CATEGORY_REGION_MAP[category.toLowerCase()] : undefined;
  return categoryRegions ?? [];
}

function tonnage(set: Pick<DashboardMetricSet, "weight" | "reps">) {
  return set.weight * set.reps;
}

function workload(set: Pick<DashboardMetricSet, "weight" | "reps" | "rpe">) {
  return set.weight * set.reps * (set.rpe ?? 1);
}

function inWindow(date: Date, start: Date, end: Date) {
  const time = date.getTime();
  return time >= start.getTime() && time < end.getTime();
}

function formatLoad(value: number) {
  return Math.round(value).toLocaleString();
}

function formatPct(value: number) {
  return `${value >= 0 ? "+" : ""}${Math.round(value)}%`;
}

function emptyRegion(id: MuscleRegionId, hasCompletedSets: boolean): RegionRisk {
  return {
    id,
    name: MUSCLE_REGION_LABELS[id],
    state: "stable",
    currentLoad: 0,
    baselineLoad: null,
    changePct: null,
    highRpeSetCount: 0,
    painFlagCount: 0,
    relatedExercises: [],
    why: hasCompletedSets
      ? "No mapped load for this region in the last 7 days."
      : "Save workouts to compute regional load.",
    action: hasCompletedSets
      ? "No adjustment indicated from logged workload."
      : "Save workouts to compute regional load.",
  };
}

export function buildMuscleRegionRisks(sets: DashboardMetricSet[], now = new Date()): RegionRisk[] {
  const recentStart = new Date(now.getTime() - 7 * DAY_MS);
  const priorStart = new Date(now.getTime() - 14 * DAY_MS);
  const hasCompletedSets = sets.length > 0;

  const stats = new Map<
    MuscleRegionId,
    {
      currentLoad: number;
      baselineLoad: number;
      highRpeSetCount: number;
      painFlagCount: number;
      maxRpe: number;
      exerciseLoads: Map<string, number>;
    }
  >();

  const ensure = (region: MuscleRegionId) => {
    const existing = stats.get(region);
    if (existing) return existing;

    const created = {
      currentLoad: 0,
      baselineLoad: 0,
      highRpeSetCount: 0,
      painFlagCount: 0,
      maxRpe: 0,
      exerciseLoads: new Map<string, number>(),
    };
    stats.set(region, created);
    return created;
  };

  for (const set of sets) {
    const regions = regionsForExercise(set.exercise.name, set.exercise.category);
    if (regions.length === 0) continue;

    const isRecent = inWindow(set.performedAt, recentStart, now);
    const isPrior = inWindow(set.performedAt, priorStart, recentStart);
    if (!isRecent && !isPrior) continue;

    const setLoad = tonnage(set);
    for (const region of regions) {
      const regionStats = ensure(region);
      if (isRecent) {
        regionStats.currentLoad += setLoad;
        regionStats.maxRpe = Math.max(regionStats.maxRpe, set.rpe ?? 0);
        if ((set.rpe ?? 0) >= 9) regionStats.highRpeSetCount += 1;
        if ((set.pain ?? 0) >= 7) regionStats.painFlagCount += 1;
        regionStats.exerciseLoads.set(
          set.exercise.name,
          (regionStats.exerciseLoads.get(set.exercise.name) ?? 0) + setLoad
        );
      }
      if (isPrior) {
        regionStats.baselineLoad += setLoad;
      }
    }
  }

  const maxCurrentLoad = Math.max(0, ...Array.from(stats.values()).map((region) => region.currentLoad));

  return ALL_REGIONS.map((id) => {
    const regionStats = stats.get(id);
    if (!regionStats) return emptyRegion(id, hasCompletedSets);

    const hasBaseline = regionStats.baselineLoad > 0;
    const changePct = hasBaseline
      ? ((regionStats.currentLoad - regionStats.baselineLoad) / regionStats.baselineLoad) * 100
      : null;
    const painSignal = regionStats.painFlagCount > 0;
    const highRpeSignal = regionStats.maxRpe >= 9.5 || regionStats.highRpeSetCount >= 3;
    const repeatedHighRpe = regionStats.highRpeSetCount >= 2;
    const loadShare = maxCurrentLoad > 0 ? regionStats.currentLoad / maxCurrentLoad : 0;

    let state: RegionalRiskState = "stable";
    if (
      (hasBaseline && changePct !== null && changePct >= 30) ||
      painSignal ||
      highRpeSignal
    ) {
      state = "elevated";
    } else if (
      (hasBaseline && changePct !== null && changePct >= 15) ||
      repeatedHighRpe ||
      (!hasBaseline && regionStats.currentLoad > 0 && loadShare >= 0.75)
    ) {
      state = "monitor";
    }

    const relatedExercises = Array.from(regionStats.exerciseLoads.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => name);

    const signals: string[] = [];
    if (regionStats.highRpeSetCount > 0) {
      signals.push(`${regionStats.highRpeSetCount} set${regionStats.highRpeSetCount === 1 ? "" : "s"} at RPE >= 9`);
    }
    if (regionStats.painFlagCount > 0) {
      signals.push(`${regionStats.painFlagCount} pain flag${regionStats.painFlagCount === 1 ? "" : "s"} at pain >= 7/10`);
    }

    const why =
      regionStats.currentLoad <= 0
        ? "No mapped load for this region in the last 7 days."
        : hasBaseline && changePct !== null
        ? `7-day region load is ${formatLoad(regionStats.currentLoad)}, ${formatPct(changePct)} vs the prior 7 days.${signals.length ? ` Signals: ${signals.join(", ")}.` : ""}`
        : `7-day region load is ${formatLoad(regionStats.currentLoad)} with no prior 7-day baseline yet.${state === "monitor" ? " This is among your highest-loaded regions this week." : ""}${signals.length ? ` Signals: ${signals.join(", ")}.` : ""}`;

    const action =
      state === "elevated"
        ? "Reduce or cap volume/intensity for this region next session, especially if pain or high RPE persists."
        : state === "monitor"
        ? "Keep the next exposure controlled and avoid another sharp load increase."
        : "No adjustment indicated from logged workload.";

    return {
      id,
      name: MUSCLE_REGION_LABELS[id],
      state,
      currentLoad: regionStats.currentLoad,
      baselineLoad: hasBaseline ? regionStats.baselineLoad : null,
      changePct,
      highRpeSetCount: regionStats.highRpeSetCount,
      painFlagCount: regionStats.painFlagCount,
      relatedExercises,
      why,
      action,
    };
  });
}

function stateFromScore(score: number): DashboardRiskSignal["state"] {
  if (score >= 70) return "high";
  if (score >= 40) return "monitor";
  return "stable";
}

function stateLabel(state: DashboardRiskSignal["state"]): DashboardRiskSignal["stateLabel"] {
  if (state === "high") return "High";
  if (state === "monitor") return "Monitor";
  return "Stable";
}

/**
 * Workload risk signal formula, not a medical prediction:
 * score = 25 base
 *   + 0-30 from positive week-over-week load increase, maxed at +60% WoW
 *   + 0-25 from acute:chronic ratio above 1.0, maxed at 2.0
 *   + 0-15 from high RPE exposure at 3 points per set with RPE >= 9
 *   + 0-20 from pain flags at pain >= 7/10
 * The final score is clamped to 0-100 and labeled Stable 0-39,
 * Monitor 40-69, High 70-100.
 */
export function computeDashboardRiskSignal(sets: DashboardMetricSet[], now = new Date()): DashboardRiskSignal {
  const acuteStart = new Date(now.getTime() - 7 * DAY_MS);
  const priorStart = new Date(now.getTime() - 14 * DAY_MS);
  const chronicStart = new Date(now.getTime() - 35 * DAY_MS);

  const acuteSets = sets.filter((set) => inWindow(set.performedAt, acuteStart, now));
  const priorWeekSets = sets.filter((set) => inWindow(set.performedAt, priorStart, acuteStart));
  const chronicSets = sets.filter((set) => inWindow(set.performedAt, chronicStart, acuteStart));

  const acuteLoad = acuteSets.reduce((sum, set) => sum + workload(set), 0);
  const priorWeekLoad = priorWeekSets.reduce((sum, set) => sum + workload(set), 0);
  const chronicLoad = chronicSets.reduce((sum, set) => sum + workload(set), 0);
  const chronicWeeklyLoad = chronicLoad > 0 ? chronicLoad / 4 : null;
  const wowChangePct = priorWeekLoad > 0 ? ((acuteLoad - priorWeekLoad) / priorWeekLoad) * 100 : null;
  const acuteChronicRatio = chronicWeeklyLoad && chronicWeeklyLoad > 0 ? acuteLoad / chronicWeeklyLoad : null;
  const highRpeSetCount = acuteSets.filter((set) => (set.rpe ?? 0) >= 9).length;
  const painFlagSets = acuteSets.filter((set) => (set.pain ?? 0) >= 7);
  const painFlagCount = painFlagSets.length;
  const maxPain = painFlagSets.reduce((max, set) => Math.max(max, set.pain ?? 0), 0);

  const wowPoints = wowChangePct === null ? 0 : Math.round((clamp(wowChangePct, 0, 60) / 60) * 30);
  const acuteChronicPoints =
    acuteChronicRatio === null ? 0 : Math.round(clamp(acuteChronicRatio - 1, 0, 1) * 25);
  const rpePoints = Math.min(15, highRpeSetCount * 3);
  const painPoints = Math.min(20, painFlagCount * 8 + Math.max(0, maxPain - 7) * 4);
  const score = clamp(25 + wowPoints + acuteChronicPoints + rpePoints + painPoints, 0, 100);
  const state = stateFromScore(score);

  const drivers = [
    {
      points: wowPoints,
      label:
        wowChangePct === null
          ? "No prior-week load baseline yet"
          : `Weekly load increased ${formatPct(wowChangePct)} vs prior week`,
    },
    {
      points: acuteChronicPoints,
      label:
        acuteChronicRatio === null
          ? "No chronic load baseline yet"
          : `Acute:chronic ratio ${acuteChronicRatio.toFixed(2)}`,
    },
    {
      points: rpePoints,
      label:
        highRpeSetCount > 0
          ? `High intensity streak: ${highRpeSetCount} set${highRpeSetCount === 1 ? "" : "s"} at RPE >= 9`
          : "No high RPE exposure in the last 7 days",
    },
    {
      points: painPoints,
      label:
        painFlagCount > 0
          ? `Pain flags: ${painFlagCount} set${painFlagCount === 1 ? "" : "s"} at pain >= 7/10`
          : "No pain flags in the last 7 days",
    },
  ].sort((a, b) => b.points - a.points);

  const topDriver =
    acuteSets.length === 0
      ? "No saved workouts in the last 7 days"
      : drivers[0]?.points
      ? drivers[0].label
      : "Recent workload is within formula thresholds";

  return {
    score,
    state,
    stateLabel: stateLabel(state),
    topDriver,
    explanation: `Formula: 25 base + ${wowPoints} weekly load + ${acuteChronicPoints} acute:chronic + ${rpePoints} high RPE + ${painPoints} pain = ${score}. Workload signal only, not a medical prediction.`,
    wowChangePct,
    acuteChronicRatio,
    highRpeSetCount,
    painFlagCount,
    acuteLoad,
    priorWeekLoad,
    chronicWeeklyLoad,
  };
}

