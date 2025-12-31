import { getOrCreateDbUserId } from "@/lib/auth/getUserId";
import { getActiveWorkoutSession } from "@/lib/data/workoutSession";
import { startWorkoutSession, endWorkoutSessionAction } from "../exercises/[id]/actions";

export const runtime = "nodejs";

export default async function WorkoutPage() {
  const userId = await getOrCreateDbUserId();
  const active = await getActiveWorkoutSession(userId);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workout Session</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Start a session, then log sets from an exercise page.
          </p>
        </div>

        {active ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">Active session</div>
                <div className="text-xs text-zinc-400">
                  Started {new Date(active.startedAt).toLocaleString()}
                </div>
              </div>

              <form action={endWorkoutSessionAction}>
                <input type="hidden" name="sessionId" value={active.id} />
                <button className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm hover:bg-zinc-800">
                  End session
                </button>
              </form>
            </div>

            <div className="text-xs text-zinc-500">
              Session id: <span className="font-mono">{active.id}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">No active session</div>
                <div className="text-xs text-zinc-400">Start one to begin logging.</div>
              </div>

              <form action={startWorkoutSession}>
                <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">
                  Start session
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
