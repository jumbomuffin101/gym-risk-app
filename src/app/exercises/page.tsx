import Image from "next/image";
import { BRAND_ICON_SRC } from "@/lib/brand";
import ExerciseLibrary from "@/app/exercises/ExerciseLibrary";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { prisma } from "@/app/lib/prisma";
import { fetchExternalExercises, syncExternalExercisesIntoDb } from "@/app/lib/exerciseSource";

export const runtime = "nodejs";

type ExerciseItem = {
  id: string;
  name: string;
  category: string | null;
  source: "external" | "custom";
  setCount: number;
};

export default async function ExercisesPage() {
  const userId = await requireDbUserId();

  const external = await fetchExternalExercises();
  if (external.length > 0) {
    await syncExternalExercisesIntoDb(external);
  }

  const [exercises, counts] = await Promise.all([
    prisma.exercise.findMany({ orderBy: { name: "asc" } }),
    prisma.setEntry.groupBy({ by: ["exerciseId"], where: { userId }, _count: { _all: true } }),
  ]);

  const countMap = new Map(counts.map((item) => [item.exerciseId, item._count._all]));

  const items: ExerciseItem[] = exercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    category: exercise.category,
    source: exercise.source,
    setCount: countMap.get(exercise.id) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-10 pt-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <Image src={BRAND_ICON_SRC} alt="Gym-Risk" width={32} height={32} className="h-7 w-7 object-contain" />
          <div>
            <div className="text-xs uppercase tracking-wide lab-muted">Exercises</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">Exercise library</h1>
          </div>
        </div>
      </header>

      <ExerciseLibrary initialItems={items} />
    </div>
  );
}
