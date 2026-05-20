import Link from "next/link";

import { getOptionalDbUserId } from "@/app/lib/auth/requireUser";
import { prisma } from "@/app/lib/prisma";
import { cleanWorkoutName, formatLoad, setLoad } from "@/app/lib/workouts";
import { WorkoutBuilder } from "@/app/workouts/new/WorkoutBuilder";
import { LogHistoryActions } from "./LogHistoryActions";

export const runtime = "nodejs";

function formatWorkoutDateTime(startedAt: Date) {
  return new Date(startedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type LogExercise = {
  id: string;
  name: string;
  category: string | null;
};

type LoggedWorkout = {
  id: string;
  startedAt: Date;
  note: string | null;
  sets: Array<{
    id: string;
    exerciseId: string;
    exercise: LogExercise;
    reps: number;
    weight: number;
    rpe: number | null;
    pain: number | null;
  }>;
  _count: { sets: number };
};

type LogPageProps = {
  searchParams?: Promise<{ templateId?: string | string[]; workoutId?: string | string[] }>;
};

async function getSafeUserId() {
  try {
    return await getOptionalDbUserId();
  } catch {
    return null;
  }
}

async function getSafeExercises(): Promise<LogExercise[]> {
  try {
    return await prisma.exercise.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, category: true },
    });
  } catch {
    return [];
  }
}

async function getSafeLoggedWorkouts(userId: string): Promise<LoggedWorkout[]> {
  try {
    return await prisma.workoutSession.findMany({
      where: {
        userId,
        endedAt: { not: null },
        sets: { some: {} },
      },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        startedAt: true,
        note: true,
        sets: {
          orderBy: { performedAt: "asc" },
          select: {
            id: true,
            exerciseId: true,
            exercise: { select: { id: true, name: true, category: true } },
            reps: true,
            weight: true,
            rpe: true,
            pain: true,
          },
        },
        _count: { select: { sets: true } },
      },
    });
  } catch {
    return [];
  }
}

async function getSafeTemplateWorkouts(userId: string): Promise<LoggedWorkout[]> {
  try {
    return await prisma.workoutSession.findMany({
      where: {
        userId,
        endedAt: null,
        sets: { some: {} },
      },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        startedAt: true,
        note: true,
        sets: {
          orderBy: { performedAt: "asc" },
          select: {
            id: true,
            exerciseId: true,
            exercise: { select: { id: true, name: true, category: true } },
            reps: true,
            weight: true,
            rpe: true,
            pain: true,
          },
        },
        _count: { select: { sets: true } },
      },
    });
  } catch {
    return [];
  }
}

function buildPreviousWorkoutExercises(workout: LoggedWorkout) {
  const exercises = new Map<
    string,
    LogExercise & {
      sets: Array<{
        id: string;
        reps: string;
        weight: string;
        rpe: string;
        pain: string;
      }>;
    }
  >();

  for (const set of workout.sets) {
    const current = exercises.get(set.exerciseId) ?? {
      id: set.exercise.id,
      name: set.exercise.name,
      category: set.exercise.category,
      sets: [],
    };

    current.sets.push({
      id: set.id,
      reps: String(set.reps),
      weight: String(set.weight),
      rpe: set.rpe === null ? "" : String(set.rpe),
      pain: set.pain === null ? "" : String(set.pain),
    });
    exercises.set(set.exerciseId, current);
  }

  return Array.from(exercises.values());
}

