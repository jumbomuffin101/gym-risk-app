import Link from "next/link";

import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

function setLoad(set: { reps: number; weight: number; rpe: number | null }) {
  return set.reps * set.weight * (set.rpe ?? 1);
}

function formatLoad(value: number) {
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value).toLocaleString();
}

function cleanSessionNote(note: string | null) {
  const value = note?.trim();
  if (!value) return null;

  const lower = value.toLowerCase();
  const looksInternal =
    value.startsWith("{") ||
    value.startsWith("[") ||
    value.includes("[object Object]") ||
    lower === "null" ||
    lower === "undefined" ||
    lower.includes('"') ||
    lower.includes("=>") ||
    lower.includes("\u00e2") ||
    lower.includes("\u00c3");

  if (looksInternal) return null;
  return value.length > 140 ? `${value.slice(0, 137)}...` : value;
}

export default async function WorkoutPage() {
  const userId = await requireDbUserId();

  const workouts = await prisma.workoutSession.findMany({
    where: {
      userId,
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
            const note = cleanSessionNote(workout.note);
            const load = formatLoad(sessionLoad);

            return (
              <article key={workout.id} className="lab-card rounded-2xl p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-white/92">
                      {new Date(workout.startedAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </h2>
                    {note ? <p className="mt-2 text-sm lab-muted">{note}</p> : null}
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-right">
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
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
