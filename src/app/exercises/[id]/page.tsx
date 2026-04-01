import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { getActiveWorkoutSession } from "@/app/lib/data/workoutSession";
import { createExerciseDetailSetEntryAction, startWorkoutSession } from "@/app/exercises/actions";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ selected?: string }>;
};

type RecentSet = {
  performedAt: Date;
  reps: number;
  weight: number;
  rpe: number | null;
  pain: number | null;
};

type ExerciseSummary = {
  id: string;
  name: string;
  category: string | null;
};

const CATEGORY_GUIDANCE: Record<
  string,
  {
    title: string;
    note: string;
    repsHint: string;
    weightHint: string;
  }
> = {
  core: {
    title: "Core control focus",
    note: "Use smooth reps and log external load only if you added resistance.",
    repsHint: "8-20 controlled reps",
    weightHint: "Bodyweight or added load",
  },
  cardio: {
    title: "Conditioning proxy",
    note: "This logger still uses reps and weight, so treat reps like intervals and weight like resistance.",
    repsHint: "Intervals or work bouts",
    weightHint: "Resistance level",
  },
  mobility: {
    title: "Mobility proxy",
    note: "Use reps for passes or holds. Keep pain honest so recovery signals stay useful.",
    repsHint: "Reps or holds",
    weightHint: "Band tension or load",
  },
  accessory: {
    title: "Accessory volume",
    note: "Use this to accumulate clean volume without pushing pain or RPE too early.",
    repsHint: "8-15 reps",
    weightHint: "Working load",
  },
};

