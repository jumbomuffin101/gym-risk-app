import Link from "next/link";

import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { prisma } from "@/app/lib/prisma";
import { WorkoutHistoryActions } from "./WorkoutHistoryActions";

export const runtime = "nodejs";

export default async function WorkoutPage() {
  const userId = await requireDbUserId();

  const templates = await prisma.workoutSession.findMany({
    where: {
      userId,
      endedAt: null,
      sets: { some: {} },
    },
    orderBy: { startedAt: "desc" },
    take: 30,
    select: {
      id: true,
      note: true,
      startedAt: true,
      sets: {
        select: {
          exerciseId: true,
        },
      },
      _count: { select: { sets: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Workouts</div>
        <div className="mt-1 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white/95">
              Workout templates
            </h1>
            <p className="mt-1 text-sm lab-muted">
              Reusable workout plans you can log from the Log tab.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/log" className="btn-primary text-sm">
              Log workout
            </Link>
            <Link href="/workouts/new" className="btn-secondary text-sm">
              New Workout
            </Link>
          </div>
        </div>
      </header>

      {templates.length === 0 ? (
        <div className="lab-card rounded-2xl p-6">
          <div className="text-sm font-medium text-white/90">No workout templates yet.</div>
          <p className="mt-2 text-sm lab-muted">Create a reusable workout template first.</p>
          <Link href="/workouts/new" className="btn-secondary mt-5">
            New Workout
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => {
            const setCount = template._count.sets;
            const exerciseCount = new Set(template.sets.map((set) => set.exerciseId)).size;
            const updatedAt = new Date(template.startedAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

            return (
              <article key={template.id} className="lab-card rounded-2xl p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-white/92">
                      {template.note ?? "Untitled template"}
                    </h2>
                    <p className="mt-2 text-sm lab-muted">Created {updatedAt}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-left md:text-right">
                    <div>
                      <div className="text-xs lab-muted">Planned sets</div>
                      <div className="mt-1 text-sm font-semibold text-white/90">
                        {setCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs lab-muted">Exercises</div>
                      <div className="mt-1 text-sm font-semibold text-white/90">
                        {exerciseCount}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-start md:justify-end">
                  <WorkoutHistoryActions
                    workoutId={template.id}
                    initialName={template.note ?? "Untitled template"}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
