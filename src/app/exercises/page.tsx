import Image from "next/image";
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { BRAND_ICON_SRC } from "@/lib/brand";
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

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-10 pt-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Image
            src={BRAND_ICON_SRC}
            alt="Gym-Risk"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <div>
            <div className="text-xs uppercase tracking-wide lab-muted">Exercises</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">Exercise library</h1>
            <p className="mt-1 text-sm lab-muted">
              Search, filter, and log sets from your exercise library.
            </p>
          </div>
        </div>
      </header>

      <ExerciseLibrary
        exercises={exercises.map((exercise) => ({
          ...exercise,
          _count: { sets: countMap.get(exercise.id) ?? 0 },
        }))}
      />
    </div>
  );
}
