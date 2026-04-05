import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { supportsExtendedSetEntryFields } from "@/app/lib/data/setEntrySchema";
import { getActiveWorkoutSession } from "@/app/lib/data/workoutSession";
import { readSessionPlan } from "@/app/lib/sessionPlan";
import { createExerciseDetailSetEntryAction, startWorkoutSession } from "@/app/exercises/actions";
import SessionProgressStrip from "@/app/components/SessionProgressStrip";
import ExerciseQuickLogger from "@/app/exercises/ExerciseQuickLogger";
import { computeSetLoad } from "@/lib/metrics/load";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ selected?: string }>;
};

type RecentSet = {
  performedAt: Date;
  reps: number;
  weight: number;
  durationSeconds?: number | null;
  distanceMeters?: number | null;
  rpe: number | null;
  pain: number | null;
  notes?: string | null;
};

type ExerciseSummary = {
  id: string;
  name: string;
  category: string | null;
};

type SessionMetric = {
  label: string;
  value: string;
};

type ExerciseReadMeta = {
  label: string;
  title: string;
  detail: string;
  secondary?: string;
  classes: string;
};

type LoggingProfile = {
  name: string;
  summary: string;
  repsLabel: string;
  weightLabel: string;
  quickRepValues: number[];
  quickWeightValues: number[];
  emptyState: string;
  durationLabel?: string;
  quickDurationValues?: number[];
  distanceLabel?: string;
  quickDistanceValues?: number[];
  notesPlaceholder?: string;
};

const CATEGORY_LOGGING_PROFILES: Record<string, LoggingProfile> = {
  squat: {
    name: "Strength set",
    summary: "Best for squat patterns and lower-body loading where reps and working load matter most.",
    repsLabel: "Reps",
    weightLabel: "Load",
    quickRepValues: [3, 5, 6, 8, 10],
    quickWeightValues: [45, 95, 135, 185, 225],
    emptyState: "No sets here yet. Log the first working set to start the session trend.",
    notesPlaceholder: "Optional cues, tempo, or setup note.",
  },
  hinge: {
    name: "Strength set",
    summary: "Use this for pulls and hinge work where tonnage and effort are the main signals.",
    repsLabel: "Reps",
    weightLabel: "Load",
    quickRepValues: [3, 5, 6, 8, 10],
    quickWeightValues: [95, 135, 185, 225, 275],
    emptyState: "No hinge work logged yet for this session.",
    notesPlaceholder: "Optional setup or fatigue note.",
  },
  push: {
    name: "Pressing set",
    summary: "Built for presses and push accessories where clean reps and effort drive the session read.",
    repsLabel: "Reps",
    weightLabel: "Load",
    quickRepValues: [5, 8, 10, 12, 15],
    quickWeightValues: [0, 45, 95, 135, 185],
    emptyState: "Start with the first pressing set and the page will build from there.",
    notesPlaceholder: "Optional grip, machine, or setup note.",
  },
  pull: {
    name: "Pulling set",
    summary: "Built for rows, pulldowns, and pull-ups where session load still comes from reps and resistance.",
    repsLabel: "Reps",
    weightLabel: "Load",
    quickRepValues: [5, 8, 10, 12, 15],
    quickWeightValues: [0, 45, 70, 90, 120],
    emptyState: "Log the first pulling set to establish the baseline for this exercise.",
    notesPlaceholder: "Optional grip, handle, or machine note.",
  },
  arms: {
    name: "Accessory set",
    summary: "Best for arm work where moderate reps and repeatable effort matter more than top-end load.",
    repsLabel: "Reps",
    weightLabel: "Load",
    quickRepValues: [8, 10, 12, 15, 20],
    quickWeightValues: [0, 10, 20, 30, 40],
    emptyState: "No accessory work logged yet for this session.",
    notesPlaceholder: "Optional side or cable attachment note.",
  },
  calves: {
    name: "Accessory set",
    summary: "Use higher-rep logging for smaller lower-body work and machine-based accessories.",
    repsLabel: "Reps",
    weightLabel: "Load",
    quickRepValues: [10, 12, 15, 20, 25],
    quickWeightValues: [0, 25, 45, 70, 90],
    emptyState: "Log the first accessory set to populate the session view.",
    notesPlaceholder: "Optional machine or stance note.",
  },
  core: {
    name: "Core set",
    summary: "For core work, track the rep target, optional hold time, and added load when resistance is used.",
    repsLabel: "Reps",
    weightLabel: "Added load",
    quickRepValues: [8, 10, 12, 15, 20],
    quickWeightValues: [0, 5, 10, 25, 45],
    emptyState: "Core work starts empty here. Log bodyweight work as 0 added load.",
    durationLabel: "Hold seconds",
    quickDurationValues: [15, 30, 45, 60],
    notesPlaceholder: "Optional variation or side note.",
  },
  conditioning: {
    name: "Conditioning set",
    summary: "Track work bouts, resistance, duration, and distance so interval work is not forced into a pure lifting model.",
    repsLabel: "Work bouts",
    weightLabel: "Resistance",
    quickRepValues: [1, 3, 5, 8, 10],
    quickWeightValues: [0, 1, 2, 3, 4],
    emptyState: "Log the first interval or resisted bout to start the conditioning read.",
    durationLabel: "Duration sec",
    quickDurationValues: [30, 60, 120, 300],
    distanceLabel: "Distance m",
    quickDistanceValues: [100, 250, 500, 1000],
    notesPlaceholder: "Optional machine, pace, or interval note.",
  },
};


