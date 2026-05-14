import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { cleanWorkoutName } from "@/app/lib/workouts";
import { WorkoutBuilder } from "./WorkoutBuilder";

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

export default async function NewWorkoutPage() {
  const userId = await requireDbUserId();

  const [exercises, recentWorkouts] = await Promise.all([
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

  const previousWorkouts = recentWorkouts.map((workout) => {
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
        <div className="text-xs uppercase tracking-wide lab-muted">New Workout</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">
          Build and log a workout
        </h1>
        <p className="mt-1 text-sm lab-muted">
          Select exercises, enter sets, then save the completed workout.
        </p>
      </header>

      <WorkoutBuilder exercises={exercises} previousWorkouts={previousWorkouts} />
    </div>
  );
}
