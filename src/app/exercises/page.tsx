import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { getActiveWorkoutSession } from "@/app/lib/data/workoutSession";
import ExerciseLibraryClient from "./ExerciseLibraryClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const runtime = "nodejs";

export default async function ExercisesPage() {
  const userId = await requireDbUserId();
  const activeSession = await getActiveWorkoutSession(userId);

  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true, category: true, _count: { select: { sets: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Exercises</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">Exercise library</h1>
        <p className="mt-1 text-sm lab-muted">
          Start a session → open an exercise → log sets → dashboard workload + risk updates.
        </p>
      </header>

      {exercises.length === 0 ? (
        <div className="lab-card rounded-2xl p-6 text-white/80">
          No exercises yet. Run the seed script to load the default exercise library.
        </div>
      ) : (
        <ExerciseLibraryClient
          hasActiveSession={Boolean(activeSession)}
          exercises={exercises.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            category: exercise.category,
            setCount: exercise._count.sets,
          }))}
        />
      )}
    </div>
  );
}