export default async function LogWorkoutPage({ searchParams }: LogPageProps) {
  const userId = await getSafeUserId();

  if (!userId) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="lab-card rounded-2xl p-6">
          <div className="text-xs uppercase tracking-wide lab-muted">Log</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white/95">
            Sign in to log workouts
          </h1>
          <p className="mt-2 text-sm lab-muted">
            Logging requires an account so completed workouts can power your dashboard analytics.
          </p>
          <Link href="/signin?callbackUrl=/log" className="btn-primary mt-5 text-sm">
            Sign in
          </Link>
        </section>
      </div>
    );
  }

  const params = searchParams ? await searchParams : {};
  const rawTemplateId = params.templateId;
  const rawWorkoutId = params.workoutId;
  const initialPreviousWorkoutId =
    (Array.isArray(rawTemplateId) ? rawTemplateId[0] : rawTemplateId) ??
    (Array.isArray(rawWorkoutId) ? rawWorkoutId[0] : rawWorkoutId) ??
    null;

  const [exercises, templateWorkouts, loggedWorkouts] = await Promise.all([
    getSafeExercises(),
    getSafeTemplateWorkouts(userId),
    getSafeLoggedWorkouts(userId),
  ]);

  const templateOptions = templateWorkouts.map((workout) => ({
    id: workout.id,
    label: `Template: ${cleanWorkoutName(workout.note) ?? "Untitled template"}`,
    name: cleanWorkoutName(workout.note) ?? "",
    exercises: buildPreviousWorkoutExercises(workout),
  }));
  const previousLogOptions = loggedWorkouts.map((workout) => ({
    id: workout.id,
    label: `Previous log: ${cleanWorkoutName(workout.note) ?? "Untitled workout"} - ${formatWorkoutDateTime(workout.startedAt)}`,
    name: cleanWorkoutName(workout.note) ?? "",
    exercises: buildPreviousWorkoutExercises(workout),
  }));
  const previousWorkouts = [...templateOptions, ...previousLogOptions];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide lab-muted">Log</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">
              Log completed workout
            </h1>
            <p className="mt-1 max-w-2xl text-sm lab-muted">
              Save a training session from scratch or start from a previous workout. Logged
              workouts power the dashboard, training load, heatmap, and risk feed.
            </p>
          </div>
          <Link href="/workouts/new" className="btn-secondary w-fit text-sm">
            New Workout builder
          </Link>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="lab-card rounded-2xl p-4">
          <div className="text-sm font-medium text-white/90">Log from existing workout</div>
          <p className="mt-1 text-xs leading-5 lab-muted">
            Choose a template or previous logged workout to pre-fill exercises and sets, then edit before saving.
          </p>
        </div>
        <div className="lab-card rounded-2xl p-4">
          <div className="text-sm font-medium text-white/90">Log from scratch</div>
          <p className="mt-1 text-xs leading-5 lab-muted">
            Search exercises, add set rows, duplicate sets, and save the completed session.
          </p>
        </div>
      </div>

      <WorkoutBuilder
        exercises={exercises}
        previousWorkouts={previousWorkouts}
        initialPreviousWorkoutId={initialPreviousWorkoutId}
        copy={{
          previousLabel: "Use template or previous log",
          previousEmptyLabel: "No templates or previous logs yet",
          previousSelectLabel: "Select workout",
          previousConfirm: "Replace the current log with this workout?",
          redirectTo: "/log",
        }}
      />

      <section className="lab-card rounded-2xl p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide lab-muted">Log history</div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white/95">
              Logged workouts
            </h2>
            <p className="mt-1 text-sm lab-muted">
              Completed sessions used for dashboard analytics.
            </p>
          </div>
          <div className="text-xs lab-muted">{loggedWorkouts.length} shown</div>
        </div>

        {loggedWorkouts.length === 0 ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="text-sm text-white/85">No logged workouts yet.</div>
            <p className="mt-1 text-sm lab-muted">
              Save a log above to start building dashboard analytics.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {loggedWorkouts.map((workout) => {
              const workoutName = cleanWorkoutName(workout.note) ?? "Untitled workout";
              const sessionLoad = workout.sets.reduce((sum, set) => sum + setLoad(set), 0);
              const exerciseCount = new Set(workout.sets.map((set) => set.exerciseId)).size;

              return (
                <article key={workout.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white/92">{workoutName}</h3>
                      <p className="mt-2 text-sm lab-muted">{formatWorkoutDateTime(workout.startedAt)}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-left md:text-right">
                      <div>
                        <div className="text-xs lab-muted">Sets</div>
                        <div className="mt-1 text-sm font-semibold text-white/90">{workout._count.sets}</div>
                      </div>
                      <div>
                        <div className="text-xs lab-muted">Exercises</div>
                        <div className="mt-1 text-sm font-semibold text-white/90">{exerciseCount}</div>
                      </div>
                      <div>
                        <div className="text-xs lab-muted">Load</div>
                        <div className="mt-1 text-sm font-semibold text-white/90">{formatLoad(sessionLoad) ?? "-"}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-start md:justify-end">
                    <LogHistoryActions
                      workoutId={workout.id}
                      initialName={workoutName}
                      initialStartedAt={workout.startedAt.toISOString()}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
