export type MuscleRegionId =
  | "chest"
  | "frontDelts"
  | "rearDelts"
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

export type RegionalRiskState = "baseline" | "stable" | "monitor" | "high";

export type BaselineWorkout = {
  startedAt: Date;
  endedAt?: Date | null;
};

export type BaselineReadiness = {
  isReady: boolean;
  isPending: boolean;
  isProvisional: boolean;
  comparisonReady: boolean;
  workoutCount: number;
  uniqueDays: number;
  spanDays: number;
  firstWorkoutAt: Date | null;
  latestWorkoutAt: Date | null;
};

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
  state: "baseline" | "stable" | "monitor" | "high";
  stateLabel: "Baseline pending" | "Stable" | "Monitor" | "High";
  topDriver: string;
  explanation: string;
  interpretation: string;
  baselineReady: boolean;
  wowChangePct: number | null;
  acuteChronicRatio: number | null;
  highRpeSetCount: number;
  painFlagCount: number;
  acuteLoad: number;
  priorWeekLoad: number;
  chronicWeeklyLoad: number | null;
};

export type AnalyticsRiskState = "Baseline" | "Stable" | "Monitor" | "High";

export type DashboardAnalytics = {
  baselineReady: boolean;
  baselineEstablished: boolean;
  baselineStatus: "pending" | "provisional" | "established";
  baselineLabel: "Baseline pending" | "Provisional baseline" | "Baseline established";
  baselineReason: string;
  baselineWorkoutCount: number;
  baselineUniqueDays: number;
  baselineSpanDays: number;
  overallRiskState: AnalyticsRiskState;
  riskScore: number | null;
  topDriver: string;
  interpretation: string;
  sevenDayLoad: number;
  baselineLoad: number | null;
  wowChangePct: number | null;
  acuteChronicRatio: number | null;
  highRpeSetCount: number;
  painFlagCount: number;
  riskSignal: DashboardRiskSignal;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const MUSCLE_REGION_LABELS: Record<MuscleRegionId, string> = {
  chest: "Chest",
  frontDelts: "Front Delts",
  rearDelts: "Rear Delts",
  biceps: "Biceps",
  absCore: "Core",
  quads: "Quads",
  knees: "Knees",
  upperBack: "Upper Back",
  lats: "Lats",
  triceps: "Triceps",
  lowerBack: "Lower Back",
  glutes: "Glutes",
  hamstrings: "Hamstrings",
  calves: "Calves",
};

const ALL_REGIONS = Object.keys(MUSCLE_REGION_LABELS) as MuscleRegionId[];

const EXERCISE_REGION_MAP: Record<string, MuscleRegionId[]> = {
  "bench press": ["chest", "frontDelts", "triceps"],
  "incline bench press": ["chest", "frontDelts", "triceps"],
  "incline bench": ["chest", "frontDelts", "triceps"],
  "dumbbell bench press": ["chest", "frontDelts", "triceps"],
  "db bench press": ["chest", "frontDelts", "triceps"],
  dips: ["chest", "frontDelts", "triceps"],
  "push up": ["chest", "frontDelts", "triceps"],
  "overhead press": ["frontDelts", "triceps"],
  "shoulder press": ["frontDelts", "triceps"],
  "seated db press": ["frontDelts", "triceps"],
  "seated dumbbell press": ["frontDelts", "triceps"],
  "arnold press": ["frontDelts", "triceps"],
  "front raise": ["frontDelts"],
  "lateral raise": ["frontDelts"],
  "back squat": ["quads", "glutes", "lowerBack", "knees"],
  "front squat": ["quads", "glutes", "lowerBack", "knees"],
  "high bar squat": ["quads", "glutes", "lowerBack", "knees"],
  "low bar squat": ["quads", "glutes", "lowerBack", "knees"],
  "goblet squat": ["quads", "glutes", "lowerBack", "knees"],
  "leg press": ["quads", "glutes", "knees"],
  "leg extension": ["quads"],
  "walking lunge": ["quads", "glutes", "knees"],
  lunge: ["quads", "glutes", "knees"],
  lunges: ["quads", "glutes", "knees"],
  "bulgarian split squat": ["quads", "glutes", "knees"],
  deadlift: ["hamstrings", "glutes", "lowerBack"],
  "romanian deadlift": ["hamstrings", "glutes", "lowerBack"],
  "stiff leg deadlift": ["hamstrings", "glutes", "lowerBack"],
  "stiff legged deadlift": ["hamstrings", "glutes", "lowerBack"],
  "good morning": ["hamstrings", "glutes", "lowerBack"],
  "hip thrust": ["glutes", "hamstrings"],
  "back extension": ["lowerBack", "glutes", "hamstrings"],
  "seated leg curl": ["hamstrings"],
  "lying leg curl": ["hamstrings"],
  "hamstring curl": ["hamstrings"],
  "nordic curl": ["hamstrings"],
  "glute ham raise": ["hamstrings", "glutes"],
  "pull up": ["upperBack", "lats", "biceps"],
  "chin up": ["upperBack", "lats", "biceps"],
  "lat pulldown": ["upperBack", "lats", "biceps"],
  "barbell row": ["upperBack", "lats", "biceps"],
  "dumbbell row": ["upperBack", "lats", "biceps"],
  "seated cable row": ["upperBack", "lats", "biceps"],
  "face pull": ["upperBack", "rearDelts"],
  "rear delt fly": ["rearDelts", "upperBack"],
  "reverse pec deck": ["rearDelts", "upperBack"],
  "reverse fly": ["rearDelts", "upperBack"],
  "bicep curl": ["biceps"],
  "hammer curl": ["biceps"],
  "tricep pushdown": ["triceps"],
  "skull crushers": ["triceps"],
  plank: ["absCore"],
  "hanging leg raise": ["absCore"],
  "cable crunch": ["absCore"],
  "ab wheel": ["absCore"],
  "standing calf raise": ["calves"],
  "seated calf raise": ["calves"],
  "calf raise": ["calves"],
};

const CATEGORY_REGION_MAP: Record<string, MuscleRegionId[]> = {
  squat: ["quads", "glutes", "lowerBack", "knees"],
  hinge: ["hamstrings", "glutes", "lowerBack"],
  push: ["chest", "frontDelts", "triceps"],
  pull: ["upperBack", "lats", "biceps", "rearDelts"],
  arms: ["biceps", "triceps"],
  core: ["absCore"],
  calves: ["calves"],
};

const EXERCISE_REGION_RULES: { includes: string[]; regions: MuscleRegionId[] }[] = [
  { includes: ["leg extension"], regions: ["quads"] },
  { includes: ["seated leg curl"], regions: ["hamstrings"] },
  { includes: ["lying leg curl"], regions: ["hamstrings"] },
  { includes: ["hamstring curl"], regions: ["hamstrings"] },
  { includes: ["nordic curl"], regions: ["hamstrings"] },
  { includes: ["glute ham raise"], regions: ["hamstrings", "glutes"] },
  { includes: ["bulgarian split squat"], regions: ["quads", "glutes", "knees"] },
  { includes: ["leg press"], regions: ["quads", "glutes", "knees"] },
  { includes: ["squat"], regions: ["quads", "glutes", "lowerBack", "knees"] },
  { includes: ["lunge"], regions: ["quads", "glutes", "knees"] },
  { includes: ["incline", "bench"], regions: ["chest", "frontDelts", "triceps"] },
  { includes: ["dumbbell", "bench"], regions: ["chest", "frontDelts", "triceps"] },
  { includes: ["bench"], regions: ["chest", "frontDelts", "triceps"] },
  { includes: ["dip"], regions: ["chest", "frontDelts", "triceps"] },
  { includes: ["overhead press"], regions: ["frontDelts", "triceps"] },
  { includes: ["shoulder press"], regions: ["frontDelts", "triceps"] },
  { includes: ["seated", "press"], regions: ["frontDelts", "triceps"] },
  { includes: ["arnold press"], regions: ["frontDelts", "triceps"] },
  { includes: ["lateral raise"], regions: ["frontDelts"] },
  { includes: ["rear delt"], regions: ["rearDelts", "upperBack"] },
  { includes: ["reverse pec deck"], regions: ["rearDelts", "upperBack"] },
  { includes: ["face pull"], regions: ["rearDelts", "upperBack"] },
  { includes: ["lat pulldown"], regions: ["lats", "upperBack", "biceps"] },
  { includes: ["pull up"], regions: ["lats", "upperBack", "biceps"] },
  { includes: ["chin up"], regions: ["lats", "upperBack", "biceps"] },
  { includes: ["row"], regions: ["upperBack", "lats", "biceps"] },
  { includes: ["romanian deadlift"], regions: ["hamstrings", "glutes", "lowerBack"] },
  { includes: ["stiff leg deadlift"], regions: ["hamstrings", "glutes", "lowerBack"] },
  { includes: ["deadlift"], regions: ["hamstrings", "glutes", "lowerBack"] },
  { includes: ["good morning"], regions: ["hamstrings", "glutes", "lowerBack"] },
  { includes: ["hip thrust"], regions: ["glutes", "hamstrings"] },
  { includes: ["calf raise"], regions: ["calves"] },
  { includes: ["cable crunch"], regions: ["absCore"] },
  { includes: ["hanging leg raise"], regions: ["absCore"] },
  { includes: ["ab wheel"], regions: ["absCore"] },
  { includes: ["plank"], regions: ["absCore"] },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeExerciseName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function regionsForExercise(name: string, category: string | null) {
  const normalized = normalizeExerciseName(name);
  const exact = EXERCISE_REGION_MAP[normalized];
  if (exact) return exact;

  const rule = EXERCISE_REGION_RULES.find(({ includes }) =>
    includes.every((term) => normalized.includes(term))
  );
  if (rule) return rule.regions;

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

function formatPct(value: number) {
  return `${value >= 0 ? "+" : ""}${Math.round(value)}%`;
}

function formatBaselineReason(readiness: BaselineReadiness) {
  if (readiness.isReady) {
    return `Baseline established from ${readiness.workoutCount} workouts across ${readiness.uniqueDays} unique day${
      readiness.uniqueDays === 1 ? "" : "s"
    }.`;
  }
  if (readiness.workoutCount === 0) {
    return "No workouts logged yet. Need 3 workouts to start a baseline.";
  }
  if (readiness.isPending) {
    return `${readiness.workoutCount} workout${
      readiness.workoutCount === 1 ? "" : "s"
    } logged. Need 3 workouts to start a baseline.`;
  }

  return `Provisional baseline from ${readiness.workoutCount} workouts across ${readiness.uniqueDays} unique day${
    readiness.uniqueDays === 1 ? "" : "s"
  }.`;
}

function formatWorkoutDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function baselineStatus(readiness: BaselineReadiness): DashboardAnalytics["baselineStatus"] {
  if (readiness.isPending) return "pending";
  if (readiness.isProvisional) return "provisional";
  return "established";
}

function baselineLabel(readiness: BaselineReadiness): DashboardAnalytics["baselineLabel"] {
  if (readiness.isPending) return "Baseline pending";
  if (readiness.isProvisional) return "Provisional baseline";
  return "Baseline established";
}

function observedDayCount(dates: Date[], now: Date) {
  if (dates.length === 0) return 0;
  const first = dates[0];
  const latest = dates[dates.length - 1];
  const spanFromFirstToLatest = Math.floor((latest.getTime() - first.getTime()) / DAY_MS) + 1;
  const spanFromFirstToNow = Math.floor((now.getTime() - first.getTime()) / DAY_MS) + 1;

  return clamp(Math.max(1, Math.min(spanFromFirstToLatest, spanFromFirstToNow)), 1, 7);
}

export function getBaselineReadiness(
  workouts: BaselineWorkout[],
  asOf = new Date()
): BaselineReadiness {
  const completed = getCompletedWorkouts(workouts, asOf)
    .map((workout) => workout.startedAt)
    .sort((a, b) => a.getTime() - b.getTime());

  const firstWorkoutAt = completed[0] ?? null;
  const latestWorkoutAt = completed[completed.length - 1] ?? null;
  const uniqueDays = new Set(completed.map(formatWorkoutDay)).size;
  const spanDays =
    firstWorkoutAt && latestWorkoutAt
      ? (latestWorkoutAt.getTime() - firstWorkoutAt.getTime()) / DAY_MS
      : 0;
  const isPending = completed.length < 3;
  const isReady = completed.length >= 8 || uniqueDays >= 5;

  return {
    isReady,
    isPending,
    isProvisional: !isPending && !isReady,
    comparisonReady: !isPending,
    workoutCount: completed.length,
    uniqueDays,
    spanDays,
    firstWorkoutAt,
    latestWorkoutAt,
  };
}

export function getCompletedWorkouts(workouts: BaselineWorkout[], asOf = new Date()) {
  const asOfTime = asOf.getTime();

  return workouts.filter(
    (workout) => workout.endedAt !== null && workout.startedAt.getTime() <= asOfTime
  );
}

export function isBaselineReady(workouts: BaselineWorkout[], asOf = new Date()) {
  return getBaselineReadiness(workouts, asOf).isReady;
}

export function computeWorkoutLoad(sets: DashboardMetricSet[]) {
  return sets.reduce((sum, set) => sum + workload(set), 0);
}

export function computeSevenDayLoad(sets: DashboardMetricSet[], now = new Date()) {
  const acuteStart = new Date(now.getTime() - 7 * DAY_MS);
  return computeWorkoutLoad(sets.filter((set) => inWindow(set.performedAt, acuteStart, now)));
}

export function computePriorWeekLoad(sets: DashboardMetricSet[], now = new Date()) {
  const acuteStart = new Date(now.getTime() - 7 * DAY_MS);
  const priorStart = new Date(now.getTime() - 14 * DAY_MS);
  return computeWorkoutLoad(sets.filter((set) => inWindow(set.performedAt, priorStart, acuteStart)));
}

export function computeBaselineLoad(sets: DashboardMetricSet[], now = new Date()) {
  const acuteStart = new Date(now.getTime() - 7 * DAY_MS);
  const chronicStart = new Date(now.getTime() - 35 * DAY_MS);
  const chronicLoad = computeWorkoutLoad(
    sets.filter((set) => inWindow(set.performedAt, chronicStart, acuteStart))
  );

  if (chronicLoad > 0) return chronicLoad / 4;

  const availableSets = sets
    .filter((set) => set.performedAt.getTime() <= now.getTime())
    .sort((a, b) => a.performedAt.getTime() - b.performedAt.getTime());
  const availableLoad = computeWorkoutLoad(availableSets);
  if (availableLoad <= 0) return null;

  const days = observedDayCount(
    availableSets.map((set) => set.performedAt),
    now
  );

  return days > 0 ? availableLoad / days * 7 : null;
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

export function buildMuscleRegionRisks(
  sets: DashboardMetricSet[],
  now = new Date(),
  baselineReady = true
): RegionRisk[] {
  const recentStart = new Date(now.getTime() - 7 * DAY_MS);
  const baselineStart = new Date(now.getTime() - 35 * DAY_MS);
  const hasCompletedSets = sets.length > 0;

  const stats = new Map<
    MuscleRegionId,
    {
      currentLoad: number;
      baselineLoad: number;
      availableLoad: number;
      activeDates: Date[];
      highRpeSetCount: number;
      painFlagCount: number;
      maxRpe: number;
      maxPain: number;
      exerciseLoads: Map<string, number>;
    }
  >();

  const ensure = (region: MuscleRegionId) => {
    const existing = stats.get(region);
    if (existing) return existing;

    const created = {
      currentLoad: 0,
      baselineLoad: 0,
      availableLoad: 0,
      activeDates: [],
      highRpeSetCount: 0,
      painFlagCount: 0,
      maxRpe: 0,
      maxPain: 0,
      exerciseLoads: new Map<string, number>(),
    };
    stats.set(region, created);
    return created;
  };

  for (const set of sets) {
    const regions = regionsForExercise(set.exercise.name, set.exercise.category);
    if (regions.length === 0) continue;

    const isRecent = inWindow(set.performedAt, recentStart, now);
    const isBaseline = inWindow(set.performedAt, baselineStart, recentStart);
    const isAvailable = set.performedAt.getTime() <= now.getTime();
    if (!isRecent && !isBaseline && !isAvailable) continue;

    // Split set tonnage evenly so multi-region exercises do not double-count load.
    const setLoad = tonnage(set) / regions.length;
    for (const region of regions) {
      const regionStats = ensure(region);
      if (isAvailable) {
        regionStats.availableLoad += setLoad;
        regionStats.activeDates.push(set.performedAt);
      }
      if (isRecent) {
        regionStats.currentLoad += setLoad;
        regionStats.maxRpe = Math.max(regionStats.maxRpe, set.rpe ?? 0);
        regionStats.maxPain = Math.max(regionStats.maxPain, set.pain ?? 0);
        if ((set.rpe ?? 0) >= 9) regionStats.highRpeSetCount += 1;
        if ((set.pain ?? 0) >= 7) regionStats.painFlagCount += 1;
        regionStats.exerciseLoads.set(
          set.exercise.name,
          (regionStats.exerciseLoads.get(set.exercise.name) ?? 0) + setLoad
        );
      }
      if (isBaseline) {
        regionStats.baselineLoad += setLoad;
      }
    }
  }

  return ALL_REGIONS.map((id) => {
    const regionStats = stats.get(id);
    if (!regionStats) return emptyRegion(id, hasCompletedSets);

    const provisionalBaselineLoad =
      regionStats.availableLoad > 0
        ? regionStats.availableLoad / observedDayCount(regionStats.activeDates.sort((a, b) => a.getTime() - b.getTime()), now) * 7
        : 0;
    const weeklyBaselineLoad =
      regionStats.baselineLoad > 0
        ? regionStats.baselineLoad / 4
        : baselineReady
        ? provisionalBaselineLoad
        : 0;
    const hasRegionalBaseline = baselineReady && weeklyBaselineLoad > 0;
    const changePct = hasRegionalBaseline
      ? ((regionStats.currentLoad - weeklyBaselineLoad) / weeklyBaselineLoad) * 100
      : null;
    const painSignal = regionStats.painFlagCount > 0;
    const severePainSignal = regionStats.maxPain >= 9 || regionStats.painFlagCount >= 5;
    const severeHighRpeSignal = regionStats.maxRpe >= 9.5 || regionStats.highRpeSetCount >= 6;
    const highRpeSignal = regionStats.highRpeSetCount >= 3;
    const repeatedHighRpe = regionStats.highRpeSetCount >= 2;

    let state: RegionalRiskState =
      regionStats.currentLoad > 0 && !hasRegionalBaseline ? "baseline" : "stable";
    if (
      (hasRegionalBaseline && changePct !== null && changePct >= 30) ||
      severePainSignal ||
      (hasRegionalBaseline && severeHighRpeSignal)
    ) {
      state = "high";
    } else if (
      (hasRegionalBaseline && changePct !== null && changePct >= 15) ||
      painSignal ||
      highRpeSignal ||
      repeatedHighRpe ||
      (regionStats.currentLoad > 0 && !hasRegionalBaseline && (painSignal || repeatedHighRpe))
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
        : hasRegionalBaseline && changePct !== null
        ? changePct >= 15
          ? `Regional load increased ${formatPct(changePct)} vs baseline.${signals.length ? ` ${signals.join(", ")}.` : ""}`
          : `Regional load is within baseline range.${signals.length ? ` ${signals.join(", ")}.` : ""}`
        : signals.length
        ? `Recent regional load exists before a baseline is ready. ${signals.join(", ")}.`
        : baselineReady
        ? "Regional load is compared against a provisional baseline from available history."
        : "Recent regional load exists, but there is not enough history for comparison yet.";

    const action =
      state === "high"
        ? "Reduce or cap volume/intensity for this region next session, especially if pain or high RPE persists."
        : state === "monitor"
        ? painSignal || repeatedHighRpe || highRpeSignal
          ? "Keep the next exposure controlled and watch RPE or pain closely."
          : "Keep the next exposure controlled and avoid another sharp load increase."
        : state === "baseline"
        ? "Log at least 3 workouts to start a baseline."
        : "No adjustment indicated from logged workload.";

    return {
      id,
      name: MUSCLE_REGION_LABELS[id],
      state,
      currentLoad: regionStats.currentLoad,
      baselineLoad: hasRegionalBaseline ? weeklyBaselineLoad : null,
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
  if (state === "baseline") return "Baseline pending";
  return "Stable";
}

function analyticsState(state: DashboardRiskSignal["state"]): AnalyticsRiskState {
  if (state === "baseline") return "Baseline";
  if (state === "high") return "High";
  if (state === "monitor") return "Monitor";
  return "Stable";
}

type WorkloadRiskScoreInput = {
  acuteLoad: number;
  priorWeekLoad: number;
  chronicWeeklyLoad: number | null;
  highRpeSetCount: number;
  painFlagCount: number;
  maxPain: number;
  baselineReady: boolean;
};

/**
 * Deterministic workload risk signal, not a medical prediction model.
 * Base 20 + WoW load increase 0-30 + ACWR 0-25 + high RPE 0-15 + pain 0-20.
 * WoW/ACWR points are used only after baseline readiness is met.
 */
export function scoreWorkloadRiskSignal(input: WorkloadRiskScoreInput): DashboardRiskSignal {
  const wowChangePct =
    input.priorWeekLoad > 0
      ? ((input.acuteLoad - input.priorWeekLoad) / input.priorWeekLoad) * 100
      : null;
  const acuteChronicRatio =
    input.chronicWeeklyLoad && input.chronicWeeklyLoad > 0
      ? input.acuteLoad / input.chronicWeeklyLoad
      : null;

  const wowPoints =
    !input.baselineReady || wowChangePct === null
      ? 0
      : Math.round((clamp(wowChangePct, 0, 30) / 30) * 30);
  const acuteChronicPoints =
    !input.baselineReady || acuteChronicRatio === null
      ? 0
      : Math.round((clamp(acuteChronicRatio - 1, 0, 0.5) / 0.5) * 25);
  const rpePoints = Math.min(15, input.highRpeSetCount * 3);
  const painPoints = Math.min(
    20,
    input.painFlagCount * 6 + Math.max(0, input.maxPain - 7) * 4
  );
  const score = Math.round(
    clamp(20 + wowPoints + acuteChronicPoints + rpePoints + painPoints, 0, 100)
  );
  const severePainSignal = input.maxPain >= 9 || input.painFlagCount >= 5;
  const severeHighRpeSignal = input.highRpeSetCount >= 6;
  const highWorkloadSignal =
    input.baselineReady &&
    ((wowChangePct !== null && wowChangePct >= 30) ||
      (acuteChronicRatio !== null && acuteChronicRatio > 1.5));
  const monitorSignal =
    input.highRpeSetCount > 0 ||
    input.painFlagCount > 0 ||
    (input.baselineReady && wowChangePct !== null && wowChangePct >= 15) ||
    (input.baselineReady && acuteChronicRatio !== null && acuteChronicRatio > 1.3);

  let state: DashboardRiskSignal["state"] = input.baselineReady ? stateFromScore(score) : "baseline";
  let displayScore = score;
  if (highWorkloadSignal || severePainSignal || (input.baselineReady && severeHighRpeSignal)) {
    state = "high";
    displayScore = Math.max(displayScore, 70);
  } else if (!input.baselineReady && severeHighRpeSignal) {
    state = "monitor";
    displayScore = Math.max(displayScore, 40);
  } else if (!input.baselineReady && monitorSignal) {
    state = "monitor";
    displayScore = Math.max(displayScore, 40);
  } else if (input.baselineReady && monitorSignal) {
    state = displayScore >= 70 ? "high" : "monitor";
    displayScore = Math.max(displayScore, 40);
  }

  const drivers = [
    {
      points: wowPoints,
      label:
        !input.baselineReady
          ? "Baseline pending"
          : wowChangePct === null
          ? "No prior-week load baseline yet"
          : `Weekly load increased ${formatPct(wowChangePct)} vs prior week`,
    },
    {
      points: acuteChronicPoints,
      label:
        !input.baselineReady
          ? "Baseline pending"
          : acuteChronicRatio === null
          ? "No chronic load baseline yet"
          : `Acute:chronic ratio ${acuteChronicRatio.toFixed(2)}`,
    },
    {
      points: rpePoints,
      label:
        input.highRpeSetCount > 0
          ? `High RPE exposure: ${input.highRpeSetCount} set${input.highRpeSetCount === 1 ? "" : "s"} at RPE >= 9`
          : "No high RPE exposure in the last 7 days",
    },
    {
      points: painPoints,
      label:
        input.painFlagCount > 0
          ? `Pain flags: ${input.painFlagCount} set${input.painFlagCount === 1 ? "" : "s"} at pain >= 7/10`
          : "No pain flags in the last 7 days",
    },
  ].sort((a, b) => b.points - a.points);

  const topDriver =
    input.acuteLoad <= 0
      ? "No saved workouts in the last 7 days"
      : !input.baselineReady && !monitorSignal
      ? "Need more workout history"
      : drivers[0]?.points
      ? drivers[0].label
      : !input.baselineReady
      ? "Baseline pending"
      : "Recent workload is within formula thresholds";
  const interpretation = !input.baselineReady
    ? "Log at least 3 workouts to start a baseline."
    : "Workload signal based on saved sets, RPE, and pain notes.";

  return {
    score: displayScore,
    state,
    stateLabel: stateLabel(state),
    topDriver,
    explanation: `20 base + ${wowPoints} weekly load + ${acuteChronicPoints} acute:chronic + ${rpePoints} high RPE + ${painPoints} pain = ${displayScore}. Workload signal only.`,
    interpretation,
    baselineReady: input.baselineReady,
    wowChangePct,
    acuteChronicRatio,
    highRpeSetCount: input.highRpeSetCount,
    painFlagCount: input.painFlagCount,
    acuteLoad: input.acuteLoad,
    priorWeekLoad: input.priorWeekLoad,
    chronicWeeklyLoad: input.chronicWeeklyLoad,
  };
}

export function computeDashboardRiskSignal(
  sets: DashboardMetricSet[],
  now = new Date(),
  baselineReady = true
): DashboardRiskSignal {
  // Date windows use each logged workout's session date. Dashboard callers map
  // WorkoutSession.startedAt onto performedAt so backdated logs are counted by
  // workout date even if older SetEntry rows have drifted timestamps.
  const acuteStart = new Date(now.getTime() - 7 * DAY_MS);
  const acuteSets = sets.filter((set) => inWindow(set.performedAt, acuteStart, now));

  const painFlagSets = acuteSets.filter((set) => (set.pain ?? 0) >= 7);

  return scoreWorkloadRiskSignal({
    acuteLoad: computeSevenDayLoad(sets, now),
    priorWeekLoad: computePriorWeekLoad(sets, now),
    chronicWeeklyLoad: computeBaselineLoad(sets, now),
    highRpeSetCount: acuteSets.filter((set) => (set.rpe ?? 0) >= 9).length,
    painFlagCount: painFlagSets.length,
    maxPain: painFlagSets.reduce((max, set) => Math.max(max, set.pain ?? 0), 0),
    baselineReady,
  });
}

export function buildDashboardAnalytics(
  sets: DashboardMetricSet[],
  workouts: BaselineWorkout[],
  now = new Date()
): DashboardAnalytics {
  const baseline = getBaselineReadiness(workouts, now);
  const riskSignal = computeDashboardRiskSignal(sets, now, baseline.comparisonReady);
  const hasEffortOrPainSignal = riskSignal.highRpeSetCount > 0 || riskSignal.painFlagCount > 0;
  const status = baselineStatus(baseline);
  const label = baselineLabel(baseline);

  return {
    baselineReady: baseline.comparisonReady,
    baselineEstablished: baseline.isReady,
    baselineStatus: status,
    baselineLabel: label,
    baselineReason: formatBaselineReason(baseline),
    baselineWorkoutCount: baseline.workoutCount,
    baselineUniqueDays: baseline.uniqueDays,
    baselineSpanDays: baseline.spanDays,
    overallRiskState: analyticsState(riskSignal.state),
    riskScore: baseline.comparisonReady ? riskSignal.score : null,
    topDriver:
      baseline.isPending && !hasEffortOrPainSignal
        ? "Need more workout history"
        : riskSignal.topDriver,
    interpretation:
      baseline.isPending && hasEffortOrPainSignal
        ? `Baseline is pending, but effort or pain signals are raised. ${formatBaselineReason(baseline)}`
        : baseline.isPending
        ? formatBaselineReason(baseline)
        : baseline.isProvisional
        ? `Using a provisional baseline. ${formatBaselineReason(baseline)}`
        : riskSignal.interpretation,
    sevenDayLoad: riskSignal.acuteLoad,
    baselineLoad: baseline.comparisonReady ? riskSignal.chronicWeeklyLoad : null,
    wowChangePct: baseline.comparisonReady ? riskSignal.wowChangePct : null,
    acuteChronicRatio: baseline.comparisonReady ? riskSignal.acuteChronicRatio : null,
    highRpeSetCount: riskSignal.highRpeSetCount,
    painFlagCount: riskSignal.painFlagCount,
    riskSignal,
  };
}
