import Link from "next/link";

import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { WorkoutBuilder } from "./WorkoutBuilder";

export const runtime = "nodejs";

type WorkoutPlan = {
  id: string;
  startedAt: Date;
  note: string | null;
  sets: Array<{
    id: string;
    exerciseId: string;
    exercise: {
      id: string;
      name: string;
      category: string | null;
    };
    reps: number;
    weight: number;
    rpe: number | null;
    pain: number | null;
  }>;
};

function buildPlanExercises(plan: WorkoutPlan) {
  const exercises = new Map<
    string,
    {
      id: string;
      name: string;
      category: string | null;
      sets: Array<{
        id: string;
        reps: string;
        weight: string;
        rpe: string;
        pain: string;
      }>;
    }
  >();

  for (const set of plan.sets) {
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

export default async function NewWorkoutPage() {
  const userId = await requireDbUserId();

  const [exercises, plans] = await Promise.all([
    prisma.exercise.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, category: true },
    }),
    prisma.workoutSession.findMany({
      where: {
        userId,
        endedAt: null,
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
            exercise: { select: { id: true, name: true, category: true } },
            reps: true,
            weight: true,
            rpe: true,
            pain: true,
          },
        },
      },
    }),
  ]);

  const previousWorkouts = plans.map((plan) => ({
    id: plan.id,
    label: plan.note ?? "Untitled template",
    name: plan.note ?? "",
    exercises: buildPlanExercises(plan),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide lab-muted">New Workout</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">
              Create workout template
            </h1>
            <p className="mt-1 max-w-2xl text-sm lab-muted">
              Create a reusable workout template. Log it later from the Log tab.
            </p>
          </div>
          <Link href="/log" className="btn-primary w-fit text-sm">
            Log workout
          </Link>
        </div>
      </header>

      <WorkoutBuilder
        exercises={exercises}
        previousWorkouts={previousWorkouts}
        copy={{
          builderEyebrow: "Workout builder",
          builderTitle: "Reusable workout shape",
          saveLabel: "Save template",
          workoutDateHelper: "",
          previousLabel: "Duplicate existing template",
          previousEmptyLabel: "No templates yet",
          previousSelectLabel: "Select template",
          previousConfirm: "Replace the current workout builder with this template?",
          emptyMessage: "Select exercises from the library to build a workout shape.",
          saveMode: "template",
          redirectTo: "/workouts",
        }}
      />
    </div>
  );
}
