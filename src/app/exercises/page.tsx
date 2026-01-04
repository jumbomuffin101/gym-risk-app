import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";

export const runtime = "nodejs";

export default async function ExercisesPage() {
  await requireDbUserId();

  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true, category: true, _count: { select: { sets: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Exercises</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">
          Exercise library
        </h1>
        <p className="mt-1 text-sm lab-muted">
          Click an exercise to view recent sets and log new work.
        </p>
      </header>

      {exercises.length === 0 ? (
        <div className="lab-card rounded-2xl p-6 text-white/80">
          No exercises yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exercises.map((e) => (
            <Link
              key={e.id}
              href={`/exercises/${e.id}`}
              className="lab-card lab-hover rounded-2xl p-5 block"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-semibold text-white/90 truncate">
                    {e.name}
                  </div>
                  <div className="mt-1 text-xs lab-muted">
                    {e.category ?? "Uncategorized"}
                  </div>
                </div>

                <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white/75">
                  {e._count.sets} sets
                </div>
              </div>

              <div className="mt-4 text-xs text-white/60">
                Open details →
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
