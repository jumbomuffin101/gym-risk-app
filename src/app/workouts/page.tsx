import Link from "next/link";

import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { prisma } from "@/app/lib/prisma";
import { cleanWorkoutName, formatLoad, setLoad } from "@/app/lib/workouts";
import { WorkoutHistoryActions } from "./WorkoutHistoryActions";

export const runtime = "nodejs";

export default async function WorkoutPage() {
  const userId = await requireDbUserId();

  const workouts = await prisma.workoutSession.findMany({
    where: {
      userId,
      endedAt: { not: null },
      sets: { some: {} },
    },
    orderBy: { startedAt: "desc" },
    take: 30,
    select: {
      id: true,
      startedAt: true,
      note: true,
      sets: {
        select: {
          exerciseId: true,
          reps: true,
          weight: true,
          rpe: true,
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
              Workout history
            </h1>
            <p className="mt-1 text-sm lab-muted">
              Past saved workouts, set counts, and session load.
            </p>
          </div>
          <Link href="/workouts/new" className="btn-primary text-sm">
            Create workout
          </Link>
        </div>
      </header>

      {workouts.length === 0 ? (
        <div className="lab-card rounded-2xl p-6">
          <div className="text-sm font-medium text-white/90">No workouts logged yet.</div>
          <p className="mt-2 text-sm lab-muted">Create one from New Workout.</p>
          <Link href="/workouts/new" className="btn-secondary mt-5">
            New Workout
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => {
            const sessionLoad = workout.sets.reduce((sum, set) => sum + setLoad(set), 0);
            const exerciseCount = new Set(workout.sets.map((set) => set.exerciseId)).size;
            const workoutName = cleanWorkoutName(workout.note);
            const load = formatLoad(sessionLoad);
            const startedAt = new Date(workout.startedAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

            return (
              <article key={workout.id} className="lab-card rounded-2xl p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-white/92">
                      {workoutName ?? "Untitled workout"}
                    </h2>
                    <p className="mt-2 text-sm lab-muted">{startedAt}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-left md:text-right">
                    <div>
                      <div className="text-xs lab-muted">Sets</div>
                      <div className="mt-1 text-sm font-semibold text-white/90">
                        {workout._count.sets}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs lab-muted">Exercises</div>
                      <div className="mt-1 text-sm font-semibold text-white/90">
                        {exerciseCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs lab-muted">Load</div>
                      <div className="mt-1 text-sm font-semibold text-white/90">
                        {load ?? "-"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-start md:justify-end">
                  <WorkoutHistoryActions workoutId={workout.id} initialName={workoutName ?? ""} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
