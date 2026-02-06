import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import ExerciseLibrary from "@/app/exercises/ExerciseLibrary";

export const runtime = "nodejs";

export default async function ExercisesPage() {
  const userId = await requireDbUserId();

  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  });

  const counts = await prisma.setEntry.groupBy({
    by: ["exerciseId"],
    where: { userId },
    _count: { _all: true },
  });

  const countMap = new Map(counts.map((count) => [count.exerciseId, count._count._all]));
  const categories = Array.from(
    new Set(exercises.map((exercise) => exercise.category).filter((category): category is string => !!category))
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-10 pt-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Exercises</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">
          Exercise library
        </h1>
        <p className="mt-1 text-sm lab-muted">
          Search, filter, and open an exercise to log sets.
        </p>
      </header>

      <ExerciseLibrary exercises={exercises} />
    </div>
  );
}
