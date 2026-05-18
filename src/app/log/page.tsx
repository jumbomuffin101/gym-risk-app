import Link from "next/link";

import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { prisma } from "@/app/lib/prisma";
import { cleanWorkoutName } from "@/app/lib/workouts";
import { WorkoutBuilder } from "@/app/workouts/new/WorkoutBuilder";

export const runtime = "nodejs";

function formatPreviousWorkoutLabel(startedAt: Date, note: string | null) {
  const date = new Date(startedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const name = cleanWorkoutName(note, 56);

  return name ? `${date} - ${name}` : date;
}

export default async function LogWorkoutPage() {
  const userId = await requireDbUserId();

  const [exercises, recentLogs] = await Promise.all([
    prisma.exercise.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, category: true },
    }),
    prisma.workoutSession.findMany({
      where: {
        userId,
        endedAt: { not: null },
        sets: { some: {} },
      },
      orderBy: { startedAt: "desc" },
      take: 12,
      select: {
        id: true,
        startedAt: true,
        note: true,
        sets: {
          orderBy: { performedAt: "asc" },
          select: {
            id: true,
            exerciseId: true,
            reps: true,
            weight: true,
            rpe: true,
            pain: true,
            exercise: { select: { id: true, name: true, category: true } },
          },
        },
      },
    }),
  ]);

  const previousWorkouts = recentLogs.map((workout) => {
    const exerciseMap = new Map<
      string,
      {
        id: string;
        name: string;
        category: string | null;
        sets: Array<{ id: string; reps: string; weight: string; rpe: string; pain: string }>;
      }
    >();

    for (const set of workout.sets) {
      const current =
        exerciseMap.get(set.exerciseId) ??
        {
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
      exerciseMap.set(set.exerciseId, current);
    }

    return {
      id: workout.id,
      label: formatPreviousWorkoutLabel(workout.startedAt, workout.note),
      name: cleanWorkoutName(workout.note, 120) ?? "",
      exercises: Array.from(exerciseMap.values()),
    };
  });

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
            Choose a previous workout to pre-fill exercises and sets, then edit before saving.
          </p>
        </div>
        <div className="lab-card rounded-2xl p-4">
          <div className="text-sm font-medium text-white/90">Log from scratch</div>
          <p className="mt-1 text-xs leading-5 lab-muted">
            Search exercises, add set rows, duplicate sets, and save the completed session.
          </p>
        </div>
      </div>

      <WorkoutBuilder exercises={exercises} previousWorkouts={previousWorkouts} />
    </div>
  );
}
