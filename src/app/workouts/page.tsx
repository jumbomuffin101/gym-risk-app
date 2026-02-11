import Link from "next/link";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { getActiveWorkoutSession } from "@/app/lib/data/workoutSession";
import { startOrResumeWorkoutAction, endWorkoutAction } from "@/app/workouts/actions";

export const runtime = "nodejs";

export default async function WorkoutPage() {
  const userId = await requireDbUserId();
  const active = await getActiveWorkoutSession(userId);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-10 pt-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Workouts</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">Session control</h1>
      </header>

      {active ? (
        <div className="lab-card rounded-2xl p-5 space-y-3">
          <div className="text-sm text-white/90">Session in progress</div>
          <div className="text-xs text-white/60">Started {new Date(active.startedAt).toLocaleString()}</div>
          <div className="flex gap-2">
            <Link href={`/workouts/new?sessionId=${active.id}`} className="rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-xs font-semibold text-black">
              Resume workout
            </Link>
            <form action={endWorkoutAction}>
              <input type="hidden" name="sessionId" value={active.id} />
              <button className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/80">End workout</button>
            </form>
          </div>
        </div>
      ) : (
        <div className="lab-card rounded-2xl p-5 flex items-center justify-between gap-3">
          <div className="text-sm text-white/75">No active session.</div>
          <form action={startOrResumeWorkoutAction}>
            <button className="rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-xs font-semibold text-black">New workout</button>
          </form>
        </div>
      )}
    </div>
  );
}