export default async function ExerciseDetailPage({ params, searchParams }: PageProps) {
  const userId = await requireDbUserId();
  const { id: rawId } = await params;
  const { selected: selectedParam } = await searchParams;
  const id = rawId?.trim();

  if (!id) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="lab-card rounded-2xl p-4">
          <div className="text-lg font-semibold text-white/90">Exercise not found</div>
          <p className="mt-2 text-sm lab-muted">That exercise could not be loaded.</p>
          <Link
            href="/exercises"
            className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
          >
            Back to exercises
          </Link>
        </div>
      </div>
    );
  }

  const activeSession = await getActiveWorkoutSession(userId);
  const selectedIds = parseSelectedIds(selectedParam, readSessionPlan(activeSession?.note).selectedExerciseIds, id);
  const supportsExtendedFields = await supportsExtendedSetEntryFields();

  const [exercise, recentSets, selectedExercises, sessionExerciseRefs] = await Promise.all([
    prisma.exercise.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        category: true,
        createdAt: true,
      },
    }),
    prisma.setEntry.findMany({
      where: {
        userId,
        exerciseId: id,
      },
      orderBy: { performedAt: "desc" },
      take: 20,
      select: {
        id: true,
        performedAt: true,
        reps: true,
        weight: true,
        ...(supportsExtendedFields
          ? {
              durationSeconds: true,
              distanceMeters: true,
              notes: true,
            }
          : {}),
        rpe: true,
        pain: true,
      },
    }),
    selectedIds.length > 0
      ? prisma.exercise.findMany({
          where: { id: { in: selectedIds } },
          select: { id: true, name: true, category: true },
        })
      : Promise.resolve([]),
    activeSession
      ? prisma.setEntry.findMany({
          where: {
            userId,
            sessionId: activeSession.id,
          },
          select: {
            exerciseId: true,
          },
          distinct: ["exerciseId"],
        })
      : Promise.resolve([]),
  ]);

  const sessionExerciseSets = activeSession
    ? await prisma.setEntry.findMany({
        where: {
          userId,
          sessionId: activeSession.id,
          exerciseId: id,
        },
        orderBy: { performedAt: "desc" },
        select: {
          performedAt: true,
          reps: true,
          weight: true,
          ...(supportsExtendedFields
            ? {
                durationSeconds: true,
                distanceMeters: true,
                notes: true,
              }
            : {}),
          rpe: true,
          pain: true,
        },
      })
    : [];

  if (!exercise) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="lab-card rounded-2xl p-4">
          <div className="text-lg font-semibold text-white/90">Exercise not found</div>
          <p className="mt-2 text-sm lab-muted">That exercise does not exist in your library.</p>
          <Link
            href="/exercises"
            className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
          >
            Back to exercises
          </Link>
        </div>
      </div>
    );
  }

  const orderedSelectedExercises = sortExercisesByIds(selectedExercises, selectedIds);
  const selectedQuery = orderedSelectedExercises.length > 0 ? buildSelectedQuery(orderedSelectedExercises) : "";
  const completedExerciseIds = new Set(sessionExerciseRefs.map((entry) => entry.exerciseId));
  const currentIndex = orderedSelectedExercises.findIndex((item) => item.id === exercise.id);
  const previousExercise = currentIndex > 0 ? orderedSelectedExercises[currentIndex - 1] : null;
  const nextExercise =
    currentIndex >= 0 && currentIndex < orderedSelectedExercises.length - 1
      ? orderedSelectedExercises[currentIndex + 1]
      : null;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const sessionLoad28d = sumSessionLoadFromDate(recentSets, twentyEightDaysAgo);
  const lastPerformedAt = recentSets[0]?.performedAt ?? null;
  const lastSet = recentSets[0] ?? null;
  const sessionSetCount = sessionExerciseSets.length;
  const sessionLoad = sumSessionLoad(sessionExerciseSets);
  const averageSessionRpe = averageOf(sessionExerciseSets.map((set) => set.rpe).filter(isNumber));
  const maxSessionPain = maxOf(sessionExerciseSets.map((set) => set.pain).filter(isNumber));
  const stressState = getStressState({
    averageRpe: averageSessionRpe,
    maxPain: maxSessionPain,
    sessionLoad,
    baseline28dLoad: sessionLoad28d,
  });

  const categoryKey = (exercise.category ?? "").toLowerCase();
  const loggingProfile = CATEGORY_LOGGING_PROFILES[categoryKey] ?? {
    name: "Standard set",
    summary: "Use reps, load, effort, and optional notes to log a clean working set for this exercise.",
    repsLabel: "Reps",
    weightLabel: "Load",
    quickRepValues: [5, 8, 10, 12, 15],
    quickWeightValues: [0, 45, 95, 135, 185],
    emptyState: "No sets logged yet for this exercise in the current session.",
    notesPlaceholder: "Optional note.",
  };
  const exerciseReadMeta = getExerciseReadMeta({
    categoryKey,
    sessionSets: sessionExerciseSets,
    sessionLoad,
    baseline28dLoad: sessionLoad28d,
    averageRpe: averageSessionRpe,
    maxPain: maxSessionPain,
    stressTitle: stressState.title,
  });

  const backTo = orderedSelectedExercises.length > 0 ? "/workouts/new" : "/exercises";
  const startRedirectTo = `/exercises/${exercise.id}${selectedQuery}`;
  const sessionMetrics: SessionMetric[] = [
    { label: "Sets", value: String(sessionSetCount) },
    { label: "Session load", value: sessionLoad.toFixed(1) },
    { label: "Session read", value: stressState.title },
  ];
  const progressItems = orderedSelectedExercises.map((item) => ({
    id: item.id,
    label: item.name,
    href: buildExerciseHref(item.id, orderedSelectedExercises),
    state: item.id === exercise.id ? "current" : completedExerciseIds.has(item.id) ? "completed" : "remaining",
  })) as Array<{
    id: string;
    label: string;
    href: string;
    state: "current" | "completed" | "remaining";
  }>;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header className="lab-card rounded-2xl p-4 space-y-2.5">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/workouts/new"
            className="rounded-full border border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.1)] px-3 py-1.5 text-sm text-white"
          >
            Workout Flow
          </Link>
          <Link
            href={selectedQuery ? `/workouts${selectedQuery}` : "/workouts"}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/75 hover:bg-white/[0.06]"
          >
            Session Result
          </Link>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide lab-muted">Current exercise</div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-white/95">{exercise.name}</h1>
            <p className="mt-1 text-xs lab-muted">{exercise.category ?? "Uncategorized"}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={backTo}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
            >
              Exit to flow
            </Link>
            <Link
              href={selectedQuery ? `/workouts${selectedQuery}` : "/workouts"}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
            >
              Session result
            </Link>
          </div>
        </div>

        {orderedSelectedExercises.length > 0 ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-white/75">
                {currentIndex + 1} of {orderedSelectedExercises.length}
              </div>
              <div className="flex flex-wrap gap-2">
                {previousExercise ? (
                  <Link
                    href={buildExerciseHref(previousExercise.id, orderedSelectedExercises)}
                    className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06]"
                  >
                    Previous
                  </Link>
                ) : null}
                {nextExercise ? (
                  <Link
                    href={buildExerciseHref(nextExercise.id, orderedSelectedExercises)}
                    className="inline-flex rounded-xl border border-[rgba(34,197,94,0.24)] bg-[rgba(34,197,94,0.1)] px-3 py-2 text-xs font-medium text-white hover:bg-[rgba(34,197,94,0.15)]"
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
            <SessionProgressStrip items={progressItems} />
          </div>
        ) : null}
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
        <section className="lab-card rounded-2xl p-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white/90">Log current set</div>
              <p className="mt-1 text-xs text-white/60">{loggingProfile.name}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-right">
              <div className="text-[11px] uppercase tracking-wide lab-muted">Last set</div>
              <div className="mt-1 text-xs text-white/65">
                {lastSet ? `${lastSet.reps} reps | ${lastSet.weight} load` : "No baseline yet"}
              </div>
            </div>
          </div>

          {activeSession ? (
            <div className="rounded-xl border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.06)] p-2.5 text-sm text-white/85">
              Active session ready.
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <div className="text-sm text-white/85">Start a session to log sets.</div>
              <form action={startWorkoutSession}>
                <input type="hidden" name="redirectTo" value={startRedirectTo} />
                <button
                  className="lab-hover rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-sm font-semibold text-black"
                  style={{
                    boxShadow: "0 0 0 1px rgba(34,197,94,0.25), 0 18px 55px rgba(34,197,94,0.12)",
                  }}
                >
                  Start session
                </button>
              </form>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-3">
            {sessionMetrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-[11px] uppercase tracking-wide lab-muted">{metric.label}</div>
                <div className="mt-1 text-sm font-semibold text-white/90">{metric.value}</div>
              </div>
            ))}
          </div>

          <ExerciseQuickLogger
            exerciseId={exercise.id}
            activeSession={Boolean(activeSession)}
            lastSet={
              lastSet
                ? {
                    performedAt: lastSet.performedAt.toISOString(),
                    reps: lastSet.reps,
                    weight: lastSet.weight,
                    durationSeconds: lastSet.durationSeconds ?? null,
                    distanceMeters: lastSet.distanceMeters ?? null,
                    rpe: lastSet.rpe,
                    pain: lastSet.pain,
                    notes: lastSet.notes ?? null,
                  }
                : null
            }
            sessionSets={sessionExerciseSets.map((set) => ({
              performedAt: set.performedAt.toISOString(),
              reps: set.reps,
              weight: set.weight,
              durationSeconds: set.durationSeconds ?? null,
              distanceMeters: set.distanceMeters ?? null,
              rpe: set.rpe,
              pain: set.pain,
              notes: set.notes ?? null,
            }))}
            profile={loggingProfile}
            nextExerciseHref={nextExercise ? buildExerciseHref(nextExercise.id, orderedSelectedExercises) : null}
          />
        </section>

        <aside className="space-y-4">
          <section className="lab-card rounded-2xl p-4 space-y-3">
            <div className="text-sm font-semibold text-white/90">Quick read</div>

            <div className={`rounded-2xl border p-4 ${stressState.classes}`}>
              <div className="text-xs uppercase tracking-wide text-white/65">Current state</div>
              <div className="mt-1 text-lg font-semibold text-white/90">{stressState.title}</div>
              <div className="mt-1 text-sm text-white/70">{stressState.description}</div>
            </div>

            <div className={`rounded-2xl border p-4 ${exerciseReadMeta.classes}`}>
              <div className="text-xs uppercase tracking-wide text-white/60">{exerciseReadMeta.label}</div>
              <div className="mt-1 text-sm font-semibold text-white/90">{exerciseReadMeta.title}</div>
              <div className="mt-1 text-xs text-white/70">{exerciseReadMeta.detail}</div>
              {exerciseReadMeta.secondary ? (
                <div className="mt-2 text-[11px] text-white/50">{exerciseReadMeta.secondary}</div>
              ) : null}
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              <MetricCard label="Sets here" value={String(sessionSetCount)} />
              <MetricCard label="Avg RPE" value={averageSessionRpe !== null ? averageSessionRpe.toFixed(1) : "-"} tone={averageSessionRpe !== null && averageSessionRpe >= 8 ? "watch" : "neutral"} />
              <MetricCard label="Max pain" value={maxSessionPain !== null ? String(maxSessionPain) : "-"} tone={maxSessionPain !== null && maxSessionPain >= 7 ? "danger" : maxSessionPain !== null && maxSessionPain >= 4 ? "watch" : "neutral"} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={backTo}
                className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06]"
              >
                Back to flow
              </Link>
              <Link
                href={selectedQuery ? `/workouts${selectedQuery}` : "/workouts"}
                className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06]"
              >
                Session result
              </Link>
            </div>
          </section>
        </aside>
      </div>

      <section className="lab-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white/90">Recent sets</div>
          <div className="text-xs text-white/50">
            {lastPerformedAt ? `Last logged ${lastPerformedAt.toLocaleString()}` : "No recent history"}
          </div>
        </div>

        {recentSets.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/75">
            No sets yet for this exercise.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-white/50">
                  <th className="px-3 py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Reps</th>
                  <th className="py-2 pr-4">Weight</th>
                  <th className="py-2 pr-4">Details</th>
                  <th className="py-2 pr-4">RPE</th>
                  <th className="py-2 pr-4">Pain</th>
                </tr>
              </thead>
              <tbody>
                {recentSets.map((set) => (
                  <tr key={set.performedAt.toISOString()} className="border-t border-white/10 text-white/85">
                    <td className="px-3 py-2 pr-4">{new Date(set.performedAt).toLocaleString()}</td>
                    <td className="py-2 pr-4">{set.reps}</td>
                    <td className="py-2 pr-4">{set.weight}</td>
                    <td className="py-2 pr-4 text-white/65">
                      {formatSetDetails(set)}
                    </td>
                    <td className="py-2 pr-4">{set.rpe ?? "-"}</td>
                    <td className="py-2 pr-4">{set.pain ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "danger" | "watch" | "neutral";
}) {
  const toneClass =
    tone === "danger"
      ? "border-rose-400/20 bg-rose-500/[0.08]"
      : tone === "watch"
        ? "border-amber-300/20 bg-amber-400/[0.08]"
        : "border-white/10 bg-white/[0.03]";
  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="text-xs lab-muted">{label}</div>
      <div className="mt-1 text-base font-semibold text-white/90">{value}</div>
    </div>
  );
}

function parseSelectedIds(value: string | undefined, persistedIds: string[], currentId: string) {
  const queryIds = (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const unique = Array.from(new Set([...queryIds, ...persistedIds]));
  return unique.includes(currentId) ? unique : [currentId, ...unique];
}

function sortExercisesByIds(exercises: ExerciseSummary[], orderedIds: string[]) {
  const order = new Map(orderedIds.map((item, index) => [item, index]));

  return [...exercises].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
}

function buildSelectedQuery(exercises: ExerciseSummary[]) {
  const params = new URLSearchParams({
    selected: exercises.map((item) => item.id).join(","),
  });

  return `?${params.toString()}`;
}

function buildExerciseHref(exerciseId: string, selectedExercises: ExerciseSummary[]) {
  return `/exercises/${exerciseId}${buildSelectedQuery(selectedExercises)}`;
}

function sumSessionLoadFromDate(sets: RecentSet[], from: Date) {
  return sets
    .filter((set) => set.performedAt >= from)
    .reduce((total, set) => total + computeSetLoad(set), 0);
}

function sumSessionLoad(
  sets: Pick<RecentSet, "reps" | "weight" | "durationSeconds" | "distanceMeters" | "rpe">[]
) {
  return sets.reduce((total, set) => total + computeSetLoad(set), 0);
}

function formatSetDetails(
  set: Pick<RecentSet, "durationSeconds" | "distanceMeters" | "notes">
) {
  const parts: string[] = [];

  if (set.durationSeconds !== null) {
    parts.push(`${set.durationSeconds}s`);
  }

  if (set.distanceMeters !== null) {
    parts.push(`${set.distanceMeters}m`);
  }

  if (set.notes) {
    parts.push(set.notes);
  }

  return parts.length > 0 ? parts.join(" | ") : "-";
}

function isNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function averageOf(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxOf(values: number[]) {
  if (values.length === 0) return null;
  return Math.max(...values);
}

function getStressState({
  averageRpe,
  maxPain,
  sessionLoad,
  baseline28dLoad,
}: {
  averageRpe: number | null;
  maxPain: number | null;
  sessionLoad: number;
  baseline28dLoad: number;
}) {
  const ratio = baseline28dLoad > 0 ? sessionLoad / baseline28dLoad : 0;

  if ((maxPain ?? 0) >= 7 || (averageRpe ?? 0) >= 9) {
    return {
      title: "High stress signal",
      description: "Pain or exertion is elevated. Keep the next set conservative or move on.",
      classes: "border-rose-400/30 bg-rose-500/10",
    };
  }

  if ((maxPain ?? 0) >= 4 || (averageRpe ?? 0) >= 8 || ratio >= 0.35) {
    return {
      title: "Caution",
      description: "Workload is climbing. Watch your next set and keep technique clean.",
      classes: "border-amber-300/30 bg-amber-400/10",
    };
  }

  return {
    title: "Stable",
    description: "Current logging looks manageable relative to recent work on this exercise.",
    classes: "border-emerald-400/30 bg-emerald-500/10",
  };
}

function getExerciseReadMeta({
  categoryKey,
  sessionSets,
  sessionLoad,
  baseline28dLoad,
  averageRpe,
  maxPain,
  stressTitle,
}: {
  categoryKey: string;
  sessionSets: RecentSet[];
  sessionLoad: number;
  baseline28dLoad: number;
  averageRpe: number | null;
  maxPain: number | null;
  stressTitle: string;
}): ExerciseReadMeta {
  const ratio = baseline28dLoad > 0 ? sessionLoad / baseline28dLoad : 0;
  const totalDuration = sessionSets.reduce((sum, set) => sum + (set.durationSeconds ?? 0), 0);
  const totalDistance = sessionSets.reduce((sum, set) => sum + (set.distanceMeters ?? 0), 0);
  const notedSets = sessionSets.filter((set) => Boolean(set.notes)).length;

  if ((maxPain ?? 0) >= 7) {
    return {
      label: "Main driver",
      title: "Pain is the main reason this exercise is elevated",
      detail: `Pain reached ${maxPain}/10, which matters more than workload trend for this movement.`,
      secondary: "If the next set feels worse, stop or switch movements.",
      classes: "border-rose-400/25 bg-rose-500/10",
    };
  }

  if ((averageRpe ?? 0) >= 9) {
    return {
      label: "Main driver",
      title: "Effort is near-max on this exercise",
      detail: `${sessionSets.length} logged set${sessionSets.length === 1 ? "" : "s"} pushed the average effort to ${averageRpe?.toFixed(1)} RPE.`,
      secondary: "That usually means this exercise is done for the session unless you are intentionally peaking.",
      classes: "border-amber-300/25 bg-amber-400/10",
    };
  }

  if (categoryKey === "conditioning") {
    return {
      label: "Conditioning read",
      title: stressTitle === "Stable" ? "Conditioning work looks contained" : "Conditioning work is driving fatigue",
      detail: `${Math.round(totalDuration / 60)} min and ${Math.round(totalDistance)} m logged on this exercise so far.`,
      secondary:
        totalDuration > 0 || totalDistance > 0
          ? `Session load is ${ratio > 0 ? `${Math.round(ratio * 100)}% of your 28-day exercise baseline.` : "building without a baseline yet."}`
          : "Use duration or distance fields so the readout reflects interval stress more accurately.",
      classes: stressTitle === "Stable" ? "border-sky-400/20 bg-sky-500/8" : "border-cyan-400/25 bg-cyan-500/10",
    };
  }

  if (categoryKey === "core") {
    return {
      label: "Core read",
      title: stressTitle === "Stable" ? "Core work looks controlled" : "Core work is starting to stack up",
      detail: `${sessionSets.length} set${sessionSets.length === 1 ? "" : "s"} logged with ${totalDuration > 0 ? `${totalDuration}s of holds` : "rep-based work"}.`,
      secondary:
        notedSets > 0
          ? `${notedSets} set${notedSets === 1 ? "" : "s"} include notes, which helps keep variation and side work clear.`
          : "Use notes if left/right or variation details matter for this movement.",
      classes: stressTitle === "Stable" ? "border-emerald-400/20 bg-emerald-500/8" : "border-amber-300/25 bg-amber-400/10",
    };
  }

  if (ratio >= 0.35) {
    return {
      label: "Load trend",
      title: "This exercise is running ahead of its usual baseline",
      detail: `Current session load is about ${Math.round(ratio * 100)}% of the last 28-day exercise load.`,
      secondary: "That does not automatically mean stop, but it is the main reason this read moved toward caution.",
      classes: "border-emerald-400/25 bg-emerald-500/10",
    };
  }

  return {
    label: "Load trend",
    title: "This exercise is still inside a manageable range",
    detail:
      sessionSets.length === 0
        ? "No sets logged yet, so this read is waiting for more information."
        : `Session load is tracking below the recent baseline, with ${sessionSets.length} set${sessionSets.length === 1 ? "" : "s"} logged.`,
    secondary:
      averageRpe !== null || maxPain !== null
        ? `Avg RPE ${averageRpe?.toFixed(1) ?? "-"}, max pain ${maxPain ?? "-"}.`
        : "Keep logging effort and pain so this read stays useful.",
    classes: "border-emerald-400/20 bg-emerald-500/8",
  };
}
