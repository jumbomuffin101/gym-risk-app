import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { getActiveWorkoutSession } from "@/app/lib/data/workoutSession";
import { startWorkoutSession, endWorkoutSessionAction } from "@/app/exercises/actions";

export const runtime = "nodejs";

export default async function WorkoutPage() {
  const userId = await requireDbUserId();
  const active = await getActiveWorkoutSession(userId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Workouts</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">
          Workout session
        </h1>
        <p className="mt-1 text-sm lab-muted">
          Start a session, then log sets from an exercise page. Risk updates as you log.
        </p>
      </header>

      {active ? (
        <div className="lab-card lab-hover rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white/90">Active session</div>
              <div className="mt-1 text-xs lab-muted">
                Started {new Date(active.startedAt).toLocaleString()}
              </div>
            </div>

            <form action={endWorkoutSessionAction}>
              <input type="hidden" name="sessionId" value={active.id} />
              <button
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
              >
                End session
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="text-xs uppercase tracking-wide lab-muted">Session id</div>
            <div className="mt-1 text-xs text-white/70 font-mono break-all">{active.id}</div>
          </div>

          <div className="rounded-xl border border-[rgba(34,197,94,0.18)] bg-[rgba(34,197,94,0.06)] p-3">
            <div className="text-xs uppercase tracking-wide text-white/70">
              Next move
            </div>
            <div className="mt-1 text-sm text-white/80">
              Open an exercise and log sets to drive risk signals.
            </div>
          </div>
        </div>
      ) : (
        <div className="lab-card lab-hover rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white/90">No active session</div>
              <div className="mt-1 text-xs lab-muted">Start one to begin logging.</div>
            </div>

            <form action={startWorkoutSession}>
              <button
                className="lab-hover rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-sm font-semibold text-black"
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(34,197,94,0.25), 0 18px 55px rgba(34,197,94,0.12)",
                }}
              >
                Start session
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
