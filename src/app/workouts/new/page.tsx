import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { getActiveWorkoutSession } from "@/app/lib/data/workoutSession";
import { endWorkoutAction, startOrResumeWorkoutAction } from "@/app/workouts/actions";
import WorkoutLogger from "@/app/workouts/new/WorkoutLogger";

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams?: { sessionId?: string };
}) {
  const userId = await requireDbUserId();

  const requestedId = searchParams?.sessionId?.trim();
  const requestedSession = requestedId
    ? await prisma.workoutSession.findFirst({
        where: { id: requestedId, userId, endedAt: null },
      })
    : null;

  const active = requestedSession ?? (await getActiveWorkoutSession(userId));

  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  });

  const sets = active
    ? await prisma.setEntry.findMany({
        where: { sessionId: active.id, userId },
        orderBy: { performedAt: "desc" },
        take: 24,
        select: {
          id: true,
          reps: true,
          weight: true,
          rpe: true,
          pain: true,
          performedAt: true,
          exercise: { select: { name: true } },
        },
      })
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-10 pt-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide lab-muted">Workout</div>
          <h1 className="text-2xl font-semibold tracking-tight text-white/95">{active ? "Session in progress" : "New workout"}</h1>
        </div>
        {!active ? (
          <form action={startOrResumeWorkoutAction}>
            <button className="rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-xs font-semibold text-black">Start workout</button>
          </form>
        ) : (
          <form action={endWorkoutAction}>
            <input type="hidden" name="sessionId" value={active.id} />
            <button className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/80">End workout</button>
          </form>
        )}
      </header>

      {!active ? (
        <div className="lab-card rounded-2xl p-5 text-sm text-white/70">No active session. Start one to log sets.</div>
      ) : exercises.length === 0 ? (
        <div className="lab-card rounded-2xl p-5">
          <div className="text-sm text-white/75">No exercises yet.</div>
          <Link href="/exercises" className="mt-3 inline-flex rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-xs font-semibold text-black">Create exercise</Link>
        </div>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="lab-card rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide lab-muted">Quick log</div>
            <div className="mt-3">
              <WorkoutLogger sessionId={active.id} exercises={exercises} />
            </div>
          </div>

          <div className="lab-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide lab-muted">Session sets</div>
              <div className="text-xs text-white/60">{sets.length} shown</div>
            </div>
            <div className="mt-3 space-y-2">
              {sets.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70">No sets yet</div>
              ) : (
                sets.map((set) => (
                  <div key={set.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/80">
                    <div className="font-medium text-white/90">{set.exercise.name}</div>
                    <div className="text-white/60">
                      {set.reps} reps • {set.weight > 0 ? `${set.weight} lb` : "Bodyweight"}
                      {set.rpe != null ? ` • RPE ${set.rpe}` : ""}
                      {set.pain != null ? ` • Pain ${set.pain}` : ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
