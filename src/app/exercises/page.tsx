import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { ExerciseLibrary } from "./ExerciseLibrary";

export const runtime = "nodejs";

export default async function ExercisesPage() {
  await requireDbUserId();

  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true, category: true, _count: { select: { sets: true } } },
    orderBy: { name: "asc" },
  });

  const libraryItems = exercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    category: exercise.category,
    setCount: exercise._count.sets,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Exercises</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">
          Exercise library
        </h1>
        <p className="mt-1 text-sm lab-muted">
          Search exercises and open a detail page for training context.
        </p>
      </header>

      {exercises.length === 0 ? (
        <div className="lab-card rounded-2xl p-6 text-white/80">No exercises yet.</div>
      ) : (
        <ExerciseLibrary exercises={libraryItems} />
      )}
    </div>
  );
}
