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

type LogTemplate = {
  id: string;
  name: string;
  exercises: Array<{
    id: string;
    exerciseId: string;
    exercise: LogExercise;
    sets: Array<{
      id: string;
      reps: number;
      weight: number;
      rpe: number | null;
      pain: number | null;
    }>;
  }>;
};

type LoggedWorkout = {
  id: string;
  startedAt: Date;
  note: string | null;
  sets: Array<{
    exerciseId: string;
    reps: number;
    weight: number;
    rpe: number | null;
  }>;
  _count: { sets: number };
};

function isMissingTemplateTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");

  return (
    message.includes("WorkoutTemplate") ||
    message.includes("WorkoutTemplateExercise") ||
    message.includes("WorkoutTemplateSet") ||
    message.includes("workoutTemplate") ||
    message.includes("does not exist") ||
    message.includes("P2021")
  );
}

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

async function getSafeTemplates(userId: string): Promise<LogTemplate[]> {
  try {
    return await prisma.workoutTemplate.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        exercises: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            exerciseId: true,
            exercise: { select: { id: true, name: true, category: true } },
            sets: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                reps: true,
                weight: true,
                rpe: true,
                pain: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    if (isMissingTemplateTableError(error)) return [];
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
          select: {
            exerciseId: true,
            reps: true,
            weight: true,
            rpe: true,
          },
        },
        _count: { select: { sets: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function LogWorkoutPage() {
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

  const [exercises, templates, loggedWorkouts] = await Promise.all([
    getSafeExercises(),
    getSafeTemplates(userId),
    getSafeLoggedWorkouts(userId),
  ]);

  const previousWorkouts = templates.map((template) => ({
    id: template.id,
    label: template.name || "Untitled template",
    name: template.name || "",
    exercises: (template.exercises ?? []).map((templateExercise) => ({
      id: templateExercise.exercise?.id ?? templateExercise.exerciseId,
      name: templateExercise.exercise?.name ?? "Unknown exercise",
      category: templateExercise.exercise?.category ?? null,
      sets: templateExercise.sets.map((set) => ({
        id: set.id,
        reps: String(set.reps),
        weight: String(set.weight),
        rpe: set.rpe === null ? "" : String(set.rpe),
        pain: set.pain === null ? "" : String(set.pain),
      })),
    })),
  }));

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
            Choose a workout template to pre-fill exercises and sets, then edit before saving.
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
        copy={{
          previousLabel: "Log from template",
          previousEmptyLabel: "No templates yet",
          previousSelectLabel: "Select template",
          previousConfirm: "Replace the current log with this template?",
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
