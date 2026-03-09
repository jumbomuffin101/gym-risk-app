import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { getActiveWorkoutSession } from "@/app/lib/data/workoutSession";
import { createExerciseDetailSetEntryAction, startWorkoutSession } from "@/app/exercises/actions";

export const runtime = "nodejs";

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireDbUserId();
  const { id: rawId } = await params;
  const id = rawId?.trim();

  if (!id) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="lab-card rounded-2xl p-6">
          <div className="text-lg font-semibold text-white/90">Exercise not found</div>
          <p className="mt-2 text-sm lab-muted">That exercise could not be loaded.</p>
          <Link
            href="/exercises"
            className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
          >
            Back to exercises
          </Link>
        </div>
      </div>
    );
  }

  const [exercise, activeSession, recentSets] = await Promise.all([
    prisma.exercise.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        category: true,
        createdAt: true,
      },
    }),
    getActiveWorkoutSession(userId),
    prisma.setEntry.findMany({
      where: {
        userId,
        exerciseId: id,
      },
      orderBy: { performedAt: "desc" },
      take: 20,
      select: {
        id: true,
        performedAt: true,
        reps: true,
        weight: true,
        rpe: true,
        pain: true,
      },
    }),
  ]);

  if (!exercise) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="lab-card rounded-2xl p-6">
          <div className="text-lg font-semibold text-white/90">Exercise not found</div>
          <p className="mt-2 text-sm lab-muted">That exercise does not exist in your library.</p>
          <Link
            href="/exercises"
            className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
          >
            Back to exercises
          </Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const tonnage7d = sumTonnageFromDate(recentSets, sevenDaysAgo);
  const tonnage28d = sumTonnageFromDate(recentSets, twentyEightDaysAgo);
  const lastPerformedAt = recentSets[0]?.performedAt ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Exercise</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">{exercise.name}</h1>
        <p className="mt-1 text-sm lab-muted">{exercise.category ?? "Uncategorized"}</p>
        <p className="mt-2 text-sm text-white/75">
          This is an analytics-first log. Sets update workload and risk signals.
        </p>
      </header>

      <section className="lab-card rounded-2xl p-5 space-y-4">
        <div className="text-sm font-semibold text-white/90">Quick Actions</div>

        {activeSession ? (
          <div className="rounded-xl border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.06)] p-3 text-sm text-white/85">
            Active session detected. Log set into current session.
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <div className="text-sm text-white/85">No active session.</div>
            <form action={startWorkoutSession}>
              <input type="hidden" name="redirectTo" value={`/exercises/${exercise.id}`} />
              <button
                className="lab-hover rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-sm font-semibold text-black"
                style={{
                  boxShadow: "0 0 0 1px rgba(34,197,94,0.25), 0 18px 55px rgba(34,197,94,0.12)",
                }}
              >
                Start session
              </button>
            </form>
          </div>
        )}

        <form action={createExerciseDetailSetEntryAction} className="rounded-xl border border-white/10 p-4 space-y-3">
          <input type="hidden" name="exerciseId" value={exercise.id} />

          <fieldset disabled={!activeSession} className="space-y-3 disabled:opacity-50">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1">
                <div className="text-xs lab-muted">Reps</div>
                <input
                  name="reps"
                  type="number"
                  min={1}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90"
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs lab-muted">Weight</div>
                <input
                  name="weight"
                  type="number"
                  min={0}
                  step="0.5"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90"
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs lab-muted">RPE (optional)</div>
                <input
                  name="rpe"
                  type="number"
                  min={1}
                  max={10}
                  step="0.5"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90"
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs lab-muted">Pain 0-10 (optional)</div>
                <input
                  name="pain"
                  type="number"
                  min={0}
                  max={10}
                  step={1}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90"
                />
              </label>
            </div>

            <button className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]">
              Log set into current session
            </button>
          </fieldset>
        </form>
      </section>

      <section className="lab-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="text-sm font-semibold text-white/90">Recent sets</div>
          <Link
            href="/exercises"
            className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.06]"
          >
            Back to exercises
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs lab-muted">Last 7d tonnage</div>
            <div className="mt-1 text-lg font-semibold text-white/90">{tonnage7d.toFixed(1)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs lab-muted">Last 28d tonnage</div>
            <div className="mt-1 text-lg font-semibold text-white/90">{tonnage28d.toFixed(1)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs lab-muted">Last performed</div>
            <div className="mt-1 text-sm font-semibold text-white/90">
              {lastPerformedAt ? lastPerformedAt.toLocaleString() : "No sets logged"}
            </div>
          </div>
        </div>

        {recentSets.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/75">
            No sets yet for this exercise.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-white/50">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Reps</th>
                  <th className="py-2 pr-4">Weight</th>
                  <th className="py-2 pr-4">RPE</th>
                  <th className="py-2 pr-4">Pain</th>
                </tr>
              </thead>
              <tbody>
                {recentSets.map((set) => (
                  <tr key={set.id} className="border-t border-white/10 text-white/85">
                    <td className="py-2 pr-4">{new Date(set.performedAt).toLocaleString()}</td>
                    <td className="py-2 pr-4">{set.reps}</td>
                    <td className="py-2 pr-4">{set.weight}</td>
                    <td className="py-2 pr-4">{set.rpe ?? "-"}</td>
                    <td className="py-2 pr-4">{set.pain ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

type RecentSet = {
  performedAt: Date;
  reps: number;
  weight: number;
};

function sumTonnageFromDate(sets: RecentSet[], from: Date) {
  return sets
    .filter((set) => set.performedAt >= from)
    .reduce((total, set) => total + set.reps * set.weight, 0);
}
