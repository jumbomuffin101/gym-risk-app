export const runtime = "nodejs";

import Link from "next/link";
import { AuthButtons } from "./components/AuthButtons";
import { getOrCreateDbUserId } from "@/lib/auth/getUserId";
import { getActiveWorkoutSession } from "@/lib/data/workoutSession";
import ActiveSessionBanner from "./components/ActiveSessionBanner";

export default async function HomePage() {
  const userId = await getOrCreateDbUserId();
  const activeSession = await getActiveWorkoutSession(userId);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Gym Risk</h1>
          <p className="text-zinc-400">
            Log sessions, track load, and get explainable risk flags.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <AuthButtons />
          <Link
            href="/exercises"
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800"
          >
            Browse exercises
          </Link>
          <Link
            href="/workouts"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Go to workouts
          </Link>
        </div>

        {activeSession ? (
          <ActiveSessionBanner sessionId={activeSession.id} />
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="text-sm text-zinc-300">
              No active session. Start one from{" "}
              <Link className="text-emerald-400 hover:underline" href="/workouts">
                Workouts
              </Link>
              .
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="text-xs text-zinc-400">Step 1</div>
            <div className="mt-1 font-medium">Start a session</div>
            <div className="mt-2 text-sm text-zinc-400">
              Create an active workout session you can add sets into.
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="text-xs text-zinc-400">Step 2</div>
            <div className="mt-1 font-medium">Log sets</div>
            <div className="mt-2 text-sm text-zinc-400">
              Track reps/weight/RPE and compute volume + risk label.
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="text-xs text-zinc-400">Step 3</div>
            <div className="mt-1 font-medium">Explainable risk</div>
            <div className="mt-2 text-sm text-zinc-400">
              Show why a set/session got flagged (spike, pain, etc).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

