import Link from "next/link";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { getActiveWorkoutSession } from "@/app/lib/data/workoutSession";
import { startWorkoutSession, endWorkoutSessionAction } from "@/app/exercises/actions";
import { computeSessionRisk, type RiskReason } from "@/app/lib/riskEngine";
import { prisma } from "@/app/lib/prisma";
import { readSessionPlan } from "@/app/lib/sessionPlan";
import SessionProgressStrip from "@/app/components/SessionProgressStrip";
import { computeSetLoad } from "@/lib/metrics/load";

export const runtime = "nodejs";

type PageProps = {
  searchParams: Promise<{ selected?: string }>;
};

type SessionSet = {
  id: string;
  exerciseId: string;
  reps: number;
  weight: number;
  durationSeconds: number | null;
  distanceMeters: number | null;
  rpe: number | null;
  pain: number | null;
  exercise: {
    id: string;
    name: string;
    category: string | null;
  };
};

type ExerciseAggregate = {
  exerciseId: string;
  name: string;
  category: string | null;
  sets: number;
  sessionLoad: number;
  avgRpe: number | null;
  maxPain: number | null;
};

export default async function WorkoutPage({ searchParams }: PageProps) {
  const userId = await requireDbUserId();
  const { selected: selectedParam } = await searchParams;
  const active = await getActiveWorkoutSession(userId);
  const selectedIds = parseSelectedIds(selectedParam, readSessionPlan(active?.note).selectedExerciseIds);

  if (!active) {
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
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/75">
              Session Result
            </span>
          </div>
          <div className="text-xs uppercase tracking-wide lab-muted">Workout result</div>
          <h1 className="text-2xl font-semibold tracking-tight text-white/95">No active session</h1>
          <p className="text-sm text-white/70">Start a workout flow, select exercises, and this page will summarize the full session.</p>
        </header>

        <div className="lab-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white/90">Nothing to summarize yet</div>
            <div className="mt-1 text-xs text-white/60">Once you start logging, this page becomes the whole-session view.</div>
          </div>

          <form action={startWorkoutSession}>
            <input type="hidden" name="redirectTo" value="/workouts/new" />
            <button
              className="lab-hover rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-sm font-semibold text-black"
              style={{
                boxShadow: "0 0 0 1px rgba(34,197,94,0.25), 0 18px 55px rgba(34,197,94,0.12)",
              }}
            >
              Start workout flow
            </button>
          </form>
        </div>
      </div>
    );
  }

  const sessionSets = await prisma.setEntry.findMany({
    where: { sessionId: active.id, userId },
    orderBy: [{ performedAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      exerciseId: true,
      reps: true,
      weight: true,
      durationSeconds: true,
      distanceMeters: true,
      rpe: true,
      pain: true,
      exercise: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
    },
  });
  const selectedExercises = selectedIds.length
    ? await prisma.exercise.findMany({
        where: { id: { in: selectedIds } },
        select: {
          id: true,
          name: true,
          category: true,
        },
      })
    : [];

  const riskReasons = await computeSessionRisk(userId, active.id);
  const perExercise = aggregateExercises(sessionSets);
  const orderedSelectedExercises = sortSelectedExercises(selectedExercises, selectedIds);
  const selectedQuery = orderedSelectedExercises.length > 0 ? buildSelectedQuery(orderedSelectedExercises) : "";
  const totalSets = sessionSets.length;
  const totalExercises = perExercise.length;
  const totalSessionLoad = sumSessionLoad(sessionSets);
  const avgRpe = averageOf(sessionSets.map((set) => set.rpe).filter(isNumber));
  const maxPain = maxOf(sessionSets.map((set) => set.pain).filter(isNumber));
  const overallSignal = getOverallSignal({ totalSets, avgRpe, maxPain, riskReasons: riskReasons.length });
  const topExercise = perExercise[0] ?? null;
  const nextMove = getNextMove({ totalSets, totalExercises, maxPain, riskReasons: riskReasons.length });
  const nextExerciseId =
    orderedSelectedExercises.find((exercise) => !perExercise.some((item) => item.exerciseId === exercise.id))?.id ??
    orderedSelectedExercises[0]?.id ??
    perExercise[0]?.exerciseId ??
    null;
  const continueLoggingHref = nextExerciseId
    ? buildExerciseHref(nextExerciseId, orderedSelectedExercises)
    : "/workouts/new";
  const completedExerciseIds = new Set(perExercise.map((item) => item.exerciseId));
  const progressSource =
    orderedSelectedExercises.length > 0
      ? orderedSelectedExercises
      : perExercise.map((item) => ({ id: item.exerciseId, name: item.name, category: item.category }));
  const progressItems = progressSource.map((item) => ({
    id: item.id,
    label: item.name,
    href:
      orderedSelectedExercises.length > 0
        ? buildExerciseHref(item.id, orderedSelectedExercises)
        : `/exercises/${item.id}`,
    state:
      item.id === nextExerciseId
        ? ("current" as const)
        : completedExerciseIds.has(item.id)
          ? ("completed" as const)
          : ("remaining" as const),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header className="lab-card rounded-2xl p-4 space-y-2.5">
        <div className="flex flex-wrap gap-2">
          <Link
            href={selectedQuery ? `/workouts/new${selectedQuery}` : "/workouts/new"}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/75 hover:bg-white/[0.06]"
          >
            Workout Flow
          </Link>
          <span className="rounded-full border border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.1)] px-3 py-1.5 text-sm text-white">
            Session Result
          </span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide lab-muted">Workout result</div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-white/95">Current session</h1>
            <p className="mt-1 text-sm text-white/70">See the main takeaway, then decide whether to keep going or end the session.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={selectedQuery ? `/workouts/new${selectedQuery}` : "/workouts/new"}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
            >
              Back to flow
            </Link>
            <form action={endWorkoutSessionAction}>
              <input type="hidden" name="sessionId" value={active.id} />
              <button className="rounded-xl border border-[rgba(34,197,94,0.24)] bg-[rgba(34,197,94,0.1)] px-4 py-2 text-sm font-medium text-white hover:bg-[rgba(34,197,94,0.15)]">
                End session
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className={`rounded-2xl border p-4 ${overallSignal.classes}`}>
          <div className="text-xs uppercase tracking-wide text-white/65">Session read</div>
          <div className="mt-1 text-2xl font-semibold text-white/90">{overallSignal.title}</div>
          <div className="mt-2 text-sm text-white/75">{overallSignal.description}</div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <MiniMetric label="Exercises" value={String(totalExercises)} />
            <MiniMetric label="Sets" value={String(totalSets)} />
            <MiniMetric label="Session load" value={totalSessionLoad.toFixed(1)} />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
          <MiniMetric label="Most work" value={topExercise ? topExercise.name : "-"} />
          <MiniMetric label="Avg RPE" value={avgRpe !== null ? avgRpe.toFixed(1) : "-"} />
          <MiniMetric label="Watchouts" value={String(riskReasons.length)} />
        </div>
      </section>

      <SessionProgressStrip items={progressItems} title="Flow progress" />

      <div className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
        <section className="lab-card rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white/90">Exercise breakdown</div>
              <div className="mt-1 text-xs text-white/55">See where the work in this session landed.</div>
            </div>
            <Link
              href={continueLoggingHref}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06]"
            >
              Continue logging
            </Link>
          </div>

          {perExercise.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/75">
              No sets logged yet. Add a set from the workout flow and the session breakdown will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {perExercise.map((exercise) => (
                <Link
                  key={exercise.exerciseId}
                  href={buildExerciseHref(exercise.exerciseId, orderedSelectedExercises)}
                  className="block rounded-xl border border-white/10 bg-white/[0.02] p-3 transition hover:bg-white/[0.04]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-white/90">{exercise.name}</div>
                      <div className="mt-1 text-xs text-white/55">{exercise.category ?? "Uncategorized"}</div>
                    </div>
                    <div className="text-xs text-white/55">Open exercise</div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-4">
                    <MiniMetric label="Sets" value={String(exercise.sets)} />
                    <MiniMetric label="Session load" value={exercise.sessionLoad.toFixed(1)} />
                    <MiniMetric label="Avg RPE" value={exercise.avgRpe !== null ? exercise.avgRpe.toFixed(1) : "-"} />
                    <MiniMetric label="Max pain" value={exercise.maxPain !== null ? String(exercise.maxPain) : "-"} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="lab-card rounded-2xl p-4 space-y-3">
            <div className="text-sm font-semibold text-white/90">Coach note</div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm text-white/85">{nextMove.title}</div>
              <div className="mt-1 text-xs text-white/60">{nextMove.detail}</div>
            </div>

            {riskReasons.length > 0 ? (
              <div className="space-y-2">
                {riskReasons.map((reason) => (
                  <RiskReasonCard key={reason.kind + reason.title} reason={reason} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/75">
                No immediate watchouts in this session so far.
              </div>
            )}
          </section>

          <section className="lab-card rounded-2xl p-4 space-y-3">
            <div className="text-sm font-semibold text-white/90">Quick stats</div>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              <MiniMetric label="Avg RPE" value={avgRpe !== null ? avgRpe.toFixed(1) : "-"} />
              <MiniMetric label="Max pain" value={maxPain !== null ? String(maxPain) : "-"} />
              <MiniMetric label="Top exercise" value={topExercise ? topExercise.name : "-"} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
      <div className="text-[11px] uppercase tracking-wide lab-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white/90">{value}</div>
    </div>
  );
}

function RiskReasonCard({ reason }: { reason: RiskReason }) {
  const meta = getRiskReasonMeta(reason);

  return (
    <div className={`rounded-xl border p-3 ${meta.classes}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-white/55">{meta.label}</div>
          <div className="mt-1 text-sm font-medium text-white/90">{meta.title}</div>
        </div>
        <div className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-[11px] text-white/70">
          {meta.scoreLabel}
        </div>
      </div>
      <div className="mt-2 text-xs text-white/65">{meta.description}</div>
      {meta.detail ? <div className="mt-2 text-xs text-white/50">{meta.detail}</div> : null}
    </div>
  );
}

function aggregateExercises(sessionSets: SessionSet[]): ExerciseAggregate[] {
  const map = new Map<
    string,
    ExerciseAggregate & {
      rpeSum: number;
      rpeCount: number;
    }
  >();

  for (const set of sessionSets) {
    const existing =
      map.get(set.exerciseId) ??
      {
        exerciseId: set.exerciseId,
        name: set.exercise.name,
        category: set.exercise.category,
        sets: 0,
        sessionLoad: 0,
        avgRpe: null,
        maxPain: null,
        rpeSum: 0,
        rpeCount: 0,
      };

    existing.sets += 1;
    existing.sessionLoad += computeSetLoad(set);
    if (set.rpe !== null) {
      existing.rpeSum += set.rpe;
      existing.rpeCount += 1;
      existing.avgRpe = existing.rpeSum / existing.rpeCount;
    }
    existing.maxPain =
      set.pain === null ? existing.maxPain : Math.max(existing.maxPain ?? 0, set.pain);

    map.set(set.exerciseId, existing);
  }

  return [...map.values()]
    .map(({ rpeSum: _rpeSum, rpeCount: _rpeCount, ...exercise }) => exercise)
    .sort((a, b) => b.sessionLoad - a.sessionLoad);
}

function sumSessionLoad(
  sets: Pick<SessionSet, "reps" | "weight" | "durationSeconds" | "distanceMeters" | "rpe">[]
) {
  return sets.reduce((total, set) => total + computeSetLoad(set), 0);
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

function getOverallSignal({
  totalSets,
  avgRpe,
  maxPain,
  riskReasons,
}: {
  totalSets: number;
  avgRpe: number | null;
  maxPain: number | null;
  riskReasons: number;
}) {
  if ((maxPain ?? 0) >= 7 || (avgRpe ?? 0) >= 9 || riskReasons >= 2) {
    return {
      title: "High stress",
      description: "This session is carrying noticeable strain. Review pain and hard efforts before pushing further.",
      tone: "caution" as const,
      classes: "border-rose-400/30 bg-rose-500/10",
    };
  }

  if (totalSets === 0) {
    return {
      title: "Waiting for data",
      description: "Log a set and this page will turn into a full session summary.",
      tone: "neutral" as const,
      classes: "border-white/10 bg-white/[0.03]",
    };
  }

  if ((maxPain ?? 0) >= 4 || (avgRpe ?? 0) >= 8 || riskReasons >= 1) {
    return {
      title: "Caution",
      description: "The session looks productive, but at least one thing needs attention.",
      tone: "caution" as const,
      classes: "border-amber-300/30 bg-amber-400/10",
    };
  }

  return {
    title: "Stable",
      description: "The session looks controlled so far with no major watchouts.",
    tone: "stable" as const,
    classes: "border-emerald-400/30 bg-emerald-500/10",
  };
}

function getNextMove({
  totalSets,
  totalExercises,
  maxPain,
  riskReasons,
}: {
  totalSets: number;
  totalExercises: number;
  maxPain: number | null;
  riskReasons: number;
}) {
  if (totalSets === 0) {
    return {
      title: "No work logged yet.",
      detail: "Return to Workout Flow, open an exercise, and log the first working set.",
    };
  }

  if ((maxPain ?? 0) >= 7 || riskReasons >= 2) {
    return {
      title: "Wrap up or reduce intensity.",
      detail: "The session is showing stronger warning signals. Ending here is reasonable.",
    };
  }

  if (totalExercises < 2) {
    return {
      title: "The workout is still narrow.",
      detail: "If this was only one lift, add another exercise from Workout Flow or end the session cleanly.",
    };
  }

  return {
    title: "The session has a usable shape.",
    detail: "You can either keep logging through Workout Flow or end the session and move on.",
  };
}

function cleanRiskTitle(value: string) {
  return value.replaceAll("â‰¥", ">=");
}

function getRiskReasonMeta(reason: RiskReason) {
  const scoreLabel =
    reason.score >= 80 ? "High" : reason.score >= 60 ? "Watch" : "Monitor";

  switch (reason.kind) {
    case "pain_flag": {
      const maxPain = typeof reason.details.maxPain === "number" ? reason.details.maxPain : null;
      const count = typeof reason.details.count === "number" ? reason.details.count : null;
      return {
        label: "Pain",
        title: maxPain !== null ? `Pain hit ${maxPain}/10 during the session` : "Pain was flagged during the session",
        description:
          "Pain-based watchouts usually matter more than load trends. Reducing intensity or stopping here is reasonable.",
        detail: count !== null ? `${count} set${count === 1 ? "" : "s"} crossed the pain threshold.` : null,
        classes: "border-rose-400/25 bg-rose-500/10",
        scoreLabel,
      };
    }
    case "rpe_spike":
    case "rpe_warning": {
      const hardSets = Array.isArray(reason.details.hardSets) ? reason.details.hardSets.length : null;
      return {
        label: "Intensity",
        title: reason.kind === "rpe_spike" ? "Several near-max sets showed up" : "Near-max effort showed up",
        description:
          "Effort is running high. If speed or control is dropping, move to easier work or end the session cleanly.",
        detail: hardSets !== null ? `${hardSets} hard set${hardSets === 1 ? "" : "s"} reached RPE 9 or above.` : null,
        classes: "border-amber-300/25 bg-amber-400/10",
        scoreLabel,
      };
    }
    case "conditioning_density": {
      const duration = typeof reason.details.totalDurationSeconds === "number" ? reason.details.totalDurationSeconds : 0;
      const distance = typeof reason.details.totalDistanceMeters === "number" ? reason.details.totalDistanceMeters : 0;
      return {
        label: "Conditioning",
        title: "Conditioning strain stacked up quickly",
        description:
          "Long or hard bouts drove a higher fatigue signal than a normal strength block would show.",
        detail: `${Math.round(duration / 60)} min total work and ${Math.round(distance)} m logged.`,
        classes: "border-sky-400/25 bg-sky-500/10",
        scoreLabel,
      };
    }
    case "conditioning_load_spike": {
      const pct = typeof reason.details.pct === "number" ? reason.details.pct : null;
      return {
        label: "Conditioning",
        title: "Conditioning load jumped above your baseline",
        description:
          "This session carried more conditioning stress than your recent pattern, even if the set count looks normal.",
        detail: pct !== null ? `About ${pct}% above the 7-day conditioning average.` : null,
        classes: "border-cyan-400/25 bg-cyan-500/10",
        scoreLabel,
      };
    }
    case "volume_spike": {
      const category = typeof reason.details.category === "string" ? reason.details.category : "this category";
      const pct = typeof reason.details.pct === "number" ? reason.details.pct : null;
      return {
        label: "Load spike",
        title: `Load climbed fast in ${category}`,
        description:
          "The session load in this movement bucket ran ahead of your recent baseline and may need a lighter finish.",
        detail: pct !== null ? `About ${pct}% above your recent average.` : null,
        classes: "border-emerald-400/25 bg-emerald-500/10",
        scoreLabel,
      };
    }
    default:
      return {
        label: "Watchout",
        title: reason.title,
        description: "This session produced a rule-based watchout worth reviewing before pushing further.",
        detail: null,
        classes: "border-white/10 bg-white/[0.03]",
        scoreLabel,
      };
  }
}

function parseSelectedIds(value: string | undefined, persistedIds: string[]) {
  return Array.from(
    new Set(
      [...(value ?? "").split(","), ...persistedIds]
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function sortSelectedExercises(
  exercises: { id: string; name: string; category: string | null }[],
  orderedIds: string[]
) {
  const order = new Map(orderedIds.map((item, index) => [item, index]));
  return [...exercises].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
}

function buildSelectedQuery(exercises: { id: string }[]) {
  const params = new URLSearchParams({
    selected: exercises.map((item) => item.id).join(","),
  });

  return `?${params.toString()}`;
}

function buildExerciseHref(exerciseId: string, selectedExercises: { id: string }[]) {
  if (selectedExercises.length === 0) {
    return `/exercises/${exerciseId}`;
  }

  return `/exercises/${exerciseId}${buildSelectedQuery(selectedExercises)}`;
}
