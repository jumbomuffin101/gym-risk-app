import Link from "next/link";

import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { WorkoutBuilder } from "./WorkoutBuilder";

export const runtime = "nodejs";

export default async function NewWorkoutPage() {
  const userId = await requireDbUserId();

  const [exercises, templates] = await Promise.all([
    prisma.exercise.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, category: true },
    }),
    prisma.workoutTemplate.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 12,
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
    }),
  ]);

  const previousWorkouts = templates.map((template) => ({
    id: template.id,
    label: template.name,
    name: template.name,
    exercises: template.exercises.map((templateExercise) => ({
      id: templateExercise.exercise.id,
      name: templateExercise.exercise.name,
      category: templateExercise.exercise.category,
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
