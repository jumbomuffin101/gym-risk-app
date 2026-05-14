import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { WorkoutBuilder } from "./WorkoutBuilder";

export const runtime = "nodejs";

export default async function NewWorkoutPage() {
  await requireDbUserId();

  const exercises = await prisma.exercise.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true },
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

      <WorkoutBuilder exercises={exercises} />
    </div>
  );
}
