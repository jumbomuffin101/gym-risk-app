import Link from "next/link";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { getActiveWorkoutSession } from "@/app/lib/data/workoutSession";
import { startWorkoutSession, endWorkoutSessionAction } from "@/app/exercises/actions";
import { computeSessionRisk } from "@/app/lib/riskEngine";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

type SessionSet = {
  id: string;
  exerciseId: string;
  reps: number;
  weight: number;
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
  tonnage: number;
  avgRpe: number | null;
  maxPain: number | null;
};

export default async function WorkoutPage() {
  const userId = await requireDbUserId();
  const active = await getActiveWorkoutSession(userId);

  if (!active) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="lab-card rounded-2xl p-5 space-y-3">
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

        <div className="lab-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
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

  const riskReasons = await computeSessionRisk(userId, active.id);
  const perExercise = aggregateExercises(sessionSets);
  const totalSets = sessionSets.length;
  const totalExercises = perExercise.length;
  const totalTonnage = sumTonnage(sessionSets);
  const avgRpe = averageOf(sessionSets.map((set) => set.rpe).filter(isNumber));
  const maxPain = maxOf(sessionSets.map((set) => set.pain).filter(isNumber));
  const overallSignal = getOverallSignal({ totalSets, avgRpe, maxPain, riskReasons: riskReasons.length });
  const topExercise = perExercise[0] ?? null;
  const nextMove = getNextMove({ totalSets, totalExercises, maxPain, riskReasons: riskReasons.length });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="lab-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/workouts/new"
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/75 hover:bg-white/[0.06]"
          >
            Workout Flow
          </Link>
          <span className="rounded-full border border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.1)] px-3 py-1.5 text-sm text-white">
            Session Result
          </span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide lab-muted">Workout result</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">Current session</h1>
            <p className="mt-1 text-sm text-white/70">One place to see what this workout produced before ending it.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/workouts/new"
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Exercises hit" value={String(totalExercises)} detail={topExercise ? `Top volume: ${topExercise.name}` : "No logged exercises yet"} />
        <SummaryCard label="Total sets" value={String(totalSets)} detail="All logged sets in this session" />
        <SummaryCard label="Total load" value={totalTonnage.toFixed(1)} detail="Reps x weight across the session" />
        <SummaryCard label="Overall signal" value={overallSignal.title} detail={overallSignal.description} tone={overallSignal.tone} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="lab-card rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white/90">Session by exercise</div>
              <div className="mt-1 text-xs text-white/55">This is the workout-level breakdown, not just individual set history.</div>
            </div>
            <Link
              href="/workouts/new"
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
                  href={`/exercises/${exercise.exerciseId}`}
                  className="block rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-white/90">{exercise.name}</div>
                      <div className="mt-1 text-xs text-white/55">{exercise.category ?? "Uncategorized"}</div>
                    </div>
                    <div className="text-xs text-white/55">Open exercise</div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <MiniMetric label="Sets" value={String(exercise.sets)} />
                    <MiniMetric label="Load" value={exercise.tonnage.toFixed(1)} />
                    <MiniMetric label="Avg RPE" value={exercise.avgRpe !== null ? exercise.avgRpe.toFixed(1) : "-"} />
                    <MiniMetric label="Max pain" value={exercise.maxPain !== null ? String(exercise.maxPain) : "-"} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="lab-card rounded-2xl p-5 space-y-4">
            <div className="text-sm font-semibold text-white/90">Holistic result</div>
            <div className={`rounded-2xl border p-4 ${overallSignal.classes}`}>
              <div className="text-xs uppercase tracking-wide text-white/65">Session signal</div>
              <div className="mt-1 text-lg font-semibold text-white/90">{overallSignal.title}</div>
              <div className="mt-1 text-sm text-white/70">{overallSignal.description}</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <MiniMetric label="Avg RPE" value={avgRpe !== null ? avgRpe.toFixed(1) : "-"} />
              <MiniMetric label="Max pain" value={maxPain !== null ? String(maxPain) : "-"} />
              <MiniMetric label="Risk flags" value={String(riskReasons.length)} />
            </div>
          </section>

          <section className="lab-card rounded-2xl p-5 space-y-4">
            <div className="text-sm font-semibold text-white/90">What this session means</div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm text-white/85">{nextMove.title}</div>
              <div className="mt-1 text-xs text-white/60">{nextMove.detail}</div>
            </div>

            {riskReasons.length > 0 ? (
              <div className="space-y-2">
                {riskReasons.map((reason) => (
                  <div key={reason.kind + reason.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="text-sm text-white/85">{cleanRiskTitle(reason.title)}</div>
                    <div className="mt-1 text-xs text-white/55">Score {Math.round(reason.score)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/75">
                No immediate warning flags in this session so far.
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "stable" | "caution";
}) {
  const toneClasses =
    tone === "stable"
      ? "border-emerald-400/25 bg-emerald-500/10"
      : tone === "caution"
        ? "border-amber-300/25 bg-amber-400/10"
        : "border-white/10 bg-white/[0.03]";

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses}`}>
      <div className="text-xs uppercase tracking-wide lab-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white/90">{value}</div>
      <div className="mt-1 text-xs text-white/60">{detail}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[11px] uppercase tracking-wide lab-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white/90">{value}</div>
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
        tonnage: 0,
        avgRpe: null,
        maxPain: null,
        rpeSum: 0,
        rpeCount: 0,
      };

    existing.sets += 1;
    existing.tonnage += set.reps * set.weight;
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
    .sort((a, b) => b.tonnage - a.tonnage);
}

function sumTonnage(sets: Pick<SessionSet, "reps" | "weight">[]) {
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
      description: "This session is carrying noticeable strain. Review pain and high-effort work before pushing further.",
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
      description: "The session looks productive, but at least one signal needs attention.",
      tone: "caution" as const,
      classes: "border-amber-300/30 bg-amber-400/10",
    };
  }

  return {
    title: "Stable",
    description: "The session looks controlled so far with no major warning flags.",
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