export default async function ExerciseDetailPage({ params, searchParams }: PageProps) {
  const userId = await requireDbUserId();
  const { id: rawId } = await params;
  const { selected: selectedParam } = await searchParams;
  const id = rawId?.trim();

  if (!id) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="lab-card rounded-2xl p-6">
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

  const selectedIds = parseSelectedIds(selectedParam, id);

  const [exercise, activeSession, recentSets, selectedExercises] = await Promise.all([
    prisma.exercise.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        category: true,
        createdAt: true,
      },
    }),
    getActiveWorkoutSession(userId),
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
          rpe: true,
          pain: true,
        },
      })
    : [];

  if (!exercise) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="lab-card rounded-2xl p-6">
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
  const currentIndex = orderedSelectedExercises.findIndex((item) => item.id === exercise.id);
  const previousExercise = currentIndex > 0 ? orderedSelectedExercises[currentIndex - 1] : null;
  const nextExercise =
    currentIndex >= 0 && currentIndex < orderedSelectedExercises.length - 1
      ? orderedSelectedExercises[currentIndex + 1]
      : null;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const tonnage7d = sumTonnageFromDate(recentSets, sevenDaysAgo);
  const tonnage28d = sumTonnageFromDate(recentSets, twentyEightDaysAgo);
  const lastPerformedAt = recentSets[0]?.performedAt ?? null;
  const lastSet = recentSets[0] ?? null;
  const sessionSetCount = sessionExerciseSets.length;
  const sessionTonnage = sumTonnage(sessionExerciseSets);
  const averageSessionRpe = averageOf(sessionExerciseSets.map((set) => set.rpe).filter(isNumber));
  const maxSessionPain = maxOf(sessionExerciseSets.map((set) => set.pain).filter(isNumber));
  const stressState = getStressState({
    averageRpe: averageSessionRpe,
    maxPain: maxSessionPain,
    sessionTonnage,
    tonnage28d,
  });

  const categoryKey = (exercise.category ?? "").toLowerCase();
  const guidance = CATEGORY_GUIDANCE[categoryKey] ?? {
    title: "Standard strength log",
    note: "Log the working set that best reflects this exercise. Use pain and RPE to keep the risk signal honest.",
    repsHint: "Typical rep target",
    weightHint: "Working load",
  };

  const backTo = orderedSelectedExercises.length > 0 ? "/workouts/new" : "/exercises";
  const startRedirectTo = `/exercises/${exercise.id}${selectedQuery}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="lab-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide lab-muted">Exercise</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">{exercise.name}</h1>
            <p className="mt-1 text-sm lab-muted">{exercise.category ?? "Uncategorized"}</p>
            <p className="mt-2 max-w-2xl text-sm text-white/75">
              Log the current working set, keep the workout moving, and watch volume, effort, and pain in one place.
            </p>
          </div>

          <div className="min-w-[220px] rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-wide lab-muted">Session status</div>
            <div className="mt-2 text-sm font-semibold text-white/90">
              {activeSession ? "Active session in progress" : "No active session"}
            </div>
            <div className="mt-1 text-xs text-white/60">
              {activeSession
                ? `Started ${activeSession.startedAt.toLocaleString()}`
                : "Start a session to unlock logging and exercise flow."}
            </div>
            {orderedSelectedExercises.length > 0 ? (
              <div className="mt-3 text-xs text-white/60">
                Exercise {currentIndex + 1} of {orderedSelectedExercises.length} selected
              </div>
            ) : null}
          </div>
        </div>

        {orderedSelectedExercises.length > 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide lab-muted">Workout flow</div>
                <div className="mt-1 text-sm text-white/80">
                  Move through the selected exercises without losing your place.
                </div>
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
                    Next exercise
                  </Link>
                ) : (
                  <Link
                    href="/workouts"
                    className="inline-flex rounded-xl border border-[rgba(34,197,94,0.24)] bg-[rgba(34,197,94,0.1)] px-3 py-2 text-xs font-medium text-white hover:bg-[rgba(34,197,94,0.15)]"
                  >
                    Review session
                  </Link>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {orderedSelectedExercises.map((item, index) => {
                const isCurrent = item.id === exercise.id;

                return (
                  <Link
                    key={item.id}
                    href={buildExerciseHref(item.id, orderedSelectedExercises)}
                    className={`rounded-xl border px-3 py-2 text-xs transition ${
                      isCurrent
                        ? "border-[rgba(34,197,94,0.32)] bg-[rgba(34,197,94,0.12)] text-white"
                        : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]"
                    }`}
                  >
                    {index + 1}. {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <section className="lab-card rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white/90">Log current set</div>
              <p className="mt-1 text-xs text-white/60">{guidance.note}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-right">
              <div className="text-[11px] uppercase tracking-wide lab-muted">{guidance.title}</div>
              <div className="mt-1 text-xs text-white/65">
                Reps: {guidance.repsHint} | Load: {guidance.weightHint}
              </div>
            </div>
          </div>

          {activeSession ? (
            <div className="rounded-xl border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.06)] p-3 text-sm text-white/85">
              Active session detected. Log into the current workout and use the workout-flow chips above to move between exercises.
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <div className="text-sm text-white/85">No active session.</div>
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

          <form action={createExerciseDetailSetEntryAction} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
            <input type="hidden" name="exerciseId" value={exercise.id} />

            <fieldset disabled={!activeSession} className="space-y-4 disabled:opacity-50">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-1">
                  <div className="text-xs lab-muted">Reps</div>
                  <input
                    name="reps"
                    type="number"
                    min={1}
                    required
                    defaultValue={lastSet?.reps ?? undefined}
                    placeholder={guidance.repsHint}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/35"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-xs lab-muted">Weight</div>
                  <input
                    name="weight"
                    type="number"
                    min={0}
                    step="0.5"
                    required
                    defaultValue={lastSet?.weight ?? undefined}
                    placeholder={guidance.weightHint}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/35"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-xs lab-muted">RPE (optional)</div>
                  <input
                    name="rpe"
                    type="number"
                    min={1}
                    max={10}
                    step="0.5"
                    defaultValue={lastSet?.rpe ?? undefined}
                    placeholder={lastSet?.rpe ? `Last ${lastSet.rpe}` : "6-10"}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/35"
                  />
                </label>

                <label className="space-y-1">
                  <div className="text-xs lab-muted">Pain 0-10 (optional)</div>
                  <input
                    name="pain"
                    type="number"
                    min={0}
                    max={10}
                    step={1}
                    defaultValue={lastSet?.pain ?? undefined}
                    placeholder={lastSet?.pain !== null && lastSet?.pain !== undefined ? `Last ${lastSet.pain}` : "0-10"}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/35"
                  />
                </label>
              </div>

              {lastSet ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/65">
                  Last logged set: {lastSet.reps} reps at {lastSet.weight} load
                  {lastSet.rpe ? `, RPE ${lastSet.rpe}` : ""}
                  {lastSet.pain !== null && lastSet.pain !== undefined ? `, pain ${lastSet.pain}` : ""}.
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/65">
                  No previous set found for this exercise yet. Enter your first working set to establish a baseline.
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <button className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]">
                  Log set into current session
                </button>
                {nextExercise ? (
                  <Link
                    href={buildExerciseHref(nextExercise.id, orderedSelectedExercises)}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
                  >
                    Jump to next exercise
                  </Link>
                ) : null}
              </div>
            </fieldset>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="lab-card rounded-2xl p-5 space-y-4">
            <div className="text-sm font-semibold text-white/90">Live summary</div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <MetricCard label="This session sets" value={String(sessionSetCount)} help="Sets logged for this exercise in the active session." />
              <MetricCard label="This session tonnage" value={sessionTonnage.toFixed(1)} help="Reps x weight for this exercise during the current session." />
              <MetricCard
                label="Average session RPE"
                value={averageSessionRpe !== null ? averageSessionRpe.toFixed(1) : "-"}
                help="Only uses logged RPE values from this session."
              />
              <MetricCard
                label="Max pain this session"
                value={maxSessionPain !== null ? String(maxSessionPain) : "-"}
                help="Highest pain score logged for this exercise in the current session."
              />
            </div>

            <div className={`rounded-2xl border p-4 ${stressState.classes}`}>
              <div className="text-xs uppercase tracking-wide text-white/65">Training signal</div>
              <div className="mt-1 text-sm font-semibold text-white/90">{stressState.title}</div>
              <div className="mt-1 text-xs text-white/70">{stressState.description}</div>
            </div>
          </section>

          <section className="lab-card rounded-2xl p-5 space-y-4">
            <div className="text-sm font-semibold text-white/90">Baseline snapshot</div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <MetricCard label="Last 7d tonnage" value={tonnage7d.toFixed(1)} help="Recent accumulated work for this exercise." />
              <MetricCard label="Last 28d tonnage" value={tonnage28d.toFixed(1)} help="Wider baseline for trend comparison." />
              <MetricCard
                label="Last performed"
                value={lastPerformedAt ? lastPerformedAt.toLocaleString() : "No sets logged"}
                help="Most recent recorded set for this exercise."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={backTo}
                className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06]"
              >
                Back to {orderedSelectedExercises.length > 0 ? "new workout" : "exercises"}
              </Link>
              <Link
                href="/workouts"
                className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06]"
              >
                Workout overview
              </Link>
            </div>
          </section>
        </aside>
      </div>

      <section className="lab-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white/90">Recent sets</div>
          <div className="text-xs text-white/50">Latest 20 entries for this exercise</div>
        </div>

        {recentSets.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/75">
            No sets yet for this exercise.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-white/50">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Reps</th>
                  <th className="py-2 pr-4">Weight</th>
                  <th className="py-2 pr-4">RPE</th>
                  <th className="py-2 pr-4">Pain</th>
                </tr>
              </thead>
              <tbody>
                {recentSets.map((set) => (
                  <tr key={set.performedAt.toISOString()} className="border-t border-white/10 text-white/85">
                    <td className="py-2 pr-4">{new Date(set.performedAt).toLocaleString()}</td>
                    <td className="py-2 pr-4">{set.reps}</td>
                    <td className="py-2 pr-4">{set.weight}</td>
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
  help,
}: {
  label: string;
  value: string;
  help: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs lab-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white/90">{value}</div>
      <div className="mt-1 text-xs text-white/50">{help}</div>
    </div>
  );
}

function parseSelectedIds(value: string | undefined, currentId: string) {
  const items = (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const unique = Array.from(new Set(items));
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

function sumTonnageFromDate(sets: RecentSet[], from: Date) {
  return sets
    .filter((set) => set.performedAt >= from)
    .reduce((total, set) => total + set.reps * set.weight, 0);
}

function sumTonnage(sets: Pick<RecentSet, "reps" | "weight">[]) {
  return sets.reduce((total, set) => total + set.reps * set.weight, 0);
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
  sessionTonnage,
  tonnage28d,
}: {
  averageRpe: number | null;
  maxPain: number | null;
  sessionTonnage: number;
  tonnage28d: number;
}) {
  const ratio = tonnage28d > 0 ? sessionTonnage / tonnage28d : 0;

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
